import { DiscordSDK } from "@discord/embedded-app-sdk";
try {
	let auth;
	const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

	// Authenticate with Discord SDK.
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
		
		const { access_token } = await response.json();
		auth = await discordSdk.commands.authenticate({
			access_token
		});
		
		// If authentication fails
		if (auth == null) {
			throw new Error("Authenticate command failed");
		}
	}
	setupDiscordSdk().then(() => {
		// Set up game menus.
		document.getElementById("title").hidden = true;
		document.body.innerHTML = `
		<button type="button" id="over-show">Show</button>
		<section id="game">
			<section id="menu">
				<h1>Welcome to Mine-Detector!</h1>
				<menu>
					<button type="button" id="standard">Start Game!</button>
					<button type="button" id="custom">Custom Game!</button>
				</menu>
			</section>
			<div style="display: none;" id="app">
				<section id="hud">
					<div id="time"></div>
					<button type="button" id="pause">||</button>
					<button type="button" id="play">></button>
					<div id="flags">
						<div id="flag-icon">🚩</div>
						<div id="flags-remaining"></div>
					</div>
				</section>
			</div>
			<form id="c-form">
				<section class="c-input">
					<label for="size">Grid Size:</label>
					<input type="range" id="size" min="10" max="50" step="1" value="20"/>
					<p id="size-display">20</p>
				</section>
				<section class="c-input">
					<label for="mines">Number of Mines:</label>
					<input type="range" id="mines" min="10" max="200" step="1" value="50"/>
					<p id="mines-display">50</p>
				</section>
				<section class="c-input">
					<label for="seed">Board Seed:</label>
					<input type="text" id="seed" pattern="\d+" value="" width="170px"/>
				</section>
				<br>
				<button id="start-custom">Start Custom Game!</button>
				<button id="menu-return">Return to Main Menu</button>
			</form>
			<section id="over">
				<button type="button" id="over-hide">Hide</button>
				<h2></h2>
				<p>Seed: <span></span></p>
				<button type="button" id="return">Return to Menu</button>
			</section>
		</section>`
	
		// Inject game script into HTML.
		const script = document.createElement("script");
		script.src = "/assets/game.js";
		script.type = "module";
		document.body.appendChild(script);
	});
} catch(e) {
	// Display error if authentication fails.
	console.log(e)
	document.body.innerHTML += "<p style='margin:20px; padding: 10px; background-color: #500; border-radius: 5px; font-size: 0.5em;'>Uh oh! There was an error authenticating this client. Please close and reopen the game to try again.<br>If the problem persists, please contact support.</p>";
}
