import './style.css'
import rocketLogo from '/rocket.png'
import { DiscordSDK } from "@discord/embedded-app-sdk";

const app = document.getElementById("app");
const symbols = ["⬜","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","💣"];

let auth;
let board;
let inGame = true;
let lose = false;
const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

setupDiscordSdk().then(() => {
	console.log("Discord SDK ready.");

	appendVoiceChannelName();
	appendGuildAvatar();
	board = generateBoard(20, 50);
	const outerBoard = document.createElement("div");
	outerBoard.id = "main-baord";
	app.appendChild(outerBoard);
	for (let i = 0; i < 20; i++) {
		const row = document.createElement("div");
		row.classList.add('row');
		for (let j = 0; j < 20; j++) {
			const gridItem = document.createElement("div");
			gridItem.classList.add("grid");
			gridItem.id = `${i}-${j}`;
			gridItem.addEventListener('click', clickGrid);
			gridItem.innerHTML = '🟦';
			row.appendChild(gridItem);	
		}
		outerBoard.appendChild(row);
	}
});

async function setupDiscordSdk() {
	await discordSdk.ready();

	const { code } = await discordSdk.commands.authorize({
		client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
		response_type: "code",
		state: "",
		prompt: "none",
		scope: [
			"identify",
			"guilds",
			"applications.commands"
		],
	});
	
	const response = await fetch("/api/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			code
		})
	});

	const json = await response.json();
	// const { access_token } = await response.json();

	const access_token = json.access_token;
	console.log("Access Token:", access_token);
	auth = await discordSdk.commands.authenticate({
		access_token
	});
	console.log(auth);
	
	if (auth == null) {
		throw new Error("Authenticate command failed");
	}
}

async function appendVoiceChannelName() {
	let activityChannelName = "Unknown";

	// Requesting the channel in GDMs (when the guild ID is null)
	// Requires the dm_channels.read scope which requires DIscord approval
	if (discordSdk.channelId != null && discordSdk.guildId != null) {
		const channel = await discordSdk.commands.getChannel({channel_id: discordSdk.channelId});
		if (channel.name != null) {
			activityChannelName = channel.name;
		}
	}

	const textTag = document.createElement('p');
	textTag.innerText = `Activity Channel: "${activityChannelName}"`;
	app.appendChild(textTag);
}

async function appendGuildAvatar() {
	const guilds = await fetch("https://discord.com/api/v10/users/@me/guilds", {
		headers: {
			Authorization: `Bearer ${auth.access_token}`,
			"Content-Type": 'application/json'
		}
	}).then((response) => response.json());

	const currentGuild = guilds.find((g) => g.id === discordSdk.guildId);

	if (currentGuild != null) {
		const guildImg = document.createElement('img');
		guildImg.setAttribute('src', `https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.webp?size=128`);
		guildImg.setAttribute('width', '128px');
		guildImg.setAttribute('height', '128px');
		guildImg.setAttribute('style', 'border-radius: 50%;');
		app.appendChild(guildImg);
	}
}

function mulberry32(seed) {
	return function() {
		let t = (seed += 0x6D2B79F5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function generateBoard(size, mines, seed = null) {
	if (!seed) {
		const curDate = new Date();
		seed = curDate.getTime();
	}
	const rand = mulberry32(seed);
	const board = [];
	let bombs = 0;
	while (bombs < mines) {
		for (let i = 0; i < size; i++) {
			const row = [];
			for (let j = 0; j < size; j++) {
				if (row[j] == 9) continue;
				let bomb = Math.floor(rand()*size*size/mines);
				if (bomb == (size*size/mines)-1) {
					bombs++;
					bomb = 9;
				}
				try {
					board[i][j]
				} catch(e) {
					row.push(bomb);
				}
			}
			if (board.length == size) continue;
			board.push(row);
		}
	}
	for (let i = 0; i < size; i++) {
		for (let j = 0; j < size; j++) {
			let adjacent = 0;
			if (board[i][j] == 9) continue;
			for (let di = -1; di < 2; di++) {
				try {
					for (let dj = -1; dj < 2; dj++) {
						if (!dj && !di) continue;
						try {
							if (board[i+di][j+dj] == 9) adjacent++;
						} catch (e) {
							continue;
						}
					}
				} catch(e) {
					continue;
				}
			}
			board[i][j] = adjacent;			
		}
	}
	return board;
}

function clickGrid() {
	manageCalls(this);
}

function manageCalls(source) {
	const i = Number(current.id.split("-")[0]);
	const j = Number(current.id.split("-")[1]);
	console.log("COORDS:", i, j);
	console.log("NUMBER:", board[i][j]);
	if (board[i][j] == 9) {
		source.innerHTML = symbols[9];
		source.removeEventListener("click", clickGrid);
		endGame();
		return;
	}
	const alrClicked = [source];
	const elements = [source];
	while (elements.length) {
		const current = elements[0];
		const i = Number(current.id.split("-")[0]);
		const j = Number(current.id.split("-")[1]);
		current.innerHTML = symbols[board[i][j]];
		if (!board[i][j]) {
			for (let di = -1; di < 2; di++) {
				for (let dj = -1; dj < 2; dj++) {
					if (!dj && !di) continue;
					const next = document.getElementById(`${i+di}-${j+dj}`);
					if (next) {
						if ((!alrClicked.find((item) => next.id == item.id)) && (!elements.find((item) => next.id == item.id))) {
							elements.push(next);
						}
					}
				}
			}
		}
		current.removeEventListener("click", clickGrid);
		alrClicked.push(elements[0]);
		elements.splice(0, 1);
	}
}

function endGame() {
	for (const gridItem of document.getElementsByClassName("grid")) {
		if (gridItem.innerHTML == '🟦') {
			gridItem.removeEventListener("click", clickGrid);
			gridItem.innerHTML = symbols[board[Number(source.id.split("-")[0])][source.id.split("-")[1]]];
			lose = true;
		}
	}
}


