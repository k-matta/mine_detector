import { io } from "socket.io-client";

// Get client code
let codeElement = document.getElementById("code");
const code = codeElement.innerText;
document.body.removeChild(codeElement);
codeElement = null;

/**
 * The main Mine-Detector Game object.
 * @class
 */
class Game {
	constructor() {
		/** @type {Number} The size of the board */
		this.size = 0;
		/** @type {Array<Array<GridItem>>} The current state of the game board */
		this.board = [];
		/** @type {Number} The number of flags remaining */
		this.flagsRemaining = 0;
		/** @type {Array<GridItem>} The items changed since the last time the board was updated. */
		this.changes = [];
		/** @type {Boolean} Whether or not the game is paused */
		this.paused = false;
		/** @type {Boolean} Whether or not the game has started */
		this.isStarted = false;
	}

	/**
	 * Start the game timer.
	 */
	start() {
		this.isStarted = true;
	}

	/**
	 * Indicates whether or not the game has been started.
	 * @return {Boolean} true if the game has been started; false otherwise.
	 */
	getStarted() {
		return this.isStarted;
	}

	/**
	 * Get the size of the current game board.
	 * @returns {Number} The size of the current game board.
	 */
	getSize() {
		return this.size;
	}

	/**
	 * Set the size of the game board.
	 * @param {Number} size The size of the game board.
	 */
	setSize(size) {
		this.size = size;
	}

	/**
	 * Get the number of flags left to use.
	 * @returns {Number} The number of flags the user has remaining.
	 */
	getFlagsRemaining() {
		return this.flagsRemaining;
	}

	/**
	 * Increase the number of flags left to use (i.e., a flag was removed from the board).
	 */
	addFlag() {
		this.flagsRemaining++;
	}

	/**
	 * Decrease the number of flags left to use (i.e., a flag was added to the board).
	 */
	removeflag() {
		this.flagsRemaining--;
	}

	/**
	 * Set the number of flags left to use.
	 * @param {Number} flags The number of flags the user has available.
	 */
	setFlagsRemaining(flags) {
		this.flagsRemaining = flags;
	}

	/**
	 * Add a change since the board's last update.
	 * @param {GridItem} change The new change to add.
	 */
	addChange(change) {
		this.changes.push(change);
	}

	/**
	 * Get the changes since the last board update.
	 * @returns {Array<GridItem>} The array of changes.
	 */
	getChanges() {
		return this.changes;
	}

	/**
	 * Clear the list of changes since the last board update.
	 */
	clearChanges() {
		this.changes = [];
	}

	/**
	 * Sets the game's state to paused.
	 */
	pause() {
		this.paused = true;
		this.board = [];
	}

	/**
	 * Indicates whether the game is paused.
	 * @returns {Boolean} true if the game is paused; false otherwise.
	 */
	isPaused() {
		return this.paused;
	}

	/**
	 * @typedef {Object} gridData
	 * @property {Number} val The value of the current square.
	 * @property {Number} i The x-coordinate of the current square.
	 * @property {Number} j The y-coordinate of the current square.
	 */

	/**
	 * Resumes the game.
	 * @param {Array<gridData>} changes The current state of the game board to resume from.
	 */
	resume(changes) {
		this.paused = false;
		for (let i = 0; i < this.size; i++) {
			let row = [];
			for (let j = 0; j < this.size; j++) {
				const index = i * this.size + j;
				const square = new GridItem(changes[index].i, changes[index].j, changes[index].val);
				row.push(square);
			}
			this.board.push(row);
		}
	}

	/**
	 * Retrieves a square on the grid.
	 * @param {Number} i The x-coordinate of the square to get.
	 * @param {Number} j The y-coordinate of the square to get.
	 * @returns {GridItem | null} The requested square or null if the coordinates are invalid.
	 */
	getItem(i, j) {
		if (typeof(i) != "number" || typeof(j) != "number") return;
		if (0 <= i && i < this.size && 0 <= j && j < this.size) {
			return this.board[i][j];
		} return;
	}

