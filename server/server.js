// Import dependencies
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import * as path from 'path';
import { fileURLToPath } from 'url';
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { Game } from "./server_game.js";
import * as gameSocket from "./websockets.js";

// Create server constants.
const app = express();
const port = process.env.PORT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
	origin: '*',
	optionsSuccessStatus: 200
};

// Configure the server
dotenv.config({ path: ["../.env", "/etc/secrets/.env"] });
app.set('images', path.join(__dirname, "/public/images"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ extended: true }));
app.disable("x-powered-by");
app.use(cors(corsOptions));

const server = createServer(app);

// Create and configure websocket server
const io = new Server(server, {
	cors: {
		origin: process.env.CORS_ALLOW.split(","),
		methods: ["GET", "POST"]
	},
	connectionStateRecovery: {
		maxDisconnectionDuration: 2 * 60 * 1000 // 2 minutes
	},
	path: "/socket/"
});

io.serveClient(false);

/** @type {Object.<string, Game>} An object of all current games. */
const games = {};

// Register websocket handlers
io.on('connection', (socket) => {
	const id = socket.handshake.auth.userId;

	// Generate game
	socket.on("generate", (gameData, callback) => {
		gameSocket.generateHandler(games, id, gameData, callback);

		// Uncover square
		socket.on("uncover", (coords, callback) => {
			gameSocket.uncoverHandler(games[id], coords, callback);
		});

		// Flag square
		socket.on("flag", (coords, callback) => {
			gameSocket.flagHandler(games[id], coords, callback);
		});

		// Remove flag
		socket.on("unflag", (coords, callback) => {
			gameSocket.unflagHandler(games[id], coords, callback);
		});

		// Pause game
		socket.on("pause", (callback) => {
			gameSocket.pauseHandler(games[id], callback);
		});

		// Resume game
		socket.on("play", (callback) => {
			gameSocket.playHandler(games[id], callback);
		});

		// On socket disconnect
		socket.on("disconnect", () => {
			delete games[id];
		});
	});
});

// Authenticate clients
app.post("/api/token", async (req, res) => {
	console.log("Beginning authentication");
	// Exchange the code for an access_token
	const response = await fetch(`https://discord.com/api/oauth2/token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			client_id: process.env.VITE_DISCORD_CLIENT_ID,
			client_secret: process.env.DISCORD_CLIENT_SECRET,
			grant_type: "authorization_code",
			code: req.body.code,
		}),
	});
	
	// Retrieve the access_token from the response
	const { access_token } = await response.json();
	console.log("Authentication complete");
	// Return the access_token to our client as { access_token: "..."}
	res.send({access_token});

	// Retrieving the user's ID for the database records.
	const userRes = await fetch("https://discord.com/api/users/@me", {
		headers: {
			"Authorization": `Bearer ${access_token}`
		}
	});

	const {user} = await userRes.json();

	games[req.body.code] = new Game(user.id);
});

server.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});

io.engine.on("connection_error", (err) => {
	console.log(`Socket conntection error:\nERROR: ${err}\nERROR NAME: ${err.name}\nERROR MESSAGE: ${err.message}\nERROR CAUSE: ${err.cause}`);
});