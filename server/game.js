import "constants.js"
import {clickGrid, rClickGrid} from "events.js"

let auth;
let inGame = false;
let board;
let globalSeed;
export let flagsRemaining;
let validRemaining;
let timerId = 0;

export function startGame(size, mines, seed=null) {
	console.log(size, mines, seed, typeof(seed));
	inGame = true;
	home.style.display = "none";
	app.style.display = "block";
	board = generateBoard(size, mines, seed);
	console.log(board);
	flagsRemaining = mines;
	flagIndicator.innerText = flagsRemaining;
	validRemaining = size*size - mines;
	const outerBoard = document.createElement("div");
	outerBoard.id = "main-board";
	app.appendChild(outerBoard);
	for (let i = 0; i < size; i++) {
		console.log("running loop")
		const row = document.createElement("div");
		row.classList.add('row');
		for (let j = 0; j < size; j++) {
			const gridItem = document.createElement("div");
			gridItem.classList.add("grid");
			gridItem.classList.add("covered");
			gridItem.id = `${i}-${j}`;
			gridItem.addEventListener('click', clickGrid);
			gridItem.addEventListener('contextmenu', rClickGrid);
			gridItem.innerHTML = '🟦';
			row.appendChild(gridItem);	
		}
		outerBoard.appendChild(row);
	}
	console.log("done");
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
				
				let bomb = Math.floor(rand()*10);
				console.log(j, i, bomb, "bomb?", bomb == 9)
				if (bomb == 9) {
					bombs++;
					console.log("Coords: (" + String(j) + ", " + String(i) + ")");
					console.log(board.length, row.length)
					console.log(board);
				} else bomb = 0;
				try {
					console.log(board[i])
					board[i][j] = bomb;
					console.log('Inserted');
					console.log(board[i])
				} catch(e) {
					console.log(e);
					console.log("Added to row");
					row.push(bomb);
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
			board[i][j] = adjacent;
			console.log(adjacent);
		}
	}
	return board;
}

export function manageCalls(source) {
	console.log("Called.")
	const i = Number(source.id.split("-")[0]);
	const j = Number(source.id.split("-")[1]);
	// console.log("COORDS:", i, j);
	// console.log("BOARD:", board, "\nNUMBER:", board[i][j], typeof(board[i][j]));
	// console.log(board[i][j] == 9);
	if (board[i][j] == 9) {
		// console.log("Entered IF");
		source.innerHTML = symbols[9];
		source.removeEventListener("click", clickGrid);
		source.removeEventListener("contextmenu", rClickGrid);
		endGame();
		return;
	}
	const elements = [source];
	let win = false;
	while (elements.length) {
		const current = elements[0];
		const i = Number(current.id.split("-")[0]);
		const j = Number(current.id.split("-")[1]);
		current.innerHTML = symbols[board[i][j]];
		current.classList.remove("covered");
		if (!board[i][j]) {
			for (let di = -1; di < 2; di++) {
				for (let dj = -1; dj < 2; dj++) {
					if (!dj && !di) continue;
					const next = document.getElementById(`${i+di}-${j+dj}`);
					if (next) {
						if ((next.classList.contains("covered")) && !next.classList.contains("flagged") && (!elements.find((item) => next.id == item.id))) {
							elements.push(next);
						}
					}
				}
			}
		}
		current.removeEventListener("click", clickGrid);
		current.removeEventListener("contextmenu", rClickGrid);
		elements.splice(0, 1);
		validRemaining--;
		if (!validRemaining && !flagsRemaining) {
			win = true;
		}
	}
	if (win) winGame();
}

function endGame() {
	// console.log("Endgame");
	const squares = document.getElementsByClassName("covered");
	let unflagged = 0;
	for (let k = 0; k < squares.length; k++) {
		const gridItem = squares[k];
		gridItem.removeEventListener("click", clickGrid);
		gridItem.removeEventListener("contextmenu", rClickGrid);
		// console.log("Removed");
		const i = Number(gridItem.id.split("-")[0]);
		const j = Number(gridItem.id.split("-")[1]);
		const symbol = board[i][j];
		gridItem.innerHTML = symbols[symbol];
		if (symbol == 9 && gridItem.classList.contains("flagged")) {
			gridItem.style.backgroundColor = "lightgreen";
		} else if (symbol == 9) {
			gridItem.style.backgroundColor = "red";
			unflagged++;
		} else if (gridItem.classList.contains("flagged")) {
			gridItem.style.backgroundColor = "red";
		}
	}
	overScreen.children[1].innerHTML = "Game Over!"
	overScreen.children[2].innerHTML = `You had ${unflagged} ${unflagged == 1 ? "mine" : "mines"} remaining!<br>${overScreen.children[2].innerHTML}`;
	gameOver();
}

function winGame() {
	const flaggedSquares = document.getElementsByClassName("flagged");
	for (let square of flaggedSquares) {
		square.removeEventListener("click", clickGrid);
		square.removeEventListener("contextmenu", rClickGrid);
	}
	const time = 0;
	overScreen.children[1].innterHTML = "You Win!";
	overScreen.children[2].innerHTML = `Your time: ${time*1000} seconds.<br>${overScreen.children[2].innerHTML}`;
	gameOver();
}

function gameOver() {
	overScreen.children[2].children[1].innerText = globalSeed;
	overScreen.style.display = "block";
	globalSeed = 0;
	flagsRemaining = 0;
	clearInterval(timerId);
}