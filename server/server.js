import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import * as path from 'path';
import { fileURLToPath } from 'url';
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { Game } from "./game.js";
import * as gameSocket from "./websockets.js";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: ["../.env", "/etc/secrets/.env"] });

const app = express();
const port = process.env.PORT;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const corsOptions = {
	origin: '*',
	optionsSuccessStatus: 200
};
app.set('images', path.join(__dirname, "/public/images"));
app.set('views', path.join(__dirname, "/views"));
app.set('view engine', 'pug');
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ extended: true }));
app.disable("x-powered-by");
app.use(cors(corsOptions));

const server = createServer(app);
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

// Setup:
io.on('connection', (socket) => {
	const id = socket.handshake.auth.userId;

	socket.on("generate", (gameData, callback) => {
		gameSocket.generateHandler(games, gameData, callback);

		socket.on("uncover", (coords, callback) => {
			gameSocket.uncoverHandler(games[id], coords, callback);
		});

		socket.on("flag", (coords, callback) => {
			gameSocket.flagHandler(games[id], coords, callback);
		});

		socket.on("unflag", (coords, callback) => {
			gameSocket.unflagHandler(games[id], coords, callback);
		});

		socket.on("pause", (callback) => {
			gameSocket.pauseHandler(games[id], callback);
		});

		socket.on("play", (callback) => {
			gameSocket.playHandler(games[id], callback);
		});

		socket.on("disconnect", () => {
			delete games[id];
		});
	
	});
});

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

	games[req.body.code] = new Game();
});

server.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});

io.engine.on("connection_error", (err) => {
	console.log(`Socket conntection error:\nERROR: ${err}\nERROR NAME: ${err.name}\nERROR MESSAGE: ${err.message}\nERROR CAUSE: ${err.cause}`);
});