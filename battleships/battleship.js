class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	switchXY() {
		const i = this.x;
		this.x = this.y;
		this.y = i;
	}

	changeSigns() {
		this.x = 0 - this.x;
		this.y = 0 - this.y;
	}

	scale(scale) {
		this.x *= scale.x;
		this.y *= scale.y;
	}

	floor() {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
	}

	scaleBoth(factor) {
		this.x *= factor;
		this.y *= factor;
	}

	offset(offset) {
		this.x += offset.x;
		this.y += offset.y;
	}

	clone() {
		return new Point(this.x, this.y);
	}
}

class Game {
	constructor() {
		this._ALLOWED_SHIPS = [
			{ type: "battleship", count: 1, length: 5 },
			{ type: "destroyer", count: 2, length: 4 },
			{ type: "frigate", count: 3, length: 3 },
			{ type: "mine sweeper", count: 3, length: 2 }
		];
		this._ARENA_SIZE = 10;
		this._MAX_SCORE = 0;
		this._TILE_EDGE_NEG = -0.5;
		this._TILE_EDGE_POS = 0.5;
		this._HULL_WIDTH_STBD = 0.3;
		this._HULL_WIDTH_PORT = -0.3;
		this._PROW_WIDTH_STBD = 0.2;
		this._PROW_WIDTH_PORT = -0.2;
		this._PROW_START = 0.1;
		this._PROW_AHEAD = -0.4;
		this._SHIP_COLOR = "#6b7c85";
		this._tileSize = null;
		this._enemyEmailEl = null;
		this._enemyStatusEl = null;
		this._enenyScoreEl = null;
		this._enemyCanvasCtx = null;
		this._myEmailEl = null;
		this._myStatusEl = null;
		this._myScoreEl = null;
		this._myCanvasCtx = null;
		this._myShips = null;
		this._positionBtn = null;
		this._readyBtn = null;
		this._aimLeftBtn = null;
		this._aimRightBtn = null;
		this._aimUpBtn = null;
		this._aimDownBtn = null;
		this._fireBtn = null;
		this._myScopePos = null;
		this._enemyScopePos = null;
		this._myScore = 0;
		this._enemyScore = 0;
		this._lastMessageTimeStamp = 0;
		this._enemyNameEl = null;
		this._myNameEl = null;
		this._enemyIndicator = null;
		this._myIndicator = null;
		this._messageWindow = null;
		this._isMyTurn = false;
		this._enemyShips = [];
		this._enemyHits = [];
		this._enemyMisses = [];
		this._enemyDamage = [];
		this.init();
	}

	init() {
		this._myHits = [];
		this._myMisses = [];
		this._myDamage = [];
		this._initCanvases();
		if (this._enemyCanvasCtx == null) {
			this._showMessage("Sorry, your browser does not support the HTML 5 canvas!");
		} else {
			this._initButtons();
			this._showMessage("Game loaded. Enter both player names to begin.");
		}
	}

	_initCanvases() {
		const enemyCanvas = document.getElementById('enemyCanvas');
		const myCanvas = document.getElementById('myCanvas');
		try {
			this._enemyCanvasCtx = enemyCanvas.getContext("2d");
			this._myCanvasCtx = myCanvas.getContext("2d");
			this._tileSize = new Point(myCanvas.width / this._ARENA_SIZE, myCanvas.height / this._ARENA_SIZE);
			this._myScopePos = this._defaultScopePos();
			this._enemyScopePos = this._defaultScopePos();
			this._renderEnemyCanvas();
			this._renderMyCanvas();
		} catch (e) {
			// Do nothing
		}
	}

	_defaultScopePos() {
		const scopePos = new Point(this._ARENA_SIZE, this._ARENA_SIZE);
		scopePos.scaleBoth(0.5);
		scopePos.floor();
		return scopePos;
	}

	_initButtons() {
		this._enemyNameEl = document.getElementById('enemyName');
		this._myNameEl = document.getElementById('myName');
		this._enemyStatusEl = document.getElementById('enemyStatus');
		this._enenyScoreEl = document.getElementById('enemyScore');
		this._myStatusEl = document.getElementById('myStatus');
		this._myScoreEl = document.getElementById('myScore');
		this._positionBtn = document.getElementById('positionBtn');
		this._readyBtn = document.getElementById('readyBtn');
		this._aimLeftBtn = document.getElementById('aimLeft');
		this._aimRightBtn = document.getElementById('aimRight');
		this._aimUpBtn = document.getElementById('aimUp');
		this._aimDownBtn = document.getElementById('aimDown');
		this._fireBtn = document.getElementById('fireBtn');
		this._enemyIndicator = document.getElementById('enemyIndicator');
		this._myIndicator = document.getElementById('myIndicator');
		this._messageWindow = document.getElementById('messageWindow');

		this._positionBtn.addEventListener('click', this._onPositionClicked.bind(this));
		this._readyBtn.addEventListener('click', this._onReadyClicked.bind(this));
		this._aimLeftBtn.addEventListener('click', this._onAimLeftClicked.bind(this));
		this._aimRightBtn.addEventListener('click', this._onAimRightClicked.bind(this));
		this._aimUpBtn.addEventListener('click', this._onAimUpClicked.bind(this));
		this._aimDownBtn.addEventListener('click', this._onAimDownClicked.bind(this));
		this._fireBtn.addEventListener('click', this._onFireClicked.bind(this));
		this._gunButtons = [this._aimLeftBtn, this._aimRightBtn, this._aimUpBtn, this._aimDownBtn, this._fireBtn];
		this._gunButtons.forEach(button => button.disabled = true);
		this._positionBtn.disabled = false;
		this._readyBtn.disabled = true;
		this._myStatusEl.value = "Positioning my ships";
		this._enemyStatusEl.value = "Starting...";
	}

