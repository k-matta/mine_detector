import { Game } from "./game.js";
/**
 * The socket.io callback function for responding to the client.
 * @callback WebsocketCallback
 * @param {any} data The data to send to the client.
 * @returns {void}
 */

/**
 * Generates a Mine Detector game board.
 * @param {Object<string, Game>} games The object containing all active games.
 * @param {Object<string, Number>} gameData A list of parameters to define how to generate the game.
 * @param {WebsocketCallback} callback The callback function for responding to the client.
 * @returns {void}
 */
export function generateHandler(games, gameData, callback) {
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
		games[`${id}`] = new Game();
		console.log(typeof(games[id]));
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
	if (game.isOver()) {
		callback({error: "Game cannot be modified if game is over."});
		return;
	}
	if (game.isPaused()) {
		callback({error: "No actions allowed while game is paused."});
		return;
	}
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
	} if (square.isFlagged() || !square.isCovered()) {
		callback({error: "Square connot be uncovered"});
		return;
	}
	if (!game.getStarted()) game.start();
	const gameStatus = game.clickGridItem(square);
	game.calculateTime();
	callback({changes: game.getChanges(), seed: gameStatus ? game.getSeed() : null, win: gameStatus == "won", time: game.getTime(), updated: Date.now()});
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
	} if (square.isFlagged() || !square.isCovered()) {
		callback({error: "Square connot be flagged"});
		return;
	}
	game.removeFlag();
	square.setFlag();
	let win = false;
	if (!game.getValidRemaining() && !game.getFlagsRemaining()) {
		game.winGame();
		win = true;
	} else {
		game.calculateTime();
	}
	callback({flags: game.getFlagsRemaining(), time: game.getTime(), updated: Date.now(), win, seed: game.getSeed()});
}

/**
 * Removes a flag on the square the user clicked on.
 * @param {Game} game The user's game.
 * @param {Array<Number>} coords The coordinates of the target square.
 * @param {WebsocketCallback} callback The callback function for responding to the client.
 * @returns {void}
 */
export function unflagHandler(game, coords, callback) {
	if (game.isOver()) {
		callback({error: "Game cannot be modified if game is over."});
		return;
	}
	if (game.isPaused()) {
		callback({error: "No actions allowed while game is paused."});
		return;
	}
	const square = game.getItem(...coords);
	if (!square) {
		callback({error: "Invalid coordinates"});
		return;
	} if (!square.isFlagged()) {
		callback({error: "Square connot be unflagged"});
		return;
	}
	game.addFlag();
	square.clearFlag();
	game.calculateTime();
	callback({flags: game.getFlagsRemaining(), time: game.getTime(), updated: Date.now()});
}

/**
 * Pauses the game.
 * @param {Game} game The user's game.
 * @param {WebsocketCallback} callback The callback function for responding to the client.
 * @returns {void}
 */
export function pauseHandler(game, callback) {
	if (game.isOver()) {
		callback({error: "Game cannot be modified if game is over."});
		return;
	}
	if (game.isPaused()) {
		callback({error: "Game is already paused."});
		return;
	}
	game.pause();
	game.calculateTime();
	callback({success: "Game Paused.", time: game.getTime(), updated: game.timeEvents[game.timeEvents.length-1]});
}

/**
 * Resumes the user's game.
 * @param {Game} game The user's game.
 * @param {WebsocketCallback} callback The callback function for responding to the client.
 * @returns {void}
 */
export function playHandler(game, callback) {
	if (game.isOver()) {
		callback({error: "Game cannot be modified if game is over."});
		return;
	}
	if (!game.isPaused()) {
		callback({error: "Game is not paused."});
		return;
	}
	game.resume();
	game.calculateTime();
	callback({changes: game.getChanges(), flags: game.getFlagsRemaining(), time: game.getTime(), updated: Date.now()});
	game.clearChanges();
}