	/**
	 * Sets a square on the grid.
	 * @param {GridItem} item The new gridItem for the board.
	 * @param {Number | null} i The x-coordinate of the square to change.
	 * @param {Number | null} j The y-coordinate of the square to change.
	 */
	setItem(item, i = null, j = null) {
		if (!i || !j) {
			this.board[item.getCoords()[0]][item.getCoords()[1]] = item;
			return;
		} else if (typeof(i) != "number" || typeof(j) != "number") return;
		if (0 <= i && i < this.size && 0 <= j && j < this.size) {
			this.board[i][j] = item;
		}
	}

	/**
	 * @typedef {Object} gameStartData
	 * @property {Number} size The size of the game board.
	 * @property {Number} flags The number of flags available to the user.
	 */

	/**
	 * Generate an empty starting board with all squares covered.
	 * @param {gameStartData} gameData The game setup parameters.
	 */
	generateGameBoard(gameData) {
		if (gameData.size < 2) throw new Error("Invalid board size.");
		
		this.setSize(gameData.size);
		this.setFlagsRemaining(gameData.flags);
		this.board = [];
		for (let i = 0; i < this.size; i++) {
			const row = [];
			for (let j = 0; j < this.size; j++) {
				row.push(new GridItem(i, j, 11));
			}
			this.board.push(row);
		}
	}
	
	/**
	 * @typedef {Object} updateData
	 * @property {Array<gridData} changes The changes to the current state of the board.
	 * @property {Number} unflagged If game over, the number of unflagged bombs on the board; otherwise, null.
	 */

	/**
	 * Updates the current game board and the state of the game (win/lose)
	 * @param {updateData} gameData The data needed to update the game board.
	 * @returns {Array<Array<Number>> | Array<null>} An array of coordinate arrays if game lost; null otherwise.
	 */
	updateGame(gameData) {
		const badFlags = [];
		let flagChange = 0;

		for (let i = 0; i < gameData.length; i++) {
			const square = gameData[i];
			// Generate square based on returned data
			const newItem = new GridItem(square.i, square.j, square.val);
			this.addChange(newItem);
			const oldItem = this.getItem(square.i, square.j);

			// COmpare previous state of square to determine what changed.
			oldItem.isFlagged() && !newItem.isFlagged() ? flagChange++ : !this.getItem(square.i, square.j).isFlagged() && newItem.isFlagged() ? flagChange-- : flagChange = flagChange;
			
			// If the game finished and an item was incorrectly flagged, record it
			if (newItem.isMine() && !oldItem.isFlagged()) badFlags.push(newItem.getCoords());
			if (!newItem.isMine() && oldItem.isFlagged()) badFlags.push(newItem.getCoords());
			
			// Set the new item on the board.
			this.setItem(newItem);
		}

		// Set the number of flags left.
		this.setFlagsRemaining(this.getFlagsRemaining() + flagChange);
		return badFlags;
	}

	/**
	 * Reset the game's data.
	 */
	reset() {
		this.size = 0;
		this.board = [];
		this.flagsRemaining = 0;
		this.changes = [];
		this.paused = false;
		this.isStarted = false;
	}
}

/**
 * A square within the Mine-Detector game grid.
 * @class
 */
class GridItem {
	/**
	 * The constructor for the Mine-Detector GridItem class.
	 * @param {Number} i The x-coordinate of the grid item.
	 * @param {Number} j The y-coordinate of the grid item.
	 * @param {Number} value The value (covered, flagged, bomb, number) of the grid item.
	 * @param {Boolean} covered Whether or not this grid item is covered.
	 * @param {Boolean} flagged Whether or not this grid item has been flagged.
	 */
	constructor(i, j, value) {
		/** @type {Number} The x-coordinate of the grid item. */
		this.i = i;
		/** @type {Number} j The y-coordinate of the grid item. */
		this.j = j;
		/** @type {Number} value The value (covered, flagged, bomb, number) of the grid item. */
		this.value = value;
		/** @type {Boolean} covered Whether or not this grid item is covered. */
		this.covered = this.value > 9 ? true : false;
		/** @type {Boolean} flagged Whether or not this grid item has been flagged. */
		this.flagged = this.value == 10 ? true : false;
	}

	/**
	 * Returns the coordinates of the current grid item as an array.
	 * @returns {Array<Number>} The x- and y-coordinates of the current grid item.
	 */
	getCoords() {
		return [this.i, this.j];
	}

