
var Point = $.klass
({
	x: 0,
	y: 0,
	
	init: function(newX, newY)
	{
		this.x = newX;
		this.y = newY;
	},
	
	switchXY: function()
	{
		var i = this.x;
		this.x = this.y;
		this.y = i;
	},
	
	changeSigns: function()
	{
		this.x = 0 - this.x;
		this.y = 0 - this.y;
	},
	
	scale: function(scale)
	{
		this.x *= scale.x;
		this.y *= scale.y;
	},
	
	floor: function()
	{
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
	},
	
	scaleBoth: function(factor)
	{
		this.x *= factor;
		this.y *= factor;
	},
	
	offset: function(offset)
	{
		this.x += offset.x;
		this.y += offset.y;
	},
	
	clone: function()
	{
		var ret = new Point(this.x, this.y);
		return ret;
	}
});

var Game = $.klass
({

	_ALLOWED_SHIPS:
	[
		{type: "battleship", count: 1, length: 5},
		{type: "destroyer", count: 2, length: 4},
		{type: "frigate", count: 3, length: 3},
		{type: "mine sweeper", count: 3, length: 2}
	],
	
	_ARENA_SIZE: 10,
	
	_MAX_SCORE: 0,
	
	_TILE_EDGE_NEG: -0.5,
	_TILE_EDGE_POS: 0.5,
	_HULL_WIDTH_STBD:  0.3,
	_HULL_WIDTH_PORT:  -0.3,
	_PROW_WIDTH_STBD:  0.2,
	_PROW_WIDTH_PORT:  -0.2,
	_PROW_START:  0.1,
	_PROW_AHEAD:  -0.4,
	
	_SHIP_COLOR: "#6b7c85",

	_AJAX_SERVICE: "content.php",
	
	_tileSize: null,

	_enemyEmailEl: null,
	_enemyStatusEl: null,
	_enenyScoreEl: null,
	_enemyCanvasCtx: null,
	
	_myEmailEl: null,
	_myStatusEl: null,
	_myScoreEl: null,
	_myCanvasCtx: null,
	
	_myShips: null,
	
	_positionBtn: null,
	_readyBtn: null,
	
	_aimLeftBtn: null,
	_aimRightBtn: null,
	_aimUpBtn: null,
	_aimDownBtn: null,
	_fireBtn: null,
	
	_myScopePos: null,
	_enemyScopePos: null,
	
	_myScore: 0,
	_enemyScore: 0,
	
	_lastMessageTimeStamp: 0,
	
	init: function()
	{
		this._myHits = [];
		this._myMisses = [];
		this._myDamage = [];

		this._initCanvases();
		if (this._enemyCanvasCtx == null)
		{
			alert("sorry. your browser does not support the HTML 5 canvas!");
		}
		else
		{
			this._initButtons();
			this._sendMessage("STARTED", 0, 0);
		}			
	},
	
	_initCanvases: function()
	{
		var enemyCanvas = $("#enemyCanvas")[0];
		var myCanvas = $("#myCanvas")[0];
		try
		{
			this._enemyCanvasCtx = enemyCanvas.getContext("2d");
			this._myCanvasCtx = myCanvas.getContext("2d");
			
			this._tileSize = new Point(myCanvas.width/this._ARENA_SIZE, myCanvas.height/this._ARENA_SIZE);
			
			//default scope positions in center
			this._myScopePos = this._defaultScopePos();
			this._enemyScopePos = this._defaultScopePos();
			
			this._renderEnemyCanvas();
			this._renderMyCanvas();
		}
		catch(e)
		{
			//do nothing
		}
	},
	
	_defaultScopePos: function()
	{
		var scopePos = new Point(this._ARENA_SIZE, this._ARENA_SIZE);
		scopePos.scaleBoth(0.5);
		scopePos.floor();
		return scopePos;
	},
	
	_initButtons: function()
	{
		this._enemyEmailEl = $("#enemyEmail")[0];
		this._enemyStatusEl = $("#enemyStatus")[0];
		this._enenyScoreEl = $("#enemyScore")[0];		
		this._myEmailEl = $("#myEmail")[0];
		this._myStatusEl = $("#myStatus")[0];
		this._myScoreEl = $("#myScore")[0];
		
		this._positionBtn = $("#positionBtn")[0];
		$(this._positionBtn).click($.proxy(this._onPositionClicked, this));		
		this._readyBtn = $("#readyBtn")[0];
		$(this._readyBtn).click($.proxy(this._onReadyClicked, this));			
		
		this._aimLeftBtn = $("#aimLeft")[0];
		$(this._aimLeftBtn).click($.proxy(this._onAimLeftClicked, this));				
		this._aimRightBtn = $("#aimRight")[0];
		$(this._aimRightBtn).click($.proxy(this._onAimRightClicked, this));
		this._aimUpBtn = $("#aimUp")[0];
		$(this._aimUpBtn).click($.proxy(this._onAimUpClicked, this));
		this._aimDownBtn = $("#aimDown")[0];
		$(this._aimDownBtn).click($.proxy(this._onAimDownClicked, this));
		
		this._fireBtn = $("#fireBtn")[0];
		$(this._fireBtn).click($.proxy(this._onFireClicked, this));
						
		this._gunButtons = [this._aimLeftBtn, this._aimRightBtn, this._aimUpBtn, this._aimDownBtn, this._fireBtn];
		
		$(this._gunButtons).prop('disabled', true);
		$(this._positionBtn).prop('disabled', false);		
		$(this._readyBtn).prop('disabled', true);
		
		$(this._myStatusEl).val("Positioning my ships");	
		$(this._enemyStatusEl).val("Starting...");		
	
	},
	
	_random: function(min, max)
	{
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},
	
	_onPositionClicked: function(evt)
	{
		var redoNeeded = true;
		while (redoNeeded === true)
		{
			this._generateShipArrayAndMaxScore();
			redoNeeded = this._generateAllShipPositions();		
		}
		
		this._renderMyCanvas();
		$(this._readyBtn).prop('disabled', false);
	},
		
	_generateShipArrayAndMaxScore: function()
	{
		this._MAX_SCORE = 0;
		this._myShips = [];
		for (var i = 0; i < this._ALLOWED_SHIPS.length; i++)
		{
			var shipType = this._ALLOWED_SHIPS[i];
			for (var c = 0; c < shipType.count; c++)
			{
				this._MAX_SCORE += shipType.squares;
				var ship = {"type": shipType.type, "pos": [], "length": shipType.length};
				this._myShips.push(ship);
			}
		}
	},
	
	_generateAllShipPositions: function()
	{
		//debugger;
		var failed = false;
		var MAX_RETRIES = 20;		
		for (var i = 0; i < this._myShips.length && failed === false; i++)
		{
			var retries = 0;
			while (retries < MAX_RETRIES)
			{
				this._generateShipPosition(this._myShips[i]);
				failed = this._checkShipCollision(this._myShips[i]);
				if (failed === true)
				{
					retries++;
				}
				else
				{
					break;
				}
			}
		}
		
		return failed;
	},
	
	_generateShipPosition: function(ship)
	{
		ship.pos = [];
		ship.isFlipped = (this._random(0,1)) ? true: false;
		ship.isVertical = (this._random(0,1)) ? true: false;
		
		var dx = 0; 
		var dy = 0;
			
		var arenaMax = this._ARENA_SIZE - 1;
		
		var xMax = arenaMax;
		var yMax = arenaMax
				
		if (ship.isVertical)
		{
			dy = 1;
			yMax = (arenaMax - ship.length);
		}
		else
		{
			dx = 1;
			xMax = (arenaMax - ship.length);
		}
		
		var posX = this._random(0, xMax);
		var posY = this._random(0, yMax);

		for (var i = 0; i < ship.length; i++)
		{
			ship.pos[i] = new Point(posX, posY);
			posX += dx;
			posY += dy;
		}	
	},
	
	_checkShipCollision: function(thisShip)
	{
		for (var s = 0; s < this._myShips.length; s++)
		{	
			var otherShip = this._myShips[s];
			if (otherShip != thisShip)
			{
				for (var i = 0; i < otherShip.pos.length; i++)
				{
					var otherPos = otherShip.pos[i];
					for (var j = 0; j < thisShip.pos.length; j++)
					{
						var thisPos = thisShip.pos[j];
						if (thisPos.x == otherPos.x && thisPos.y == otherPos.y)
						{
							return true;
						}
					}
				}
			}
		}
		return false;
	},
	
	_renderEnemyCanvas: function()
	{
		this._drawGrid(this._enemyCanvasCtx);
		this._renderShots(this._enemyCanvasCtx, this._myHits, "yellow");
		this._renderShots(this._enemyCanvasCtx, this._myMisses, "black");
		this._drawScope(this._enemyCanvasCtx, this._myScopePos, 'green'); //my scope shows on the enemy canvas
	},
	
	_renderMyCanvas: function()
	{
		this._drawGrid(this._myCanvasCtx);
		if (this._myShips)
		{
			this._drawShips(this._myCanvasCtx);
		}
		this._renderShots(this._myCanvasCtx, this._myDamage, "red");
		this._drawScope(this._myCanvasCtx, this._enemyScopePos, 'red'); //the enemy's scope shows on my canvas

		$(this._myScoreEl).val(this._myScore);	
		$(this._enemyScoreEl).val(this._enemyScore);		
	},
	
	_renderShots: function(ctx, shots, color)
	{
		for (var i = 0; i < shots.length; i++)
		{
			var shot = shots[i];
			var tilePos = new Point(shot.x * this._tileSize.x, shot.y * this._tileSize.y);
			var tileCenter = new Point(tilePos.x + 0.5 * this._tileSize.x, tilePos.y + 0.5 * this._tileSize.y);
			this._renderShot(ctx, tileCenter, color);
		}
	},
	
	_renderShot: function(ctx, tileCenter, color)
	{	
		var partial = this._tileSize.clone();
		partial.scaleBoth(0.3);
		
		var leftPoint = new Point(tileCenter.x - partial.x, tileCenter.y);
		var rightPoint = new Point(tileCenter.x + partial.x, tileCenter.y);
		var topPoint = new Point(tileCenter.x, tileCenter.y - partial.y);
		var bottomPoint = new Point(tileCenter.x, tileCenter.y + partial.y);		 

		ctx.strokeStyle = color;
		this._drawLine(ctx, leftPoint.x, topPoint.y, rightPoint.x, bottomPoint.y);  // /
		this._drawLine(ctx, rightPoint.x, topPoint.y, leftPoint.x, bottomPoint.y);  // \

		this._drawLine(ctx, leftPoint.x, tileCenter.y, rightPoint.x, tileCenter.y); // -
		this._drawLine(ctx, tileCenter.x, topPoint.y, tileCenter.x, bottomPoint.y); // |	
	},

	_drawScope: function(ctx, scopePos, color)
	{		
		var tilePos = new Point(scopePos.x * this._tileSize.x, scopePos.y * this._tileSize.y);
		var tileCenter = new Point(tilePos.x + 0.5 * this._tileSize.x, tilePos.y + 0.5 * this._tileSize.y);
		
		var leftPoint = new Point(tileCenter.x - this._tileSize.x, tileCenter.y);
		var rightPoint = new Point(tileCenter.x + this._tileSize.x, tileCenter.y);
		var topPoint = new Point(tileCenter.x, tileCenter.y - this._tileSize.y);
		var bottomPoint = new Point(tileCenter.x, tileCenter.y + this._tileSize.y);
				
		ctx.strokeStyle = color;
		this._drawLine(ctx, leftPoint.x, leftPoint.y, rightPoint.x, rightPoint.y);
		this._drawLine(ctx, topPoint.x, topPoint.y, bottomPoint.x, bottomPoint.y);

		var partial = new Point(this._tileSize.x, this._tileSize.y);
		partial.scaleBoth(0.3);

		this._drawLine(ctx, leftPoint.x + partial.x, leftPoint.y, topPoint.x, topPoint.y  + partial.y);
		this._drawLine(ctx, topPoint.x, topPoint.y + partial.y, rightPoint.x - partial.x, rightPoint.y);	
		this._drawLine(ctx, rightPoint.x - partial.x, rightPoint.y, bottomPoint.x, bottomPoint.y - partial.y);	
		this._drawLine(ctx, bottomPoint.x, bottomPoint.y - partial.y, leftPoint.x + partial.x, leftPoint.y );	
		
	},
	
	_drawGrid: function(ctx)
	{
		var w = ctx.canvas.width;
		var h = ctx.canvas.height;
		
		ctx.clearRect(0, 0, w, h);		
		
		//draw vertical grid
		ctx.strokeStyle="white";
		ctx.lineWidth=1;
		for (var x = this._tileSize.x; x < w; x += this._tileSize.x)
		{
			this._drawLine(ctx, x, 0, x, h);
		}
		for (var y = this._tileSize.y; y < h; y += this._tileSize.y)
		{
			this._drawLine(ctx, 0, y, w, y);
		}	
	},
	
	_drawLine: function(ctx, x1, y1, x2, y2)
	{
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.closePath();	
		ctx.stroke();		
	},
	
	_drawShips: function(ctx)
	{
		ctx.fillStyle = this._SHIP_COLOR;
		var w = ctx.canvas.width;
		var h = ctx.canvas.height;

		for (var s = 0; s < this._myShips.length; s++)
		{
			var ship = this._myShips[s];
			for (var i = 0; i < ship.length; i++)
			{
				//ctx.fillStyle = (ship.isFlipped == true) ? "yellow": "red";
				this._drawShipPart(ctx, ship, i);
			}
		}
	},
	
	_drawShipPart: function(ctx, ship, squareNum)
	{
		var tilePos = new Point(ship.pos[squareNum].x * this._tileSize.x, ship.pos[squareNum].y * this._tileSize.y);
				
		if ((squareNum == 0 && ship.isFlipped == false) || ((squareNum == ship.length - 1) && ship.isFlipped == true))
		{
			this._drawProw(ctx, tilePos, ship);
		}
		else if ((squareNum == ship.length - 1 && ship.isFlipped == false) || (squareNum == 0 && ship.isFlipped == true))
		{
			this._drawStern(ctx, tilePos, ship);
		}
		else
		{
			this._drawHull(ctx, tilePos, ship);
		}		
	},
	
	_drawProw: function(ctx, tilePos, ship)
	{				
		var points = [];				
		//points relative to center, prow facing left...
		points.push(new Point(this._TILE_EDGE_POS, this._HULL_WIDTH_PORT));
		points.push(new Point(this._PROW_START, this._PROW_WIDTH_PORT));
		points.push(new Point(this._PROW_AHEAD, 0));
		points.push(new Point(this._PROW_START, this._PROW_WIDTH_STBD));			
		points.push(new Point(this._TILE_EDGE_POS, this._HULL_WIDTH_STBD));
		
		this._orientPoints(ship, points);	
		this._drawOnTile(ctx, tilePos, points);
	},
	
	_orientPoints: function(ship, points)
	{
		for (var i = 0; i < points.length; i++)
		{
			if (ship.isFlipped === true)
			{
				points[i].changeSigns();
			}		
			if (ship.isVertical === true)
			{
				points[i].switchXY();
			}
		}
	},
		
	_drawOnTile: function(ctx, tilePos, points)
	{
	
		var tileCenter = new Point(tilePos.x + 0.5 * this._tileSize.x, tilePos.y + 0.5 * this._tileSize.y);

		for (var i = 0; i < points.length; i++)
		{		
			//multiply by the size:
			points[i].scale(this._tileSize);
			//offset by the position of the center of the tile:
			points[i].offset(tileCenter);
		}
		
		ctx.beginPath();				
		ctx.moveTo(points[0].x, points[0].y);
		for (var i = 1; i < points.length; i++)
		{
			var point = points[i];
			ctx.lineTo(point.x, point.y);			
		}
		ctx.lineTo(points[0].x, points[0].y);
		ctx.closePath();	
		ctx.fill();		
	},
	
	_drawHull: function(ctx, tilePos, ship)
	{
		var points = [];				
		points.push(new Point(this._TILE_EDGE_NEG, this._HULL_WIDTH_PORT));
		points.push(new Point(this._TILE_EDGE_POS, this._HULL_WIDTH_PORT));
		points.push(new Point(this._TILE_EDGE_POS, this._HULL_WIDTH_STBD));
		points.push(new Point(this._TILE_EDGE_NEG, this._HULL_WIDTH_STBD));			
		
		this._orientPoints(ship, points);	
		this._drawOnTile(ctx, tilePos, points);		
	},
	
	_drawStern: function(ctx, tilePos, ship)
	{
		var points = [];				
		points.push(new Point(this._TILE_EDGE_NEG, this._HULL_WIDTH_PORT));
		points.push(new Point(-this._PROW_START, this._PROW_WIDTH_PORT));
		points.push(new Point(-this._PROW_START, this._PROW_WIDTH_STBD));			
		points.push(new Point(this._TILE_EDGE_NEG, this._HULL_WIDTH_STBD));
		
		this._orientPoints(ship, points);	
		this._drawOnTile(ctx, tilePos, points);
	},
	
	_onAimLeftClicked: function(evt)
	{
		this._myScopePos.x--;
		this._myScopePos.x = Math.max(0, this._myScopePos.x);
		$(this._aimLeftBtn).prop('disabled', (this._myScopePos.x == 0));
		$(this._aimRightBtn).prop('disabled', false);		
		this._renderEnemyCanvas();	
		this._sendAim();
	},
	
	_onAimRightClicked: function(evt)
	{
		var max = this._ARENA_SIZE - 1;
		this._myScopePos.x++;
		this._myScopePos.x = Math.min(max, this._myScopePos.x);
		$(this._aimLeftBtn).prop('disabled', false);
		$(this._aimRightBtn).prop('disabled', (this._myScopePos.x == max));		
		this._renderEnemyCanvas();	
		this._sendAim();
	},
	
	_onAimUpClicked: function(evt)
	{
		this._myScopePos.y--;
		this._myScopePos.y = Math.max(0, this._myScopePos.y);
		$(this._aimUpBtn).prop('disabled', (this._myScopePos.y == 0));
		$(this._aimDownBtn).prop('disabled', false);		
		this._renderEnemyCanvas();	
		this._sendAim();
	},
	
	_onAimDownClicked: function(evt) 
	{
		var max = this._ARENA_SIZE - 1;
		this._myScopePos.y++;
		this._myScopePos.y = Math.min(max, this._myScopePos.y);
		$(this._aimDownBtn).prop('disabled', (this._myScopePos.y == max));
		$(this._aimUpBtn).prop('disabled', false);		
		this._renderEnemyCanvas();	
		this._sendAim();
	},
		
	_onReadyClicked: function(evt)
	{
		this._myHits = [];
		this._myMisses = [];
		this._myDamage = [];
		
		$(this._positionBtn).prop('disabled', true);		
		$(this._readyBtn).prop('disabled', true);		
		$(this._myStatusEl).val("Enemy busy. Waiting.");	
		//send ajax "ready" with random number to determine who goes first
		this._coinToss = this._random(0, 1000);
		this._sendMessage("READY", 0, this._coinToss);
		
		var checkFunc = $.proxy(this._checkStatus, this);
		setTimeout(checkFunc, 500);
	},
	
	_sendMessage: function(action, option, data)
	{
		var recipient = $(this._enemyEmailEl).val();
		var sender = $(this._myEmailEl).val();
		
		var url = this._AJAX_SERVICE;		
		url += "?to=" + recipient;
		url += "&from=" + sender;	
		url += "&action=" + action;
		url += "&option=" + option;
		url += "&data=" + data;
		url += "&timestamp=" + this._lastMessageTimeStamp;
		var jqXhr = $.get(url);
	},
	
	_checkStatus: function()
	{
		//reversed sender and recipient
		var sender  = $(this._enemyEmailEl).val();
		var recipient = $(this._myEmailEl).val();
		
		var url = this._AJAX_SERVICE;		
		url += "?to=" + recipient;
		url += "&from=" + sender;	
		url += "&action=" + 'STATUS';
		url += "&option=" + '';
		url += "&data=" + '';
		url += "&timestamp=" + this._lastMessageTimeStamp;
		var alwaysFunc = $.proxy(this._onStatusReceived, this)
		var jqXhr = $.get(url).always(alwaysFunc);	
	},
	
	_onStatusReceived: function(message)
	{
		var reCheck = true;
		if (message.status == "error")
		{
			//content.php?to=d&from=e&action=other&option=1&data=x&timestamp=0
			debugger;
		}
		else if (message.status == 'EMPTY')
		{
			//no status, just try again
		}
		else if (message.status == "OK")
		{
			if (message.timestamp > this._lastMessageTimeStamp) //ensures we don't process the same messsge twice
			{
				this._lastMessageTimeStamp = message.timestamp;
				reCheck = this._processStatusMessage(message);
			}
		}
		else
		{
			debugger;
		}
		
		if (reCheck === true)
		{
			var checkFunc = $.proxy(this._checkStatus, this);
			setTimeout(checkFunc, 3000);
		}
	},
	
	_processStatusMessage: function(message)
	{
		var reCheck = true;		
		switch (message.action)
		{
			case "STARTED":
				$(this._enemyStatusEl).val("Positioning Ships...");
				break;
				
			case "READY": 
				this._processReady(message);
				break;
				
			case "AIM":
				this._processAim(message);
				break;
				
			case "FIRE":
				//enemy fired at me
				this._processIncomingFire(message);
				reCheck = false; //need a delay
				break;
				
			case "MISS":
				//enemy reported miss in response to my fire
				this._processReportedMiss(message);
				break;
				
			case "HIT":
				//enemy reported hit in response to my fire
				this._processReportedHit(message);
				break;
				
			default:
				debugger; //
				break;
		}
		
		return reCheck;
	},
	
	_processReportedMiss: function(message)
	{
		$(this._myStatusEl).val("Splash! Missed...");
		this._myMisses.push(this._myScopePos.clone());
		
		this._renderEnemyCanvas();
		var nextFunc = $.proxy(this._yieldTurn, this);
		setTimeout(nextFunc, 3000); //hit or miss fun
	},
	
	_processReportedHit: function(message)
	{
		$(this._myStatusEl).val("Crash! Hit!");
		this._myScore ++;
		this._myHits.push(this._myScopePos.clone());
		
		if (this._myScore >= this._MAX_SCORE)
		{
			debugger; //I win!!
		}
		
		this._renderEnemyCanvas();
		var nextFunc = $.proxy(this._yieldTurn, this);
		setTimeout(nextFunc, 3000); //hit or miss fun
	},
	
	_processIncomingFire: function(message)
	{
		this._enemyScopePos.x = message.option;
		this._enemyScopePos.y = message.data;	
		this._renderMyCanvas();

		var nextFunc = $.proxy(this._processIncomingMiss, this);
		
		OUTERLOOP:
		for (var s = 0; s < this._myShips.length; s++)
		{
			var ship = this._myShips[s];
			for (var i = 0; i < ship.length; i++)
			{
				if (ship.pos[i].x == this._enemyScopePos.x
						&& ship.pos[i].y == this._enemyScopePos.y)
				{
					this._myDamage.push(this._enemyScopePos.clone());
					nextFunc = $.proxy(this._processIncomingHit, this);
					break OUTERLOOP;
				}
			}
		}
		
		
		$(this._enemyStatusEl).val("Firing");
		$(this._myStatusEl ).val("Heads down! Incoming...");
		
		setTimeout(nextFunc, 5000); //hit or miss fun
	},	
	
	_processIncomingMiss: function()
	{
		$(this._enemyStatusEl).val("Waiting for you...");
		$(this._myStatusEl).val("Splash! Missed");
		this._renderMyCanvas();
		var nextFunc = $.proxy(this._startMyTurn, this);
		setTimeout(nextFunc, 5000); //hit or miss fun
		
		var checkFunc = $.proxy(this._checkStatus, this);
		setTimeout(checkFunc, 3000);

		this._sendMessage("MISS", this._enemyScopePos.x, this._enemyScopePos.y);
	},
	
	_processIncomingHit: function()
	{
		$(this._enemyStatusEl).val("Waiting for you...");
		$(this._myStatusEl).val("Crash! We're hit!");
		this._enemyScore++;
		this._renderMyCanvas();
		if (this._enemyScore >= this._MAX_SCORE)
		{
			debugger; //I LOSE!
		}
		else
		{
			var nextFunc = $.proxy(this._startMyTurn, this);
			setTimeout(nextFunc, 5000); //hit or miss fun
		}
		
		var checkFunc = $.proxy(this._checkStatus, this);
		setTimeout(checkFunc, 3000);

		this._sendMessage("HIT", this._enemyScopePos.x, this._enemyScopePos.y);
	},
	
	_processAim: function(message)
	{
		//received enemy's aim position, update my area
		this._enemyScopePos.x = message.option;
		this._enemyScopePos.y = message.data;
		$(this._enemyStatusEl).val("Aiming...");
		this._renderMyCanvas();	
	},
	
	_processReady: function(message)
	{
		if (message.data > this._coinToss)
		{
			$(this._myStatusEl).val("I go first");
			this._startMyTurn();
		}
		else
		{
			$(this._myStatusEl).val("Enemy goes first");
			this._yieldTurn();
		}
	},
	
	_sendAim: function()
	{
		this._sendMessage("AIM", this._myScopePos.x, this._myScopePos.y);
	},
	
	_startMyTurn: function()
	{
		$(this._enemyStatusEl).val("Waiting for me");
		$(this._gunButtons).prop('disabled', false);
	},
	
	_yieldTurn: function()
	{
		$(this._enemyStatusEl).val("Thinking...");	
		$(this._myStatusEl).val("Waiting for enemy");
	},
	
	_onFireClicked: function(evt)
	{
		$(this._enemyStatusEl).val("Panicking...");	
		$(this._myStatusEl).val("Firing. Wait for it...");
		$(this._gunButtons).prop('disabled', true);
		this._sendMessage("FIRE", this._myScopePos.x, this._myScopePos.y);					
	}
});

function onDomReady()
{
	var game = new Game();
}
$(document).ready(onDomReady);