	_showMessage(msg) {
		if (this._messageWindow) {
			const p = document.createElement('div');
			p.textContent = msg;
			this._messageWindow.appendChild(p);
			this._messageWindow.scrollTop = this._messageWindow.scrollHeight;
		}
	}

	_validatePlayerNames() {
		const enemyName = this._enemyNameEl.value.trim();
		const myName = this._myNameEl.value.trim();
		if (!enemyName || !myName) {
			this._showMessage("Both player names are required to start the game.");
			return false;
		}
		return true;
	}

	_setTurnIndicator(isMyTurn) {
		if (this._myIndicator && this._enemyIndicator) {
			if (isMyTurn) {
				this._myIndicator.style.background = '#8f8';
				this._enemyIndicator.style.background = '#eee';
				this._showMessage("It's your turn!");
			} else {
				this._myIndicator.style.background = '#eee';
				this._enemyIndicator.style.background = '#f88';
				this._showMessage("Waiting for opponent's turn.");
			}
		}
	}

	_sendMessage(action, option, data) {
		// Implement browser-only logic here (e.g., using localStorage)
		console.log(`Action: ${action}, Option: ${option}, Data: ${data}`);
	}

	_onReadyClicked() {
		if (!this._validatePlayerNames()) {
			return;
		}
		this._showMessage(`Players: ${this._myNameEl.value.trim()} vs ${this._enemyNameEl.value.trim()}`);
		this._readyBtn.disabled = true;
		this._positionBtn.disabled = true;
		this._gunButtons.forEach(button => button.disabled = false);
		this._isMyTurn = true;
		this._setTurnIndicator(true);
		this._showMessage('Game started! Take your turn.');
		this._enemyShips = this._generateEnemyShips();
	}

	_generateEnemyShips() {
		const ships = [];
		for (const shipDef of this._ALLOWED_SHIPS) {
			for (let i = 0; i < shipDef.count; i++) {
				let placed = false;
				while (!placed) {
					const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
					const x = Math.floor(Math.random() * this._ARENA_SIZE);
					const y = Math.floor(Math.random() * this._ARENA_SIZE);
					const ship = {
						type: shipDef.type,
						length: shipDef.length,
						orientation: orientation,
						start: { x, y },
						positions: []
					};
					// Calculate ship positions
					for (let j = 0; j < ship.length; j++) {
						let px = x + (orientation === 'horizontal' ? j : 0);
						let py = y + (orientation === 'vertical' ? j : 0);
						ship.positions.push({ x: px, y: py });
					}
					if (this._isValidShipPlacement(ship, ships)) {
						ships.push(ship);
						placed = true;
					}
				}
			}
		}
		return ships;
	}

	_isValidShipPlacement(ship, existingShips) {
		for (const pos of ship.positions) {
			if (pos.x < 0 || pos.x >= this._ARENA_SIZE || pos.y < 0 || pos.y >= this._ARENA_SIZE) {
				return false;
			}
			for (const placed of existingShips) {
				for (const p of placed.positions) {
					if (p.x === pos.x && p.y === pos.y) {
						return false;
					}
				}
			}
		}
		return true;
	}

	_onPositionClicked() {
		if (!this._validatePlayerNames()) {
			return;
		}
		this.startShipPlacement();
		this._showMessage('Begin placing your ships.');
		this._readyBtn.disabled = true;
	}

	_onAimLeftClicked() {
		if (this._enemyScopePos.x > 0) {
			this._enemyScopePos.x--;
			this._renderEnemyCanvas();
		}
	}

	_onAimRightClicked() {
		if (this._enemyScopePos.x < this._ARENA_SIZE - 1) {
			this._enemyScopePos.x++;
			this._renderEnemyCanvas();
		}
	}

	_onAimUpClicked() {
		if (this._enemyScopePos.y > 0) {
			this._enemyScopePos.y--;
			this._renderEnemyCanvas();
		}
	}