	/**
	 * Indicates whether the current grid item is a bomb.
	 * @returns {Boolean} true if the grid item is a bomb; false otherwise.
	 */
	isMine() {
		return this.value == 9;
	}

	/**
	 * Sets the value of the current grid item (number from 0-11).
	 * @param {Number} value The value of the current grid item.
	 */
	setValue(value) {
		this.value = value;
	}

	/**
	 * Retrieves the value of the current grid item.
	 * @returns {Number} Returns the item's value.
	 */
	getValue() {
		return this.value;
	}

	/**
	 * Marks the current grid item as flagged and sets its value accordingly.
	 */
	setFlag() {
		this.flagged = true;
		this.setValue(10);
	}

	/**
	 * Removes a flag from the current grid item and sets its value accordingly.
	 */
	clearFlag() {
		this.flagged = false;
		this.setValue(11);
	}

	/**
	 * Indicates whether the current grid item is flagged.
	 * @returns {Boolean} true if the item is flagged; false otherwise.
	 */
	isFlagged() {
		return this.flagged;
	}

	/**
	 * Marks the grid item as uncovered and sets its value accordingly.
	 * @param {Number} value The value to set the grid item to.
	 */
	clearCover(value) {
		this.covered = false;
		this.setValue(value);
	}
	
	/**
	 * Indicates whether the current grid item is covered.
	 * @returns {Boolean} true if the item is covered; false otherwise.
	 */
	isCovered() {
		return this.covered;
	}
}

// Create websocket conneciton.
const socket = io(import.meta.env.VITE_SERVER_URL, {
	auth: {userId: code},
	path: "/socket/"
});

// Defining important HTMLELement constants.
const home = document.getElementById("menu");
const app = document.getElementById("app");
const gameDisplay = document.getElementById("game");
const customForm = document.getElementById("c-form");
const customStart = document.getElementById("start-custom");
const overScreen = document.getElementById("over");
const returner = document.getElementById("return");
const standard = document.getElementById("standard");
const size = document.getElementById("size");
const sizeDisplay = document.getElementById("size-display");
const mines = document.getElementById("mines");
const minesDisplay = document.getElementById("mines-display");
const custom = document.getElementById("custom");
// const online = document.getElementById("pvp");
const hideOver = document.getElementById("over-hide");
const showOver = document.getElementById("over-show");
const time = document.getElementById("time");
const flagIndicator = document.getElementById("flags-remaining");
const pause = document.getElementById("pause");
const play = document.getElementById("play");
const symbols = ["⬜","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","💣", "🚩", "🟦"];

// Create a game object for the client.
const game = new Game();

// The ID for the client-side clock.
let timerId = 0;

/**
 * Turns a Date.now() number into a string formatted as 'minutes:seconds'.
 * @param {Number} time The time to format.
 * @returns {String} The formatted time.
 */
function getReadableTime(time) {
	let sec = Math.floor(time/1000) % 60;
		if (sec < 10) {
			sec = `0${sec}`;
		}
		let min = Math.floor(time/60000);
	return `${min}:${sec}`;
}

/**
 * Updates the on-screen timer once per second.
 */
function mainTimer() {
	let [min, sec] = time.innerText.split(":").map((a) => Number(a));
	sec++;
	if (sec > 59) {
		sec = "00";
		min++;
	} else if (sec < 10) {
		sec = `0${sec}`;
	}
	time.innerText = `${min}:${sec}`;
}

/**
 * Updates the on-screen clock just once to account for an offset that is less than one second.
 */
function tempTimer() {
	let [min, sec] = time.innerText.split(":").map((a) => Number(a));
	sec++;
	if (sec > 59) {
		sec = "00";
		min++;
	} else if (sec < 10) {
		sec = `0${sec}`;
	}
	time.innerText = `${min}:${sec}`;
	clearInterval(timerId);
	timerId = setInterval(mainTimer, 1000);
}

/**
 * Updates the on-screen timer after syncing with the server.
 * @param {Number} gameTime The time elapsed according to the server.
 * @param {Number} updated The timestamp at which the server time was calculated.
 * @param {Boolean} clearPrevious Whether or not to clear the previous timer function.
 */
