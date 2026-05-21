class Game {
	constructor() {
		this.size = 0;
		this.board = [];
		this.seed = 0;
		this.flagsRemaining = 0;
		this.validRemaining = 0;
		this.isPaused = false;
		this.isStarted = false;
		this.timeEvents = [];
		this.time = 0;
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
						}
						try {
							this.board[i][j] = square;
						} catch(e) {
							// console.log(e);
							row.push(square);
						}
					}
				}
				if (this.board.length == size) continue;
				this.board.push(row);
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