	_onAimDownClicked() {
		if (this._enemyScopePos.y < this._ARENA_SIZE - 1) {
			this._enemyScopePos.y++;
			this._renderEnemyCanvas();
		}
	}

	_onFireClicked() {
		if (!this._isMyTurn) {
			this._showMessage("It's not your turn!");
			return;
		}

		const target = { x: this._enemyScopePos.x, y: this._enemyScopePos.y };
		
		// Check if already fired at this position
		if (this._enemyHits.some(hit => hit.x === target.x && hit.y === target.y) ||
			this._enemyMisses.some(miss => miss.x === target.x && miss.y === target.y)) {
			this._showMessage("You've already fired at this position!");
			return;
		}

		// Check for hit
		let hit = false;
		let hitShip = null;
		for (const ship of this._enemyShips) {
			for (const pos of ship.positions) {
				if (pos.x === target.x && pos.y === target.y) {
					hit = true;
					hitShip = ship;
					break;
				}
			}
			if (hit) break;
		}

		if (hit) {
			this._enemyHits.push(target);
			this._enemyDamage.push(target);
			this._myScore++;
			this._myScoreEl.value = this._myScore;
			this._showMessage("Hit!");
			
			// Check if ship is sunk
			const shipHits = this._enemyDamage.filter(damage => 
				hitShip.positions.some(pos => pos.x === damage.x && pos.y === damage.y)
			);
			if (shipHits.length === hitShip.length) {
				this._showMessage(`You sunk their ${hitShip.type}!`);
			}
		} else {
			this._enemyMisses.push(target);
			this._showMessage("Miss!");
		}

		// Switch turns
		this._isMyTurn = false;
		this._setTurnIndicator(false);
		this._renderEnemyCanvas();
		
		// Simulate enemy's turn after a short delay
		setTimeout(() => this._enemyTurn(), 1000);
	}

	_enemyTurn() {
		if (this._isMyTurn) return;

		let target;
		do {
			target = {
				x: Math.floor(Math.random() * this._ARENA_SIZE),
				y: Math.floor(Math.random() * this._ARENA_SIZE)
			};
		} while (
			this._myHits.some(hit => hit.x === target.x && hit.y === target.y) ||
			this._myMisses.some(miss => miss.x === target.x && miss.y === target.y)
		);

		// Check for hit
		let hit = false;
		let hitShip = null;
		for (const ship of this._myShips) {
			for (const pos of ship.positions) {
				if (pos.x === target.x && pos.y === target.y) {
					hit = true;
					hitShip = ship;
					break;
				}
			}
			if (hit) break;
		}

		if (hit) {
			this._myHits.push(target);
			this._myDamage.push(target);
			this._enemyScore++;
			this._enenyScoreEl.value = this._enemyScore;
			this._showMessage("Enemy hit your ship!");
			
			// Check if ship is sunk
			const shipHits = this._myDamage.filter(damage => 
				hitShip.positions.some(pos => pos.x === damage.x && pos.y === damage.y)
			);
			if (shipHits.length === hitShip.length) {
				this._showMessage(`Enemy sunk your ${hitShip.type}!`);
			}
		} else {
			this._myMisses.push(target);
			this._showMessage("Enemy missed!");
		}

		// Switch turns back to player
		this._isMyTurn = true;
		this._setTurnIndicator(true);
		this._renderMyCanvas();
	}

	_renderEnemyCanvas() {
		const ctx = this._enemyCanvasCtx;
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		// Draw grid
		ctx.strokeStyle = '#ccc';
		for (let i = 0; i <= this._ARENA_SIZE; i++) {
			ctx.beginPath();
			ctx.moveTo(i * this._tileSize.x, 0);
			ctx.lineTo(i * this._tileSize.x, ctx.canvas.height);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(0, i * this._tileSize.y);
			ctx.lineTo(ctx.canvas.width, i * this._tileSize.y);
			ctx.stroke();
		}

		// Draw hits and misses
		ctx.fillStyle = 'red';
		for (const hit of this._enemyHits) {
			ctx.beginPath();
			ctx.arc(
				(hit.x + 0.5) * this._tileSize.x,
				(hit.y + 0.5) * this._tileSize.y,
				this._tileSize.x * 0.3,
				0,
				Math.PI * 2
			);
			ctx.fill();
		}

		ctx.fillStyle = 'white';
		for (const miss of this._enemyMisses) {
			ctx.beginPath();
			ctx.arc(
				(miss.x + 0.5) * this._tileSize.x,
				(miss.y + 0.5) * this._tileSize.y,
				this._tileSize.x * 0.3,
				0,
				Math.PI * 2
			);
			ctx.fill();
		}

		// Draw scope
		ctx.strokeStyle = 'yellow';
		ctx.lineWidth = 2;
		ctx.strokeRect(
			this._enemyScopePos.x * this._tileSize.x,
			this._enemyScopePos.y * this._tileSize.y,
			this._tileSize.x,
			this._tileSize.y
		);
	}