function updateTimer(gameTime, updated, clearPrevious) {

	// Calculate total time, accounting for network delay.
	const currentTime = Date.now();
	const totalTime = gameTime + currentTime - updated;

	// Clear previous timer if necessary.
	if (clearPrevious) clearInterval(timerId);
	time.innerText = getReadableTime(totalTime);

	// Set the temporary correction timer to run to keep the client and server times synced.
	const offset = totalTime % 1000;
	timerId = setInterval(tempTimer, 1000-offset);
}

/**
 * Sends a start request to the server and generates the client-side game.
 * @param {Number} boardSize The siize of the game board.
 * @param {Number} mines The number of mines on the board.
 * @param {Number} seed The game seed.
 * @returns 
 */
async function startGame(boardSize, mines, seed="") {
	// Tell the server to start a game.
	const res = await socket.emitWithAck("generate", {boardSize, mines, seed});
	
	// DIsplay an error message if necessary.
	if (res.error) {
		console.log(res.error)
		const err = document.createElement("p");
		err.id = 'err';
		err.style.margin = '20px';
		err.style.padding = '10px';
		err.style.backgroundColor = '#500';
		err.style.borderRadius = '5px';
		err.style.fontSize = '0.5em';
		err.innerText = "Uh oh! Looks like you tried to enter invalid parameters! Please do not attempt to modify the form.";
		gameDisplay.inserBefore(document.getElementById("c-form"), err);
		return;
	}
	
	// If successful, remove previous error messages.
	try {
		document.removeElement(document.getElementById("err"));
	} catch {}

	// Generate and display the client board.
	game.generateGameBoard(res);
	home.style.display = "none";
	app.style.display = "block";
	createInnerBoard(game);
	flagIndicator.innerText = res.flags;

	// Force board styles for pausing the game.
	const style = window.getComputedStyle(document.getElementById("board-container"));
	// Force width
	const wap = parseFloat(style.width);
	const paddingLeft = parseFloat(style.paddingLeft);
	const paddingRight = parseFloat(style.paddingRight);
	const width = wap - paddingLeft - paddingRight;
	// Force height
	const hap = parseFloat(style.height);
	const paddingTop = parseFloat(style.paddingTop);
	const paddingBottom = parseFloat(style.paddingBottom);
	const height = hap - paddingTop - paddingBottom;
	// Set styles
	document.getElementById("board-container").style.width = String(width) + "px";
	document.getElementById("board-container").style.height = String(height) + "px";

	// Set the timer but do not start it until the user clicks a square.
	time.innerText = "0:00";
}

/**
 * Create the HTML game board based on current game data
 * @param {Game} game The current game object.
 */
function createInnerBoard(game) {
	// Get the outer board. If it doesn't exist, create one.
	let outerBoard = document.getElementById("board-container");
	if (!outerBoard) {
		outerBoard = document.createElement("section");
		outerBoard.id = "board-container";
		app.appendChild(outerBoard);
	}

	// Get the inner board. If it doesn't exist, create one.
	let innerBoard = document.getElementById("main-board");
	if (!innerBoard) {
		innerBoard = document.createElement("div");
		innerBoard.id = "main-board";
	}
	outerBoard.appendChild(innerBoard);

	// Create the HTML board elements 
	for (let i = 0; i < game.getSize(); i++) {
		// Create board rows
		const row = document.createElement("div");
		row.classList.add('row');
		for (let j = 0; j < game.getSize(); j++) {
			// Create squares within each row
			const gridItem = document.createElement("div");
			gridItem.classList.add("grid");

			// Set each square to uncovered, covered, or flagged based on game data.
			if (game.getItem(i, j).isFlagged() || game.getItem(i, j).isCovered()) {
				gridItem.addEventListener('click', clickGrid);
				gridItem.addEventListener('contextmenu', rClickGrid);
				gridItem.classList.add('covered');
			}
			gridItem.innerHTML = symbols[game.getItem(i, j).getValue()];
			gridItem.id = `${i}-${j}`;
			row.appendChild(gridItem);
		}
		innerBoard.appendChild(row);
	}

	// Set the number of remaining flags
	flagIndicator.innerText = game.getFlagsRemaining();
}

