import { io } from "socket.io-client";

let codeElement = document.getElementById("code");
const code = codeElement.innerText;
document.body.removeChild(codeElement);
codeElement = null;
console.log("CODE:", code);

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
	 * @typedef {Object} gridData
	 * @property {Number} val The value of the current square.
	 * @property {Number} i The x-coordinate of the current square.
	 * @property {Number} j The y-coordinate of the current square.
	 */
	
	/**
	 * @typedef {Object} updateData
	 * @property {Array<gridData} changes The changes to the current state of the board.
	 * @property {Number} unflagged If game over, the number of unflagged bombs on the board; otherwise, null.
	 */

	/**
	 * Updates the current game board and the state of the game (win/lose)
	 * @param {updateData} gameData The data needed to update the game board.
	 * @returns {Array<Array<Number>> | null} An array of coordinate arrays if game lost; null otherwise.
	 */
	updateGame(gameData) {
		const badFlags = [];
		let flagChange = 0;
		for (let i = 0; i < gameData.length; i++) {
			const square = gameData[i];
			const newItem = new GridItem(square.i, square.j, square.val);
			this.addChange(newItem);
			const oldItem = this.getItem(square.i, square.j)
			oldItem.isFlagged() && !newItem.isFlagged() ? flagChange++ : !this.getItem(square.i, square.j).isFlagged() && newItem.isFlagged() ? flagChange-- : flagChange = flagChange;
			if (newItem.isMine() && !oldItem.isFlagged()) badFlags.push(newItem.getCoords());
			if (!newItem.isMine() && oldItem.isFlagged()) badFlags.push(newItem.getCoords());
			this.setItem(newItem);
		}
		this.setFlagsRemaining(this.getFlagsRemaining() + flagChange);
		return badFlags;
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
const online = document.getElementById("pvp");
const hideOver = document.getElementById("over-hide");
const showOver = document.getElementById("over-show");
const time = document.getElementById("time");
const flagIndicator = document.getElementById("flags-remaining");
const pause = document.getElementById("pause");
const play = document.getElementById("play");
const symbols = ["⬜","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","💣", "🚩", "🟦"];

const game = new Game();

let timerId = 0;

async function startGame(boardSize, mines, seed="") {
	console.log(boardSize, mines, seed, typeof(seed));
	const res = await socket.emitWithAck("generate", {boardSize, mines, seed});
	console.log(JSON.stringify(res));
	if (res.error) {
		parameterError();
		return;
	}
	console.log("Response:", JSON.stringify(res));
	game.generateGameBoard(res);
	home.style.display = "none";
	app.style.display = "block";
	createInnerBoard(game);
	flagIndicator.innerText = res.flags;

	// Force board styles for pausing
	const style = window.getComputedStyle(document.getElementById("board-container"));
	// Width
	const wap = parseFloat(style.width);
	const paddingLeft = parseFloat(style.paddingLeft);
	const paddingRight = parseFloat(style.paddingRight);
	const width = wap - paddingLeft - paddingRight;
	// Height
	const hap = parseFloat(style.height);
	const paddingTop = parseFloat(style.paddingTop);
	const paddingBottom = parseFloat(style.paddingBottom);
	const height = hap - paddingTop - paddingBottom;
	//Force Styles
	document.getElementById("board-container").style.width = String(width) + "px";
	document.getElementById("board-container").style.height = String(height) + "px";

	time.innerText = "0:00";
	timerId = setInterval(() => {
		let [min, sec] = time.innerText.split(":").map((a) => Number(a));
		sec++;
		if (sec > 59) {
			sec = "00";
			min++;
		} else if (sec < 10) {
			sec = `0${sec}`;
		}
		time.innerText = `${min}:${sec}`;
	}, 1000);
}

/**
 * Create the HTML game board based on current game data
 * @param {Game} game The current game object.
 */
function createInnerBoard(game) {
	let outerBoard = document.getElementById("board-container");
	if (!outerBoard) {
		outerBoard = document.createElement("section");
		outerBoard.id = "board-container";
		app.appendChild(outerBoard);
	}
	const innerBoard = document.createElement("div");
	innerBoard.id = "main-board";
	outerBoard.appendChild(innerBoard)
	for (let i = 0; i < game.getSize(); i++) {
		console.log("running loop")
		const row = document.createElement("div");
		row.classList.add('row');
		for (let j = 0; j < game.getSize(); j++) {
			const gridItem = document.createElement("div");
			gridItem.classList.add("grid");
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
	flagIndicator.innerText = game.getFlagsRemaining();
}

/**
 * Update the HTML game board based on the changes to current game data.
 * @param {Game} game The current game object.
 */
function updateInnerBoard(game) {
	let outerBoard = document.getElementById("board-container");
	const innerBoard = document.createElement("div");
	innerBoard.id = "main-board";
	outerBoard.appendChild(innerBoard)
	for (let change of game.getChanges()) {
		const gridItem = document.getElementById(`${change.getCoords()[0]}-${change.getCoords()[1]}`);
		if (!change.isCovered()) {
			gridItem.removeEventListener('click', clickGrid);
			gridItem.removeEventListener('contextmenu', rClickGrid);
			gridItem.classList.remove('covered');
		}
		gridItem.innerHTML = symbols[change.getValue()];
	}
	flagIndicator.innerText = game.getFlagsRemaining();
}

/**
 * Generates a game board with a specified size, number of mines, and, optionally, a seed.
 * @param {Number} size X and Y dimension of game board
 * @param {Number} mines The number of mines on the board
 * @param {Number | null} seed Seed the RNG to replay a specific board
 * @returns {null}
 */
function generateBoard(size, mines, seed = null) {
	if (!seed) {
		console.log("Generating Seed");
		const curDate = new Date();
		seed = curDate.getTime();
	}
	console.log(seed);
	globalSeed = seed;
	const rand = mulberry32(seed);
	const board = [];
	let bombs = 0;
	let boardString = "";
	while (bombs < mines) {
		for (let i = 0; i < size; i++) {
			const row = [];
			for (let j = 0; j < size; j++) {
				if (bombs == mines) break;
				try {
					if (board[i][j] == 9) continue;
				} catch {}

				const square = new GridItem(i, j, Math.floor(rand()*10));
				console.log(j, i, bomb, "bomb?", bomb == 9)
				if (square.isMine()) {
					bombs++;
					console.log("Coords: (" + String(j) + ", " + String(i) + ")");
					console.log(board.length, row.length)
					console.log(board);
				}
				try {
					console.log(board[i])
					board[i][j] = square;
					console.log('Inserted');
					console.log(board[i])
				} catch(e) {
					console.log(e);
					console.log("Added to row");
					row.push(square);
					console.log(row);
				}
				console.log("Bombs:", bombs, "\nMines:", mines, "\nExit?", bombs == mines);
				// boardString += String(bomb) + "\t";
			}
			// boardString += "\n";
			if (board.length == size) continue;
			board.push(row);
			console.log("Row was pushed");
		}
		// console.log(boardString);
		boardString = "";
	}
	for (let i = 0; i < size; i++) {
		for (let j = 0; j < size; j++) {
			let adjacent = 0;
			if (board[i][j] == 9) continue;
			// console.log(j, i);
			for (let di = -1; di < 2; di++) {
				try {
					for (let dj = -1; dj < 2; dj++) {
						if (!dj && !di) continue;
						try {
							if (board[i+di][j+dj] == 9) adjacent++;
						} catch (e) {
							continue;
						}
					}
				} catch(e) {
					continue;
				}
			}
			board[i][j].setValue(adjacent);
			console.log(adjacent);
		}
	}
	return board;
}

function endGame(badFlags, seed) {
	let unflagged = 0;
	for (let i = 0; i < game.getSize(); i++) {
		for (let j = 0; j < game.getSize(); j++) {
			const item = game.getItem(i, j);
			const itemHTML = document.getElementById(`${i}-${j}`);
			if ((itemHTML.innerText == symbols[10] || itemHTML.innerText == symbols[11])) {
				itemHTML.removeEventListener("click", clickGrid);
				itemHTML.removeEventListener("contextmenu", rClickGrid);
				itemHTML.classList.remove("covered");
				console.log(item.getValue());
				itemHTML.innerHTML = symbols[item.getValue()];
				if (badFlags.find((square) => square[0] == i && square[1] == j)) {
					itemHTML.style.backgroundColor = "red";
					if (item.isMine()) unflagged++;
				} else if (item.isMine()) {
					itemHTML.style.backgroundColor = "lightgreen";
				}
			}
		}
	}
	overScreen.children[1].innerHTML = "Game Over!"
	overScreen.children[2].innerHTML = `You had ${unflagged} ${unflagged == 1 ? "mine" : "mines"} remaining!<br>${overScreen.children[2].innerHTML}`;
	gameOver(seed);
}

function winGame() {
	for (let i = 0; i < game.getSize(); i++) {
		for (let j = 0; j < game.getSize(); j++) {
			const item = game.getItem(i, j);
			if (!item.isFlagged()) continue;
			const itemHTML = document.getElementById(`${i}-${j}`);
			itemHTML.removeEventListener("click", clickGrid);
			itemHTML.removeEventListener("contextmenu", rClickGrid);
		}
	}
	const time = 0;
	overScreen.children[1].innterHTML = "You Win!";
	overScreen.children[2].innerHTML = `Your time: ${time*1000} seconds.<br>${overScreen.children[2].innerHTML}`;
	gameOver();
}

function gameOver(seed) {
	overScreen.children[2].children[1].innerText = seed;
	overScreen.style.display = "block";
	game.setFlagsRemaining(0);
	game.clearInGame();
	clearInterval(timerId);
}

standard.addEventListener("click", async () => {
	await startGame(20, 50);
});

custom.addEventListener("click", () => {
	customForm.style.display = "block";
});

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

mines.addEventListener("input", () => {
	minesDisplay.innerText = mines.value;
});

hideOver.addEventListener("click", () => {
	overScreen.style.display = "none";
	showOver.style.display = "block";
});

showOver.addEventListener("click", () => {
	overScreen.style.display = "block";
	showOver.style.display = "none";
});

customStart.addEventListener("click", async (event) => {
	event.preventDefault();
	const sizeVal = Number(size.value);
	const minesVal = Number(mines.value);

	if (document.getElementById("seed").value) {
		if (isNaN(document.getElementById("seed").value)) {
			alert("Seed must be a number.");
		} else {
			await startGame(sizeVal, minesVal, Number(document.getElementById("seed").value));
			size.value = 20;
			sizeDisplay.innerText = 20;
			mines.value = 50;
			minesDisplay.innerText = 50;
			document.getElementById("seed").value = "";
			customForm.style.display = "none";
		}
	} else {
		await startGame(sizeVal, minesVal);
		size.value = 20;
		sizeDisplay.innerText = 20;
		mines.value = 50;
		minesDisplay.innerText = 50;
		document.getElementById("seed").value = "";
		customForm.style.display = "none";
	}
});

pause.addEventListener("click", () => {
	if (!game.getInGame()) return;
	clearInterval(timerId);

	document.getElementById("board-container").removeChild(document.getElementById("main-board"));
	pause.style.display = "none";
	play.style.display = "inline-block";
});

play.addEventListener("click", () => {
	if (!game.getInGame()) return;
	timerId = setInterval(() => {
		let [min, sec] = time.innerText.split(":").map((a) => Number(a));
		sec++;
		if (sec > 59) {
			sec = "00";
			min++;
		} else if (sec < 10) {
			sec = `0${sec}`;
		}
		time.innerText = `${min}:${sec}`;
	}, 1000);
	createInnerBoard(game);
	pause.style.display = "inline-block";
	play.style.display = "none";
});

returner.addEventListener("click", () => {
	app.removeChild(app.children[1]);
	app.style.display = 'none';
	overScreen.style.display = "none";
	overScreen.children[1].innerText = "";
	overScreen.children[2].innerHTML = overScreen.children[2].innerHTML.split("<br>")[1];
	overScreen.children[2].children[0].innerText = "";
	home.style.display = "block";
});

async function clickGrid() {
	const item = game.getItem(Number(this.id.split("-")[0]), Number(this.id.split("-")[1]));
	if (!item) return;
	if (!item.isFlagged()) {
		const res = await socket.emitWithAck("uncover", [Number(this.id.split("-")[0]), Number(this.id.split("-")[1])]);
		console.log(JSON.stringify(res));
		if (!res.error) {
			const badFlags = game.updateGame(res.changes);
			if (!res.seed) {
				updateInnerBoard(game);
			} else {
				console.log(badFlags);
				endGame(badFlags, res.seed);
				
			}
		}
		// manageCalls(item);
	}
}

async function rClickGrid(event) {
	event.preventDefault()
	const item = game.getItem(Number(this.id.split("-")[0]), Number(this.id.split("-")[1]));
	if (game.getFlagsRemaining() && item.isCovered() && !item.isFlagged()) {
		const res = await socket.emitWithAck("flag", [Number(this.id.split("-")[0]), Number(this.id.split("-")[1])]);
		if (res.error) return;
		this.classList.add("flagged");
		item.setFlag();
		this.innerHTML = symbols[10];
		game.setFlagsRemaining(res.flags);
		if (!game.getFlagsRemaining()) {
			flagIndicator.style.backgroundColor = "#AA0000";
		}
	} else if (item.isFlagged()) {
		const res = await socket.emitWithAck("unflag", [Number(this.id.split("-")[0]), Number(this.id.split("-")[1])]);
		if (res.error) return;
		this.classList.remove("flagged");
		item.clearFlag();
		this.innerHTML = symbols[11];
		game.setFlagsRemaining(res.flags);
		flagIndicator.style.backgroundColor = "#4a4a4a";
	}
	flagIndicator.innerText = game.getFlagsRemaining();
}

socket.on("connect_error", (err) => {
	console.log(`Socket conntection error:\nERROR: ${err}\nERROR NAME: ${err.name}\nERROR MESSAGE: ${err.message}\nERROR CAUSE: ${err.cause}`);
});

socket.onAnyOutgoing((eventName, ...args) => {
	console.log(eventName, args);
});