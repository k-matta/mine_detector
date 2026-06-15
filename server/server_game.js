/**
 * The main Mine-Detector Game object (server-side).
 * @class
 */
export class Game {

	/**
	 * @typedef {Object} gridData
	 * @property {Number} val The value of the current square.
	 * @property {Number} i The x-coordinate of the current square.
	 * @property {Number} j The y-coordinate of the current square.
	 */

	/**
	 * Creates a new Game object.
	 * @param {Number} id The ID of the user playing the game.
	 */
	constructor(id) {
		this.id = id;
		/** @type {Number} The size of the board */
		this.size = 0;
		/** @type {Array<Array<GridItem>>} The current state of the game board */
		this.board = [];
		/** @type {Number} The seed for the current game */
		this.seed = 0;
		/** @type {Number} The number of flags remaining */
		this.flagsRemaining = 0;
		/** @type {Number} The number of uncovered squares that are not bombs */
		this.validRemaining = 0;
		/** @type {Boolean} Whether or not the game is paused */
		this.paused = false;
		/** @type {Boolean} Whether or not the game is over */
		this.over = true;
		/** @type {Boolean} Whether or not the game has started */
		this.isStarted = false;
		/** @type {Array<Number>} A list of all start/pause times to calculate total time passed */
		this.timeEvents = [];
		/** @type {Number} The amount of time spent playing the current game */
		this.time = 0;
		/** @type {Array<gridData>} An array of changes to sync with the client */
		this.changes = [];
		/** @type {Boolean} Whether or not the game is standard (i.e., high scores are recorded). */
		this.isStandard = false;
	}

	/**
	 * Gets the ID of the user.
	 * @returns {Number} The user's ID.
	 */
	getUserId() {
		return this.id;
	}

	/**
	 * Indicates whether tha game is standard.
	 * @returns {Boolean} true if the game is standard; false otherwise.
	 */
	getStandard() {
		return this.isStandard;
	}

	/**
	 * Marks the game as standard.
	 */
	setStandard() {
		this.isStandard = true;
	}

	/**
	 * Marks the game as standard.
	 */
	clearStandard() {
		this.isStandard = false;
	}

	/**
	 * Start the game timer.
	 */
	start() {
		this.isStarted = true;
		this.timeEvents.push(Date.now());
	}