/**
 * Update the HTML game board based on the changes to current game data.
 * @param {Game} game The current game object.
 */
function updateInnerBoard(game) {
	// Get the outerboard 
	let outerBoard = document.getElementById("board-container");

	// Get the inner board. If it doesn't exist, create one.
	let innerBoard = document.getElementById("main-board");
	if (!innerBoard) {
		innerBoard = document.createElement("div");
		innerBoard.id = "main-board";
	}
	outerBoard.appendChild(innerBoard);

	// For each change:
	for (let change of game.getChanges()) {
		// Get the modified square
		const gridItem = document.getElementById(`${change.getCoords()[0]}-${change.getCoords()[1]}`);
		try {
			// Remove event listeners, if any.
			if (!change.isCovered()) {
				gridItem.removeEventListener('click', clickGrid);
				gridItem.removeEventListener('contextmenu', rClickGrid);
				gridItem.classList.remove('covered');
			}
		} catch (e) {
			console.log(e);
		}
		// Set square value
		gridItem.innerHTML = symbols[change.getValue()];
	}
	// Update the number of available flags.
	flagIndicator.innerText = game.getFlagsRemaining();
	game.clearChanges();
}

/**
 * Reveals all board items and removes event listeners.
 * @param {Array<Array<Number>>} badFlags An array of coordinate arrays representing incorrect flgs (or missing flags).
 * @param {Number} seed The game seed.
 */
function endGame(badFlags, seed) {
	let unflagged = 0;
	for (let i = 0; i < game.getSize(); i++) {
		for (let j = 0; j < game.getSize(); j++) {
			const item = game.getItem(i, j);
			const itemHTML = document.getElementById(`${i}-${j}`);
			// If still covered, remove event listeners and reveal values.
			if ((itemHTML.innerText == symbols[10] || itemHTML.innerText == symbols[11])) {
				itemHTML.removeEventListener("click", clickGrid);
				itemHTML.removeEventListener("contextmenu", rClickGrid);
				itemHTML.classList.remove("covered");
				itemHTML.innerHTML = symbols[item.getValue()];

				// Highlight incorrect and correct flags.
				if (badFlags.find((square) => square[0] == i && square[1] == j)) {
					itemHTML.style.backgroundColor = "red";
					if (item.isMine()) unflagged++;
				} else if (item.isMine()) {
					itemHTML.style.backgroundColor = "lightgreen";
				}
			}
		}
	}

	// Set game over message.
	overScreen.children[1].innerText = "Game Over!"
	overScreen.children[2].innerHTML = `You had ${unflagged} ${unflagged == 1 ? "mine" : "mines"} remaining!<br>${overScreen.children[2].innerHTML}`;
	gameOver(seed);
}

/**
 * @typedef {Object} dbSuccess A message to indicate success for a database operation.
 * @property {String} success A short success message.
*/
/**
 * @typedef {Object} dbError An error message returned from database operations.
 * @property {String} error A description of the error.
*/
/**
 * @typedef {Object} recordData An object containing information about a user's high score.
 * @property {Number?} time The fastest time the user has gotten on a standard game, if known; null otherwise.
 * @property {Number | String?} seed The seed of the game, if known; "unknown" otherwise.
 * @property {String?} set_on The date the record was set, if known; "unknown" otherwise.
 */

/**
 * Cleans up the game board when the user wins.
 * @param {Number} gameTime The time taken to win the game.
 * @param {Number} seed The game seed.
 * @param {dbError | dbSuccess | recordData} record The user's record (if not beaten) or an error or success code depending on the database response.
 */
