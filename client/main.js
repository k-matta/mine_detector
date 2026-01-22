import './style.css'
import rocketLogo from '/rocket.png'
import { DiscordSDK } from "@discord/embedded-app-sdk";

const app = document.getElementById("app");

let auth;
console.log(import.meta.env.VITE_DISCORD_CLIENT_ID);
app.innerHTML = `
  <div>
	<img src="${rocketLogo}" class="logo" alt="Discord" />
	<h1>Hello, World!</h1>
  </div>
`;

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

setupDiscordSdk().then(() => {
	console.log("Discord SDK ready.");

	appendVoiceChannelName();
	appendGuildAvatar();
	const board = generateBoard(20, 10);
	let boardHTML = "<div id='main-board'>";
	for (let i = 0; i < 20; i++) {
		boardHTML += "<div class='row'>"
		for (let j = 0; j < 20; j++) {
			boardHTML += `<div class='grid'>${board[i][j] === 9 ? '💣' : board[i][j]}</div>`;
		}
		boardHTML += '</div>';
	}
	boardHTML += "</div>";
	app.innerHTML = boardHTML;
});

async function setupDiscordSdk() {
	await discordSdk.ready();
	console.log("Discord SDK ready.");

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

	console.log("Code:", code);
	
	const response = await fetch("/api/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			code
		})
	});
	console.log("Status:", response.status);
	const json = await response.json();
	// const { access_token } = await response.json();
	console.log("Response:", JSON.stringify(json));
	const access_token = json.access_token;
	console.log("Access Token:", access_token);
	
	auth = await discordSdk.commands.authenticate({
		access_token
	});
	
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
			console.log("Channel Name:", channel.name);
			console.log(channel);
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
				const bomb = Math.floor(rand()*size*size/mines);
				if (bomb == (size*size/mines)-1) {
					bombs++;
				}
				try {
					board[i][j]
				} catch(e) {
					row.push(9);
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
	console.log(board);
}









