import { io } from "socket.io-client";

let codeElement = document.getElementById("code");
const code = codeElement.innerText;
document.body.removeChild(codeElement);
codeElement = null;
console.log("CODE:", code);
class Game {
	constructor() {
		this.size = 0;
		this.board = [];
		this.seed = 0;
		this.inGame = false;
		this.flagsRemaining = 0;
		this.validRemaining = 0;
	}
	
	getSize() {
		return this.size;
	}
	
	setSize(size) {
		this.size = size;
	}

	getSeed() {
		return this.seed;
	}

	setSeed(gameSeed) {
		this.seed = gameSeed;
	}

	getFlagsRemaining() {
		return this.flagsRemaining;
	}

	addFlag() {
		this.flagsRemaining++;
	}

	removeflag() {
		this.flagsRemaining--;
	}

	setFlagsRemaining(flags) {
		this.flagsRemaining = flags;
	}

	getValidRemaining() {
		return this.validRemaining;
	}

	removeValid() {
		this.validRemaining--;
	}

	setValidRemaining(valid) {
		this.validRemaining = valid;
	}

	setInGame() {
		this.inGame = true;
	}

	clearInGame() {
		this.inGame = false;
	}

	getInGame() {
		return this.inGame;
	}

	getItem(i, j) {
		if (typeof(i) != "number" || typeof(j) != "number") return;
		if (0 <= i && i < this.size && 0 <= j && j < this.size) {
			return this.board[i][j];
		} return;
	}

	generateGameBoard(boardSize, numMines, gameSeed = null) {
		if (boardSize < 2) throw new Error("Invalid board size.");
		if (numMines >= boardSize*boardSize) throw new Error("Invalid number of mines.");
		if (gameSeed && typeof(gameSeed) != "number") throw new Error("Invalid seed.");

		this.setSize(boardSize);
		this.setFlagsRemaining(numMines);
		this.setValidRemaining(this.size*this.size - this.getFlagsRemaining());
		if (!gameSeed) {
			console.log("Generating Seed");
			const curDate = new Date();
			gameSeed = curDate.getTime();
		}
		console.log(gameSeed);
		const rand = mulberry32(gameSeed);
		this.setSeed(gameSeed);
		this.board = [];
		let bombs = 0;
		while (bombs < numMines) {
			for (let i = 0; i < boardSize; i++) {
				const row = [];
				for (let j = 0; j < boardSize; j++) {
					try {
						if (bombs == numMines && game.getItem(boardSize-1, boardSize-1)) break;
						if (this.board[i][j].isMine()) continue;
					} catch {}
					if (bombs == numMines) row.push(new GridItem(i, hideOver, 0, true, false));
					else {
						const square = new GridItem(i, j, Math.floor(rand()*10), true, false);
						if (square.isMine()) {
							bombs++;
							// console.log("Coords: (" + String(j) + ", " + String(i) + ")");
							// console.log(this.board.length, row.length)
							// console.log(this.board);
						}
						try {
							// console.log(this.board[i])
							this.board[i][j] = square;
							// console.log('Inserted');
							// console.log(this.board[i])
						} catch(e) {
							// console.log(e);
							// console.log("Added to row");
							row.push(square);
							// console.log(row);
						}
						// console.log("Bombs:", bombs, "\nMines:", mines, "\nExit?", bombs == mines);
					}
				}
				if (this.board.length == size) continue;
				this.board.push(row);
				// console.log("Row was pushed");
			}
		}
		console.log(this.board)
		for (let i = 0; i < boardSize; i++) {
			for (let j = 0; j < boardSize; j++) {
				let adjacent = 0;
				if (this.board[i][j].isMine()) continue;
				for (let di = -1; di < 2; di++) {
					try {
						for (let dj = -1; dj < 2; dj++) {
							if (!dj && !di) continue;
							try {
								if (this.board[i+di][j+dj].isMine()) adjacent++;
							} catch {
								continue;
							}
						}
					} catch {
						continue;
					}
				}
				this.board[i][j].setValue(adjacent);
				// console.log(adjacent);
			}
		}
	}

}

class GridItem {
	constructor(i, j, value, covered, flagged) {
		this.i = i;
		this.j = j;
		this.value = value;
		this.covered = covered;
		this.flagged = flagged;
	}

	getCoords() {
		return [this.i, this.j];
	}

	isMine() {
		return this.value == 9;
	}

	setValue(value) {
		this.value = value;
	}

	getValue() {
		return this.value;
	}

	toggleFlagged() {
		this.flagged = !this.flagged;
	}

	setFlag() {
		this.flagged = true;
	}

	clearFlag() {
		this.flagged = false;
	}

	isFlagged() {
		return this.flagged;
	}

	clearCover() {
		this.covered = false;
	}
	
	isCovered() {
		return this.covered;
	}
}

const socket = io(import.meta.env.VITE_SERVER_URL, {
	auth: {userId: code},
	path: "/socket/"
});
const home = document.getElementById("menu");
const app = document.getElementById("app");
const buttons = document.getElementsByClassName("game");
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
	if (res.error) {
		parameterError()
	}
	console.log("Response:", res);
	home.style.display = "none";
	app.style.display = "block";
	createInnerBoard(res.size, res.board);
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

