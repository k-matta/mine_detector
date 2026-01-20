import './style.css'
import rocketLogo from '/rocket.png'
import { DiscordSDK } from "@discord/embedded-app-sdk";

let auth;

document.querySelector('#app').innerHTML = `
  <div>
	<img src="${rocketLogo}" class="logo" alt="Discord" />
	<h1>Hello, World!</h1>
  </div>
`;

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

setupDiscordSdk().then(() => {
	console.log("Discord SDK ready.");

	appendVoiceChannelName();
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
	
	const response = await fetch("https://mine-detector.onrender.com/api/token", {
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
	
	if (auth == null) {
		throw new Error("Authenticate command failed");
	}
}

async function appendVoiceChannelName() {
	const app = document.getElementById("app");

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


