import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
// import { setTimeout } from "timers/promises";
// import { body } from "express-validator";
import * as path from 'path';
import { fileURLToPath } from 'url';
// import { type } from 'node:os';
// import { Cache, foodCache } from './classes_and_functions/cache.js';
// import { validationCheck } from './classes_and_functions/functions.js';
// import { makeNonceCode, loggedIn, sesionUpdate } from './classes_and_functions/sesions.js';
// import sesionHandler from './middleware/sesionHandler.js';
// import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
var crypto = await import("node:crypto");
import { Game, GridItem} from "./game.js";
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
// app.use((req, res, next) => {
// 	console.log(req.url);
// 	next();
// });
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
	console.log("New connection: " , socket.handshake.auth.userId);
	// socket.join(socket.handshake.auth.userId);
	// console.log("Socket joined ", socket.handshake.auth.userId);
	socket.on("generate", (gameData, callback) => {
		if (typeof(games[id]) == "object") {
			if (!games[id].isOver()) {
				callback({error: "Game already in progress."});
				return;
			}
		}
		let boardSize, mines, seed;
		try {
			({boardSize, mines, seed} = gameData);
		} catch(e) {
			callback({error: "Invalid parameters"});
		}
		if (typeof(boardSize) != "number" || typeof(mines) != "number" || (typeof(seed) != "number" && seed)) callback({error: "Invalid parameters"});
		try {
			games[`${id}`] = new Game();
			console.log(typeof(games[id]));
			games[`${id}`].generateGameBoard(boardSize, mines, seed);
		} catch(err) {
			console.log(err);
			callback({error: "Invalid parameters"});
			return;
		}
		callback({id, size: games[id].getSize(), flags: games[id].getFlagsRemaining()});
		console.log("Board created");
	});

	socket.on("uncover", (coords, callback) => {
		if (games[id].isOver()) {
			callback({error: "Game cannot be modified if game is over."});
			return;
		}
		if (games[id].isPaused()) {
			callback({error: "No actions allowed while game is paused."});
			return;
		}
		const square = games[id].getItem(...coords);
		if (!square) {
			callback({error: "Invalid coordinates"});
			return;
		} if (square.isFlagged() || !square.isCovered()) {
			callback({error: "Square connot be uncovered"});
			return;
		}
		if (!games[id].getStarted()) games[id].start();
		const gameStatus = games[id].clickGridItem(square);
		games[id].calculateTime();
		callback({changes: games[id].getChanges(), seed: gameStatus ? games[id].getSeed() : null, win: gameStatus == "won", time: games[id].getTime(), updated: Date.now()});
		games[id].clearChanges();
		if (gameStatus) {
			games[id].setOver();
		}
	});

	socket.on("flag", (coords, callback) => {
		if (games[id].isOver()) {
			callback({error: "Game cannot be modified if game is over."});
			return;
		}
		if (games[id].isPaused()) {
			callback({error: "No actions allowed while game is paused."});
			return;
		} if (!games[id].getFlagsRemaining()) {
			callback({error: "No flags left to use"})
		}
		if (coords.length > 2 || coords.length < 2) {
			callback({error: "Invalid parameters."});
			return;
		}
		if (typeof(coords[0]) != "number" || typeof(coords[1]) != "number") {
			callback({error: "Invalid parameters"});
			return;
		}
		const square = games[id].getItem(...coords);
		if (!square) {
			callback({error: "Invalid coordinates"});
			return;
		} if (square.isFlagged() || !square.isCovered()) {
			callback({error: "Square connot be flagged"});
			return;
		}
		games[id].removeFlag();
		square.setFlag();
		let win = false;
		if (!games[id].getValidRemaining() && !games[id].getFlagsRemaining()) {
			games[id].winGame();
			win = true;
		} else {
			games[id].calculateTime();
		}
		callback({flags: games[id].getFlagsRemaining(), time: games[id].getTime(), updated: Date.now(), win, seed: games[id].getSeed()});
	});

	socket.on("unflag", (coords, callback) => {
		if (games[id].isOver()) {
			callback({error: "Game cannot be modified if game is over."});
			return;
		}
		if (games[id].isPaused()) {
			callback({error: "No actions allowed while game is paused."});
			return;
		}
		const square = games[id].getItem(...coords);
		if (!square) {
			callback({error: "Invalid coordinates"});
			return;
		} if (!square.isFlagged()) {
			callback({error: "Square connot be unflagged"});
			return;
		}
		games[id].addFlag();
		square.clearFlag();
		games[id].calculateTime();
		callback({flags: games[id].getFlagsRemaining(), time: games[id].getTime(), updated: Date.now()});
	});

	socket.on("pause", (callback) => {
		if (games[id].isOver()) {
			callback({error: "Game cannot be modified if game is over."});
			return;
		}
		if (games[id].isPaused()) {
			callback({error: "Game is already paused."});
			return;
		}
		games[id].pause();
		games[id].calculateTime();
		callback({success: "Game Paused.", time: games[id].getTime(), updated: games[id].timeEvents[games[id].timeEvents.length-1]});
	});

	socket.on("play", (callback) => {
		if (games[id].isOver()) {
			callback({error: "Game cannot be modified if game is over."});
			return;
		}
		if (!games[id].isPaused()) {
			callback({error: "Game is not paused."});
			return;
		}
		games[id].resume();
		games[id].calculateTime();
		callback({changes: games[id].getChanges(), flags: games[id].getFlagsRemaining(), time: games[id].getTime(), updated: Date.now()});
		games[id].clearChanges();
	});

	socket.on("disconnect", () => {
		delete games[id];
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