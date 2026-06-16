// Import dependencies
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import * as path from 'path';
import { fileURLToPath } from 'url';
import cors from "cors";
import { createServer } from "node:http";
import cookieParser from "cookie-parser"; 
import { Server } from "socket.io";
import { Game } from "./server_game.js";
import * as gameSocket from "./websockets.js";
import crypto from "node:crypto";
import * as cookie from "cookie";
import * as helmet from "helmet";

// Create server constants.
const app = express();
const port = process.env.PORT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
	origin: '*',
	credentials: true,
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
app.use(cookieParser());
app.use(helmet());

const server = createServer(app);

// Create and configure websocket server
const io = new Server(server, {
	cors: {
		origin: process.env.CORS_ALLOW.split(","),
		methods: ["GET", "POST"],
		credentials: true
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
	// Ensure client is authenticated
	const cookieHeader = socket.handshake.headers.cookie;

	if (!cookieHeader) return;
	const cookies = cookie.parse(cookieHeader);
	if (!cookies) return;
	const token = cookies.session;
	if (!token) return;

	const id = crypto.createHash('sha256').update(token).digest("hex");

	try {
		games[id].clearSelfDestruct();
		games[id].resume();
	} catch(e) {}

	// Generate game
	socket.on("generate", (gameData, callback) => {
		gameSocket.generateHandler(games, id, gameData, callback);
	});

	// Uncover square
	socket.on("uncover", async (coords, callback) => {
		await gameSocket.uncoverHandler(games[id], coords, callback);
	});

	// Flag square
	socket.on("flag", async (coords, callback) => {
		await gameSocket.flagHandler(games[id], coords, callback);
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
		try {
			if (!games[id].isOver()) {
				games[id].pause();
				games[id].setSelfDestruct();
			} else {
				delete games[id];
			}
		} catch(e) {}
		socket.removeAllListeners();
	});
});

// Authenticate clients
app.post("/api/token", async (req, res) => {
	if (!req.body.code) {
		res.sendStatus(401);
		return;
	}
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
	
	// Retrieving the user's ID for the database records.
	const userRes = await fetch("https://discord.com/api/users/@me", {
		headers: {
			"Authorization": `Bearer ${access_token}`
		}
	});

	// Generating authentication for user
	const user = await userRes.json();
	const sessionCode = crypto.randomBytes(32).toString("base64url");
	const hashed = crypto.createHash("sha256").update(sessionCode).digest("hex");
	games[hashed] = new Game(Number(user.id));

	// Setting authenticated cookie.
	res.cookie("session", sessionCode, {
		httpOnly: true,
		secure: true,
		sameSite: "none",
		partitioned: true,
		maxAge: 24*60*60*1000,
		domain: `${process.env.VITE_DISCORD_CLIENT_ID}.discordsays.com`
	});

	// Return the access_token to our client as { access_token: "..."}
	res.send({access_token});
});

// Route for future non-Discord gaming
// app.post("/login", async (req, res) => {
// 	const cookieHeader = req.cookies;
// 	let ID;
// 	if (!cookieHeader) {
// 		ID = crypto.randomUUID();
// 		res.cookie("auth", ID, {
// 			httpOnly: true,
// 			secure: true,
// 			sameSite: "strict",
// 			partitioned: true,
// 			maxAge: 100000*24*60*60*1000,
// 		});
// 	}
// 	if (!cookieHeader.session) {
// 		ID = crypto.randomUUID();
// 		res.cookie("auth", ID, {
// 			httpOnly: true,
// 			secure: true,
// 			sameSite: "strict",
// 			partitioned: true,
// 			maxAge: 100000*24*60*60*1000,
// 		});
// 	} else {
// 		ID = cookieHeader.session;
// 	}
// 	games[ID] = new Game(crypto.randomBytes(8).toString("utf-8"));
// });

server.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});

io.engine.on("connection_error", (err) => {
	console.log(`Socket conntection error:\nERROR: ${err}\nERROR NAME: ${err.name}\nERROR MESSAGE: ${err.message}\nERROR CAUSE: ${err.cause}`);
});