	/**
	 * Mark the game as not started.
	 */
	clearStart() {
		this.isStarted = false;
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
	 * Retrieves the game seed.
	 * @returns {Number} The seed used to generate the game.
	 */
	getSeed() {
		return this.seed;
	}

	/**
	 * Sets the game seed.
	 * @param {Number} gameSeed The seed used to generate the game.
	 */
	setSeed(gameSeed) {
		this.seed = gameSeed;
	}

	/**
	 * Gets how long the user took to finish the game.
	 * @returns {Number} The time the user took to complete the game.
	 */
	getTime() {
		return this.time;
	}

	/**
	 * Calculates how long the current game has been running.
	 */
	calculateTime() {
		this.time = 0;
		for (let i = 1; i < this.timeEvents.length; i+=2) {
			this.time += this.timeEvents[i] - this.timeEvents[i-1];
		}
		if (this.timeEvents.length % 2) {
			this.time += Date.now() - this.timeEvents[this.timeEvents.length-1];
		}
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
	removeFlag() {
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
	 * Get the number of uncovered squares that are not bombs.
	 * @returns {Number} The number of safe squares left to uncover.
	 */
	getValidRemaining() {
		return this.validRemaining;
	}

	/**
	 * Decrease the number of valid squares left (i.e., a new square was uncovered).
	 */
	removeValid() {
		this.validRemaining--;
	}

	/**
	 * Set the number of valid squares left.
	 * @param {Number} flags The number of valid squares left to uncover.
	 */
	setValidRemaining(valid) {
		this.validRemaining = valid;
	}

	/**
	 * @typedef {Object} gridData
	 * @property {Number} val The value of the current square.
	 * @property {Number} i The x-coordinate of the current square.
	 * @property {Number} j The y-coordinate of the current square.
	 */

	/**
	 * Gets the list of changes to sync with the client.
	 * @returns {Array<gridData>} The list of changes to sync with the client.
	 */
	getChanges() {
		return this.changes;
	}

	/**
	 * Adds a change to sync with the client.
	 * @param {gridData} change 
	 */
	addChange(change) {
		this.changes.push(change);
	}

	/**
	 * Clears the list of changes to sync with the client.
	 */
	clearChanges() {
		this.changes = [];
	}

	/**
	 * Indicates whether the current game is finished.
	 * @returns {Boolean} true if the game is finished; false otherwise.
	 */
	isOver() {
		return this.over;
	}

	/**
	 * Marks the current game as finished.
	 */
	setOver() {
		this.over = true;
	}
	/**
	 * Marks the current game as unfinished.
	 */
	clearOver() {
		this.over = false;
	}

	/**
	 * Indicates whether the current game is paused.
	 * @returns {Boolean} true if the game is paused; false otherwise.
	 */
	isPaused() {
		return this.paused;
	}

	/**
	 * Pauses the game.
	 */
	pause() {
		this.paused = true;
		if (this.getStarted()) this.timeEvents.push(Date.now());
	}

	/**
	 * Resumes the game.
	 */
	resume() {
		this.paused = false;
		if (this.getStarted()) this.timeEvents.push(Date.now());
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				const square = this.getItem(i, j);
				this.addChange({val: square.isFlagged() ? 10 : square.isCovered() ? 11 : square.getValue(), i, j});
			}
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
	 * Generate the game board for the user.
	 * @param {Number} boardSize The size of the board to generate.
	 * @param {Number} numMines The number of mines on the board.
	 * @param {Number | null} gameSeed The seed to use to generate the game. If null, one will be made based on the current time.
	 */
	generateGameBoard(boardSize, numMines, gameSeed = null) {
		this.clearOver();
		this.clear
		this.timeEvents = [];
		this.time = 0;
		if (boardSize < 2) throw new Error("Invalid board size.");
		if (numMines >= boardSize*boardSize) throw new Error("Invalid number of mines.");
		if (gameSeed && typeof(gameSeed) != "number") throw new Error("Invalid seed.");

		if (boardSize == 20 && numMines == 50 && !gameSeed) this.setStandard();
		else this.clearStandard();

		this.setSize(boardSize);
		this.setFlagsRemaining(numMines);
		this.setValidRemaining(this.size*this.size - this.getFlagsRemaining());
		if (!gameSeed) {
			const curDate = new Date();
			gameSeed = curDate.getTime();
		}
		const rand = mulberry32(gameSeed);
		this.setSeed(gameSeed);
		this.board = [];
		let bombs = 0;
		while (bombs < numMines) {
			for (let i = 0; i < boardSize; i++) {
				const row = [];
				for (let j = 0; j < boardSize; j++) {
					try {
						if (bombs == numMines && this.getItem(boardSize-1, boardSize-1)) break;
						if (this.board[i][j].isMine()) continue;
					} catch {}
					if (bombs == numMines) row.push(new GridItem(i, j, 0, true, false));
					else {
						const square = new GridItem(i, j, Math.floor(rand()*10), true, false);
						if (square.isMine()) {
							bombs++;
						}
						try {
							this.board[i][j] = square;
						} catch(e) {
							row.push(square);
						}
					}
				}
				if (this.board.length == boardSize) continue;
				this.board.push(row);
			}
		}
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

	/**
	 * Performs a click action (uncovers) a square on the grid.
	 * @param {GridItem} item The grid item that was clicked.
	 */
	clickGridItem(item) {
		if (!item) return;
		if (item.isMine()) {
			return this.endGame();
		}
		const elements = [item];
		let win = false;
		while (elements.length) {
			const currentItem = elements[0];
			const [i, j] = currentItem.getCoords();
			currentItem.clearCover();
			this.addChange({val: currentItem.getValue(), i: currentItem.getCoords()[0], j: currentItem.getCoords()[1]});
			if (!currentItem.getValue()) {
				for (let di = -1; di < 2; di++) {
					for (let dj = -1; dj < 2; dj++) {
						if (!dj && !di) continue;
						if (i+di < 0 || j + dj < 0) continue;
						const next = this.getItem(i+di, j+dj);
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
			elements.splice(0, 1);
			this.removeValid();
			if (!this.getValidRemaining() && !this.getFlagsRemaining()) {
				win = true;
				break;
			}
		}
		if (win) return this.winGame();
	}

	/**
	 * Clears all squares to sync with the client and ends the game.
	 * @returns {String} 'lost' to indicate that the user has lost the game.
	 */
	endGame() {
		for (let i = 0; i < this.getSize(); i++) {
			for (let j = 0; j < this.getSize(); j++) {
				const item = this.getItem(i, j);
				if (!item.isCovered()) continue;
				item.clearCover();
				this.addChange({val: item.getValue(), i: item.getCoords()[0], j: item.getCoords()[1]})
				// if (item.isMine() && !item.isFlagged()) unflagged++;
			}
		}
		this.setOver();
		return "lost";
	}

	/**
	 * Marks the current game as won and calculates the user's total time.
	 * @returns {String} 'won' to indicate that the user has won the game.
	 */
	winGame() {
		this.calculateTime();
		this.setOver();
		return "won";
	}
}

export class GridItem {
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

function mulberry32(seed) {
	return function() {
		let t = (seed += 0x6D2B79F5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}