function winGame(gameTime, seed, record) {
	for (let i = 0; i < game.getSize(); i++) {
		for (let j = 0; j < game.getSize(); j++) {
			const item = game.getItem(i, j);

			// If the square is flagged, remove event listeners.
			if (!item.isFlagged()) continue;
			const itemHTML = document.getElementById(`${i}-${j}`);
			itemHTML.removeEventListener("click", clickGrid);
			itemHTML.removeEventListener("contextmenu", rClickGrid);
		}
	}
	// Set game win message.
	overScreen.children[1].innterText = "You Win!";
	overScreen.children[2].innerHTML = `Your time: ${gameTime/1000} seconds.<br>${overScreen.children[2].innerHTML}`;
	if (record.success) {
		overScreen.children[2].innerHTML = "<strong>You set a new record!</strong><br>" + overScreen.children[2].innerHTML;
	} else if (record.time) {
		let recordDate;
		if (record.date != "unknwon") {
			recordDate = new Date(record.date);
			recordData = recordDate.toLocaleString();
		}
		overScreen.children[2].innerHTML += `<br>Your best time was <strong>${getReadableTime(record.time)}</strong> with seed <strong>${record.seed}</strong> set on date <strong>${recordDate}</strong>.`;
	} else {
		overScreen.children[2].innerHTML += "<br>There was an error setting or retrieving your record."
	}
	gameOver(seed);
}

/**
 * Ends the game.
 * @param {Number} seed The game seed.
 */
function gameOver(seed) {

	// Reveal the game seed.
	overScreen.children[2].children[1].innerText = seed;
	overScreen.style.display = "block";

	// Reset the game.
	game.reset();
	flagIndicator.style.backgroundColor = "#4a4a4a";

	// Stop timer.
	clearInterval(timerId);
}

// Standard game button
standard.addEventListener("click", async () => {
	await startGame(20, 50);
});

// Custom game button
custom.addEventListener("click", () => {
	customForm.style.display = "block";
});

// Game board size slider
size.addEventListener("input", () => {
	const sizeVal = Number(size.value);
	let maxMines = sizeVal*sizeVal;
	mines.max = maxMines;
	if (Number(mines.value) > maxMines) {
		mines.value = maxMines;
		minesDisplay.innerText = maxMines;
	}
	sizeDisplay.innerText = sizeVal;
});

// Number of mines slider.
mines.addEventListener("input", () => {
	minesDisplay.innerText = mines.value;
});

// Hide game over message.
hideOver.addEventListener("click", () => {
	overScreen.style.display = "none";
	showOver.style.display = "block";
});

// Show game over message.
showOver.addEventListener("click", () => {
	overScreen.style.display = "block";
	showOver.style.display = "none";
});

// Start custom game button.
customStart.addEventListener("click", async (event) => {

	// Get form values.
	event.preventDefault();
	const sizeVal = Number(size.value);
	const minesVal = Number(mines.value);

	// Make sure seed is valid.
	if (document.getElementById("seed").value) {
		if (isNaN(document.getElementById("seed").value)) {
			alert("Seed must be a number.");
		} else {
			// Start game with custom seed and reset form.
			await startGame(sizeVal, minesVal, Number(document.getElementById("seed").value));
			size.value = 20;
			sizeDisplay.innerText = 20;
			mines.value = 50;
			minesDisplay.innerText = 50;
			document.getElementById("seed").value = "";
			customForm.style.display = "none";
		}
	} else {
		// Start game without custom seed and reset form.
		await startGame(sizeVal, minesVal);
		size.value = 20;
		sizeDisplay.innerText = 20;
		mines.value = 50;
		minesDisplay.innerText = 50;
		document.getElementById("seed").value = "";
		customForm.style.display = "none";
	}
});

// Pause game button.
pause.addEventListener("click", async () => {

	// Ignore if game is already paused.
	if (game.isPaused()) return;

	// Tell server to pause game.
	const res = await socket.emitWithAck("pause");

	// If there is an error, ignore pause command.
	if (res.error) {
		console.log(res.error);
		return;
	}

	// Stop timer and pause game.
	clearInterval(timerId);
	game.pause();

	// If the game has already started, update on-screen timer.
	if (game.getStarted()) {
		time.innerText = getReadableTime(res.time);
	}

	// Destroy game board to prevent cheating.
	document.getElementById("board-container").removeChild(document.getElementById("main-board"));
	pause.style.display = "none";
	play.style.display = "inline-block";
});

// Resume game button.
play.addEventListener("click", async () => {
	// Ignore if game is already running.
	if (!game.isPaused()) return;

	// Tell server to resume game.
	const res = await socket.emitWithAck("play");

	// If there is an error, ignore resume command.
	if (res.error) {
		console.log(res.error);
		return;
	}

	// If the game has started, update (and resume) the timer.
	if (game.getStarted()) {
		updateTimer(res.time, res.updated, false);
	}

	// Resume game object and recreate game board
	game.resume(res.changes);
	createInnerBoard(game);
	pause.style.display = "inline-block";
	play.style.display = "none";
});

