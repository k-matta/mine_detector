// import './style.css'
// import rocketLogo from '/rocket.png'
import { DiscordSDK } from "@discord/embedded-app-sdk";
try {
	let auth;
	const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
	setupDiscordSdk().then(() => {
		const script = document.body.lastChild;
		document.getElementById("title").hidden = true;
		document.getElementById("game").style.display = "flex";
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
		auth = await discordSdk.commands.authenticate({
			access_token
		});
		
		if (auth == null) {
			throw new Error("Authenticate command failed");
		}
	}
} catch(e) {
	document.body.innerHTML += "<p>Uh oh! There was an error authenticating this client. Please close and reopen the game to try again.<br>If the problem persists, please contact support.</p>";
}