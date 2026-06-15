import { Game } from "./server_game.js";
import { updateIfRecord } from "./db.js";
/**
 * The socket.io callback function for responding to the client.
 * @callback WebsocketCallback
 * @param {any} data The data to send to the client.
 * @returns {void}
 */

/**
 * Generates a Mine Detector game board.
 * @param {Object<string, Game>} games The object containing all active games.
 * @param {String} id The id used to identify the user.
 * @param {Object<string, Number>} gameData A list of parameters to define how to generate the game.
 * @param {WebsocketCallback} callback The callback function for responding to the client.
 * @returns {void}
 */
export function generateHandler(games, id, gameData, callback) {
	// Check if valid game exists
	if (typeof(games[id]) == "object") {
		if (!games[id].isOver()) {
			callback({error: "Game already in progress."});
			return;
		}
	} else {
		return; // Game should have been created when client authenticated. No game means no valid client.
	}

	// Extract game parameters from client data.
	let boardSize, mines, seed;
	try {
		({boardSize, mines, seed} = gameData);
	} catch(e) {
		callback({error: "Invalid parameters"});
	}

	// Ensure parameters are valid and generate game board.
	if (typeof(boardSize) != "number" || typeof(mines) != "number" || (typeof(seed) != "number" && seed)) callback({error: "Invalid parameters"});
	try {
		// games[`${id}`] = new Game();
		games[`${id}`].generateGameBoard(boardSize, mines, seed);
	} catch(err) {
		console.log(err);
		callback({error: "Invalid parameters"});
		return;
	}
	// Send client data.
	callback({id, size: games[id].getSize(), flags: games[id].getFlagsRemaining()});
}

/**
 * Uncovers the square that the user clicked on.
 * @param {Game} game The user's game
 * @param {Array<Number>} coords The coordinates of the target square.
 * @param {WebsocketCallback} callback The callback function for responding to the client.
 * @returns {void}
 */
export function uncoverHandler(game, coords, callback) {

	// Make sure action is valid.
	if (!game) return;
	if (game.isOver()) {
		callback({error: "Game cannot be modified if game is over."});
		return;
	}
	if (game.isPaused()) {
		callback({error: "No actions allowed while game is paused."});
		return;
	}

	// Make sure coordinates are valid.
	if (coords.length > 2 || coords.length < 2) {
		callback({error: "Invalid parameters."});
		return;
	}
	if (typeof(coords[0]) != "number" || typeof(coords[1]) != "number") {
		callback({error: "Invalid parameters"});
		return;
	}
	const square = game.getItem(...coords);
	if (!square) {
		callback({error: "Invalid coordinates"});
		return;
	}

	// Make sure the square can be uncovered.
	if (square.isFlagged() || !square.isCovered()) {
		callback({error: "Square connot be uncovered"});
		return;
	}

	// If this is the first click of the game, start the timer.
	if (!game.getStarted()) game.start();

	// Check if the user lost the game.
	const gameStatus = game.clickGridItem(square);

	// Calculate the time since the game started to sync the client timer.
	game.calculateTime();

	// Update user record, if required. Otherwise, retrieve record data.
	const timeStamp = new Date();
	let record;
	console.log(game.getStandard());
	if (gameStatus == "won" && game.getStandard()) {
		console.log("won");
		record = updateIfRecord(game.getUserId(), game.getTime(), game.getSeed(), timeStamp.toISOString());
	}

	// Send changes to the client.
	callback({changes: game.getChanges(), seed: gameStatus ? game.getSeed() : null, win: gameStatus == "won", time: game.getTime(), updated: timeStamp.getTime(), record});

	// Clear list of changes and end the game if necessary.
	game.clearChanges();
	if (gameStatus) {
		game.setOver();
	}
}

/**
 * Sets a flag on the square the user clicked on.
 * @param {Game} game The user's game.
 * @param {Array<Number>} coords The coordinates of the target square.
 * @param {WebsocketCallback} callback The callback function for responding to the client.
 * @returns {void}
 */