// Return to menu button.
returner.addEventListener("click", () => {
	// Hide game and game over screen, show original menu.
	app.removeChild(app.children[1]);
	app.style.display = 'none';
	overScreen.style.display = "none";
	overScreen.children[1].innerText = "";
	overScreen.children[2].innerHTML = overScreen.children[2].innerHTML.split("<br>")[1];
	overScreen.children[2].children[0].innerText = "";
	home.style.display = "block";
});

/**
 * Handles left-click action on game board.
 * @returns {void}
 */
async function clickGrid() {

	// Get the GridItem object for the square that was clicked and make sure it is valid.
	const item = game.getItem(Number(this.id.split("-")[0]), Number(this.id.split("-")[1]));
	if (!item) return;

	if (item.isFlagged()) return; // Flagged squares cannot be clicked.

	// Tell server to uncover the square.
	const res = await socket.emitWithAck("uncover", [Number(this.id.split("-")[0]), Number(this.id.split("-")[1])]);

	// If there is an error, ignore the command.
	if (res.error) {
		console.log(res.error);
		return;
	}

	// Update the game timer.
	updateTimer(res.time, res.updated, true);

	// Start the game (if it hasn';'t started already).
	game.start();

	// Capture incoorect flags if the game is over.
	const badFlags = game.updateGame(res.changes);

	if (!res.seed) { // Game is not over: update board.
		updateInnerBoard(game);
	} else if (res.win) { // Game win: trigger winGame function.
		winGame(res.time, res.seed, res.record);
	} else { // Game lost: Trigger lose function.
		endGame(badFlags, res.seed);
	}
}

/**
 * Handles right-click aciton on game board.
 * @param {Event} event The click event.
 * @returns {void}
 */
async function rClickGrid(event) {
	event.preventDefault()

	// Get the GridItem object for the square that was clicked and make sure it is valid.
	const item = game.getItem(Number(this.id.split("-")[0]), Number(this.id.split("-")[1]));
	if (!item) return;

	// If there are still flags left to use, and the square is not already flagged, flag it.
	if (game.getFlagsRemaining() && item.isCovered() && !item.isFlagged()) {
		// Tell the server to flag the square.
		const res = await socket.emitWithAck("flag", [Number(this.id.split("-")[0]), Number(this.id.split("-")[1])]);

		// If there is an error, ignore the command.
		if (res.error) return;

		// Update the game timer.
		updateTimer(res.time, res.updated, true);

		// Flag the square.
		this.classList.add("flagged");
		item.setFlag();
		this.innerHTML = symbols[10];

		// Update number of remaining flags based on server response.
		game.setFlagsRemaining(res.flags);

		// Change flag background based on whether there are any left.
		if (!game.getFlagsRemaining()) {
			flagIndicator.style.backgroundColor = "#AA0000";
		}

		// If the user has won, trigger winGame function.
		if (res.win) {
			winGame(res.time, res.seed);
		}

	// If the square was flagged, remove the flag.
	} else if (item.isFlagged()) {

		// Tell the server to remove the flag.
		const res = await socket.emitWithAck("unflag", [Number(this.id.split("-")[0]), Number(this.id.split("-")[1])]);

		// If there is an error, ignore the command.
		if (res.error) return;

		// Update the timer.
		updateTimer(res.time, res.updated, true);

		// Remove the flag on the square.
		this.classList.remove("flagged");
		item.clearFlag();
		this.innerHTML = symbols[11];

		// Update number of remaining flags based on server response.
		game.setFlagsRemaining(res.flags);

		// Use default flag background since there is at least one flag remaining.
		flagIndicator.style.backgroundColor = "#4a4a4a";
	}

	// Update indicator for number of remaining flags.
	flagIndicator.innerText = game.getFlagsRemaining();
}

// Log connection errors.
socket.on("connect_error", (err) => {
	console.log(`Socket conntection error:\nERROR: ${err}\nERROR NAME: ${err.name}\nERROR MESSAGE: ${err.message}\nERROR CAUSE: ${err.cause}`);
});