function createInnerBoard(size, board) {
	let outerBoard = document.getElementById("board-container");
	if (!outerBoard) {
		outerBoard = document.createElement("section");
		outerBoard.id = "board-container";
		app.appendChild(outerBoard);
	}
	const innerBoard = document.createElement("div");
	innerBoard.id = "main-board";
	outerBoard.appendChild(innerBoard)
	for (let i = 0; i < size; i++) {
		console.log("running loop")
		const row = document.createElement("div");
		row.classList.add('row');
		for (let j = 0; j < size; j++) {
			const gridItem = document.createElement("div");
			gridItem.classList.add("grid");
			if (board[i][j] == 10 || board[i][j] == 11) {
				gridItem.addEventListener('click', clickGrid);
				gridItem.addEventListener('contextmenu', rClickGrid);
			} else {
				gridItem.innerHTML = symbols[board[i][j]];
			}
			gridItem.id = `${i}-${j}`;
			row.appendChild(gridItem);
		}
		innerBoard.appendChild(row);
	}
}

function mulberry32(seed) {
	return function() {
		let t = (seed += 0x6D2B79F5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
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

				const square = new GridItem(Math.floor(rand()*10), true, false);
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

function manageCalls(item) {
	console.log("Called.")
	console.log(item.getCoords())
	const [i, j] = item.getCoords();
	const source = document.getElementById(`${i}-${j}`);
	// console.log("COORDS:", i, j);
	// console.log("BOARD:", board, "\nNUMBER:", board[i][j], typeof(board[i][j]));
	// console.log(board[i][j] == 9);
	if (item.isMine()) {
		// console.log("Entered IF");
		source.innerHTML = symbols[9];
		source.removeEventListener("click", clickGrid);
		source.removeEventListener("contextmenu", rClickGrid);
		endGame();
		return;
	}
	const elements = [item];
	let win = false;
	while (elements.length) {
		const currentItem = elements[0];
		const [i, j] = currentItem.getCoords();
		const current = document.getElementById(`${i}-${j}`);
		current.innerHTML = symbols[currentItem.getValue()];
		current.classList.remove("covered");
		currentItem.clearCover();
		if (!currentItem.getValue()) {
			for (let di = -1; di < 2; di++) {
				for (let dj = -1; dj < 2; dj++) {
					if (!dj && !di) continue;
					if (i+di < 0 || j + dj < 0) continue;
					const next = game.getItem(i+di, j+dj);
					if (!next) continue;
					if ((next.isCovered()) &&
						!next.isFlagged() &&
						(!elements.find((item) => {
							const [nextI, nextJ] = next.getCoords();
							const [compI, compJ] = item.getCoords();
							return nextI == compI && nextJ == compJ
						}))) {
							elements.push(next);
					}
				}
			}
		}
		current.removeEventListener("click", clickGrid);
		current.removeEventListener("contextmenu", rClickGrid);
		elements.splice(0, 1);
		game.removeValid();
		if (!game.getValidRemaining() && !game.getFlagsRemaining()) {
			win = true;
		}
	}
	if (win) winGame();
}

function endGame() {
	// console.log("Endgame");
	const squares = document.getElementsByClassName("covered");
	let unflagged = 0;
	for (let i = 0; i < game.getSize(); i++) {
		for (let j = 0; j < game.getSize(); j++) {
			const item = game.getItem(i, j);
			if (!item.isCovered()) continue;
			const itemHTML = document.getElementById(`${i}-${j}`);
			itemHTML.removeEventListener("click", clickGrid);
			itemHTML.removeEventListener("contextmenu", rClickGrid);
			item.clearCover();
			itemHTML.innerHTML = symbols[item.getValue()];
			if (item.isMine() && item.isFlagged()) {
				itemHTML.style.backgroundColor = "lightgreen";
			} else if (item.isMine()) {
				itemHTML.style.backgroundColor = "red";
				unflagged++;
			} else if (item.isFlagged()) {
				itemHTML.style.backgroundColor = "red";
			}
		}
	}
	overScreen.children[1].innerHTML = "Game Over!"
	overScreen.children[2].innerHTML = `You had ${unflagged} ${unflagged == 1 ? "mine" : "mines"} remaining!<br>${overScreen.children[2].innerHTML}`;
	gameOver();
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

function gameOver() {
	overScreen.children[2].children[1].innerText = game.getSeed();
	overScreen.style.display = "block";
	game.setFlagsRemaining(0);
	game.clearInGame();
	clearInterval(timerId);
}

standard.addEventListener("click", async () => {
	await startGame(20, 50, null);
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

function clickGrid() {
	const item = game.getItem(Number(this.id.split("-")[0]), Number(this.id.split("-")[1]));
	if (!item) return;
	if (!item.isFlagged()) {
		manageCalls(item);
	}
}

function rClickGrid(event) {
	event.preventDefault()
	const item = game.getItem(Number(this.id.split("-")[0]), Number(this.id.split("-")[1]));
	if (game.getFlagsRemaining() && item.isCovered() && !item.isFlagged()) {
		this.classList.add("flagged");
		item.setFlag();
		this.innerHTML = symbols[10];
		game.removeflag();
		if (!game.getFlagsRemaining()) {
			flagIndicator.style.backgroundColor = "#AA0000";
		}
	} else if (item.isFlagged()) {
		this.classList.remove("flagged");
		item.clearFlag();
		this.innerHTML = symbols[11];
		game.addFlag();
		flagIndicator.style.backgroundColor = "#4a4a4a";
	}
	flagIndicator.innerText = game.getFlagsRemaining();
}

socket.on("connect_error", (err) => {
	console.log(`Socket conntection error:\nERROR: ${err}\nERROR NAME: ${err.name}\nERROR MESSAGE: ${err.message}\nERROR CAUSE: ${err.cause}`);
});