	_renderMyCanvas() {
		const ctx = this._myCanvasCtx;
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		// Draw grid
		ctx.strokeStyle = '#ccc';
		for (let i = 0; i <= this._ARENA_SIZE; i++) {
			ctx.beginPath();
			ctx.moveTo(i * this._tileSize.x, 0);
			ctx.lineTo(i * this._tileSize.x, ctx.canvas.height);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(0, i * this._tileSize.y);
			ctx.lineTo(ctx.canvas.width, i * this._tileSize.y);
			ctx.stroke();
		}

		// Draw ships
		ctx.fillStyle = this._SHIP_COLOR;
		if (this._myShips) {
			for (const ship of this._myShips) {
				for (const pos of ship.positions) {
					ctx.fillRect(
						pos.x * this._tileSize.x + 2,
						pos.y * this._tileSize.y + 2,
						this._tileSize.x - 4,
						this._tileSize.y - 4
					);
				}
			}
		}

		// Draw hits and misses
		ctx.fillStyle = 'red';
		for (const hit of this._myHits) {
			ctx.beginPath();
			ctx.arc(
				(hit.x + 0.5) * this._tileSize.x,
				(hit.y + 0.5) * this._tileSize.y,
				this._tileSize.x * 0.3,
				0,
				Math.PI * 2
			);
			ctx.fill();
		}

		ctx.fillStyle = 'white';
		for (const miss of this._myMisses) {
			ctx.beginPath();
			ctx.arc(
				(miss.x + 0.5) * this._tileSize.x,
				(miss.y + 0.5) * this._tileSize.y,
				this._tileSize.x * 0.3,
				0,
				Math.PI * 2
			);
			ctx.fill();
		}
	}

	// --- Ship Placement Logic ---
	startShipPlacement() {
		this._myShips = [];
		this._currentShipIndex = 0;
		this._placingShip = null;
		this._placingOrientation = 'horizontal';
		this._showMessage('Click on your grid to place your ships. Use arrow keys to rotate.');
		this._myCanvasCtx.canvas.addEventListener('click', this._onMyCanvasClick.bind(this));
		document.addEventListener('keydown', this._onKeyDown.bind(this));
		this._renderMyCanvas();
	}

	_onMyCanvasClick(event) {
		if (this._currentShipIndex >= this._ALLOWED_SHIPS.length) return;
		const rect = this._myCanvasCtx.canvas.getBoundingClientRect();
		const x = Math.floor((event.clientX - rect.left) / this._tileSize.x);
		const y = Math.floor((event.clientY - rect.top) / this._tileSize.y);
		const shipDef = this._ALLOWED_SHIPS[this._currentShipIndex];
		const ship = {
			type: shipDef.type,
			length: shipDef.length,
			orientation: this._placingOrientation,
			start: { x, y },
			positions: []
		};
		// Calculate ship positions
		for (let i = 0; i < ship.length; i++) {
			let px = x + (this._placingOrientation === 'horizontal' ? i : 0);
			let py = y + (this._placingOrientation === 'vertical' ? i : 0);
			ship.positions.push({ x: px, y: py });
		}
		if (!this._isValidShipPlacement(ship)) {
			this._showMessage('Invalid ship placement. Ships must not overlap or go out of bounds.');
			return;
		}
		this._myShips.push(ship);
		this._currentShipIndex++;
		this._showMessage(`Placed ${ship.type}.`);
		if (this._currentShipIndex >= this._ALLOWED_SHIPS.length) {
			this._showMessage('All ships placed! Click "Ready to Start".');
			this._myCanvasCtx.canvas.removeEventListener('click', this._onMyCanvasClick.bind(this));
			document.removeEventListener('keydown', this._onKeyDown.bind(this));
			this._readyBtn.disabled = false;
		}
		this._renderMyCanvas();
	}

	_onKeyDown(event) {
		if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			this._placingOrientation = this._placingOrientation === 'horizontal' ? 'vertical' : 'horizontal';
			this._showMessage(`Orientation: ${this._placingOrientation}`);
		}
	}

	_isValidShipPlacement(ship) {
		for (const pos of ship.positions) {
			if (pos.x < 0 || pos.x >= this._ARENA_SIZE || pos.y < 0 || pos.y >= this._ARENA_SIZE) {
				return false;
			}
			for (const placed of this._myShips) {
				for (const p of placed.positions) {
					if (p.x === pos.x && p.y === pos.y) {
						return false;
					}
				}
			}
		}
		return true;
	}

	// --- End Ship Placement Logic ---
}

// Initialize the game when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	new Game();
});