export function flagHandler(game, coords, callback) {

	// Make sure action is valid.
	if (!game) return;
	if (game.isOver()) {
		callback({error: "Game cannot be modified if game is over."});
		return;
	}
	if (game.isPaused()) {
		callback({error: "No actions allowed while game is paused."});
		return;
	} if (!game.getFlagsRemaining()) {
		callback({error: "No flags left to use"})
	}

	// Make sure coordinates are valid.
	if (coords.length > 2 || coords.length < 2) {
		callback({error: "Invalid parameters."});
		return;
	}
	if (typeof(coords[0]) != "number" || typeof(coords[1]) != "number") {
		callback({error: "Invalid parameters"});
		return;
	}
	const square = game.getItem(...coords);
	if (!square) {
		callback({error: "Invalid coordinates"});
		return;
	}
	
	// Make sure the square can be flagged.
	if (square.isFlagged() || !square.isCovered()) {
		callback({error: "Square connot be flagged"});
		return;
	}

	// Flag the square.
	game.removeFlag();
	square.setFlag();
	let win = false;
	let record;

	// Check if the user has won and calculate elapsed time to sync the client.
	const timeStamp = new Date();
	if (!game.getValidRemaining() && !game.getFlagsRemaining()) {
		game.winGame();
		console.log(game.getStandard());
		if (game.getStandard())
			console.log("won");
			record = updateIfRecord(game.getUserId(), game.getTime(), game.getSeed(), timeStamp.toISOString());
		win = true;
	} else {
		game.calculateTime();
	}

	// Send changes to the client.
	callback({flags: game.getFlagsRemaining(), time: game.getTime(), updated: timeStamp.getTime(), win, seed: game.getSeed(), record});
}

/**
 * Removes a flag on the square the user clicked on.
 * @param {Game} game The user's game.
 * @param {Array<Number>} coords The coordinates of the target square.
 * @param {WebsocketCallback} callback The callback function for responding to the client.
 * @returns {void}
 */
export function unflagHandler(game, coords, callback) {

	// Make sure action is valid.
	if (!game) return;
	if (game.isOver()) {
		callback({error: "Game cannot be modified if game is over."});
		return;
	}
	if (game.isPaused()) {
		callback({error: "No actions allowed while game is paused."});
		return;
	}

	// Make sure coordinates are valid.
	if (coords.length > 2 || coords.length < 2) {
		callback({error: "Invalid parameters."});
		return;
	}
	if (typeof(coords[0]) != "number" || typeof(coords[1]) != "number") {
		callback({error: "Invalid parameters"});
		return;
	}
	const square = game.getItem(...coords);
	if (!square) {
		callback({error: "Invalid coordinates"});
		return;
	}

	// Make sure the square can be flagged.
	if (!square.isFlagged()) {
		callback({error: "Square connot be unflagged"});
		return;
	}

	// Remove the flag and calculate elapsed time.
	game.addFlag();
	square.clearFlag();
	game.calculateTime();

	// Send changes to the client.
	callback({flags: game.getFlagsRemaining(), time: game.getTime(), updated: Date.now()});
}

/**
 * Pauses the game.
 * @param {Game} game The user's game.
 * @param {WebsocketCallback} callback The callback function for responding to the client.
 * @returns {void}
 */
export function pauseHandler(game, callback) {

	// Make sure the action is valid.
	if (!game) return;
	if (game.isOver()) {
		callback({error: "Game cannot be modified if game is over."});
		return;
	}
	if (game.isPaused()) {
		callback({error: "Game is already paused."});
		return;
	}

	// Pause the game and calculate elapsed time.
	game.pause();
	game.calculateTime();

	// Send changes to the client.
	callback({success: "Game Paused.", time: game.getTime(), updated: game.timeEvents[game.timeEvents.length-1]});
}

/**
 * Resumes the user's game.
 * @param {Game} game The user's game.
 * @param {WebsocketCallback} callback The callback function for responding to the client.
 * @returns {void}
 */
export function playHandler(game, callback) {

	// Make sure the action is valid.
	if (!game) return;
	if (game.isOver()) {
		callback({error: "Game cannot be modified if game is over."});
		return;
	}
	if (!game.isPaused()) {
		callback({error: "Game is not paused."});
		return;
	}

	// Resume the game and calculate the elapsed time.
	game.resume();
	game.calculateTime();

	// Send the board to the client
	callback({changes: game.getChanges(), flags: game.getFlagsRemaining(), time: game.getTime(), updated: Date.now()});

	// Clear the changes array.
	game.clearChanges();
}