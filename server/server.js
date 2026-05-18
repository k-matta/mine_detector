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
// import { makeNonceCode, loggedIn, sessionUpdate } from './classes_and_functions/sessions.js';
// import sessionHandler from './middleware/sessionHandler.js';
// import cookieParser from "cookie-parser";
var crypto = await import("node:crypto");
// import * as gameFuncs from "game.js";
dotenv.config({ path: "../.env" });

const app = express();
const port = process.env.PORT;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup:
app.set('images', path.join(__dirname, "/public/images"));
app.set('views', path.join(__dirname, "/views"));
app.set('view engine', 'pug');
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ extended: true }));

app.post("/api/token", async (req, res) => {
	
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
	console.log(access_token);
	// Return the access_token to our client as { access_token: "..."}
	res.send({access_token});
});

app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});
