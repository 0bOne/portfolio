var Caves = $.klass
({

	_MAZE_SIZE: 20,
	_maze: null,

	_input: null,
	_output: null,
	
	_gold: 0,
	_strength: 100,
	_treasure: [],
	
	_roomAdjectives: ['creepy', 'dank', 'dark', 'gloomy', 'low-ceilinged', 'narrow', 'vast', 'cold', 'warm', 'hot', 'wet', 'dry', 'sandy', 'rocky', 'beautiful', 'charming', 'huge', 'polluted', 'smelly', 'earthy'],
	_roomTypes: ['cave', 'cavern', 'grotto', 'hollow', 'subterranean area', 'torture chamber', 'vault', 'cell', 'lockup', 'room', 'area', 'space', 'region', 'corridor', 'camp', 'shack', 'den', 'hut', 'lodge'],
	_roomDecorations: ['crystals', 'diamonds', 'strains of quartz', 'sand', 'smooth rocks', 'stange lumps', 'slime patches', 'wet patches', 'wet trickles'],
	_decorationVerbs: ['glisten', 'twinkle', 'sparkle', 'glimmer', 'shine', 'flash', 'illuminate the area'],
	_decoractionLocations: ['on the walls', 'on the floor', 'on the ceiling', 'above you', 'around you', 'behind you', 'below you', 'in the crevices', 'from the corners of your eyes'],
	
	_monsters: ['dragon', 'orc', 'goblin', 'evil dwarf', 'vampire', 'hag', 'zombie', 'ghost'],
	_monsterActions: ['attacks you', 'descends upon you', 'jumps out at you', 'runs at you', 'agressively charges you', 'claws at you'],
	
	_goldContainers: ['a small chest|100', 'a large chest|500', 'a sack|50', 'a satchel|20', 'a purse|20', 'a pouch|5'],

	_treasureAjectives: ['magic', 'ancient', 'broken', 'dirty', 'new'],
	_treasureItems: ['sword', 'lantern', 'ring', 'crown', 'suit of armor', 'shirt', 'pair of boots', 'helm', 'dagger', 'goblet', 'skull', 'femur', 'shinbone', 'set of underclothes'],
	
	_lastMessageLength: 0,
		
	_posX: 0,
	_posY: 0,
	_currentRoom: null,
	
	_INDENT: "&nbsp;&nbsp;&nbsp; - ",	
	
	_title: '',
	
	begin: function()
	{
        this._input = $("#input")[0];
		this._output = $("#output")[0];
		
		this._title = document.title;
		
		var seed = $.QueryString['maze'] || "caves";
		Math.seedrandom(seed);
		
        $(this._input).val("");

		this._initializeMaze();
		
        $(this._input).keyup($.proxy(this._onInputKeyUp, this));
		$(this._input).prop('disabled', false);				
		$(this._input).focus();

		Math.seedrandom();
		
		this._currentRoom = this._maze[this._posX][this._posY];;		
		this._currentRoom.monster = null; //we don't want to start out with a monster, gold or anything like that.
		this._currentRoom.treature = [];
		this._currentRoom.gold = null;
		
		this._appendOutput("Welcome to Caves of Chaos");
		this._appendOutput("<br/>");
		this._displayCurrentLocation(false);
	},
	
	_initializeMaze: function()
	{
		this._maze = [];
		for (var x = 0; x < this._MAZE_SIZE; x++)
		{
			var mazeCol = [];
			for (var y = 0; y < this._MAZE_SIZE; y++)
			{
			   mazeCol[y] = this._generatePseudoRandomRoom(x, y);
			}						
			this._maze[x] = mazeCol;
		}
	},
	
	_generatePseudoRandomRoom: function(x, y)
	{
		var room = 
		{
			x: x,
			y: y,
			description: this._generateRoomDescription(),
			exits: this._generateExits(x, y),
			gold: this._generateGold(),
			treasure: this._generateTreasure(),
			monster: this._generateMonsterSometimes(),
		};				
		return room;
	},
	
	
	_generateGold: function()
	{
		var gold = null;
		var r = this.getRandomNumber(this._goldContainers.length * 2);
		if (r <= this._goldContainers.length)
		{
			var goldContainer = this._goldContainers[r - 1];
			var parts = goldContainer.split('|');
			var maxGold = parseInt(parts[1], 10);
			var foundGold = this.getRandomNumber(maxGold);
			gold = {amount: foundGold, description: parts[0]};			
		}
		
		return gold;
	},
	
	_generateMonsterSometimes: function()
	{
		var r = this.getRandomNumber(this._monsters.length * 4);
		var monster = null;	
		
		if (r <= this._monsters.length)
		{
			monster = this._monsters[r - 1];	
		}			
		return monster;
	},
	
	_generateTreasure: function()
	{
		var treasure = [];
		var r = this.getRandomNumber(this._treasureItems.length * 4);
		
		var MAX_TREASURE = 6;	
		
		while (r <= this._treasureItems.length && treasure.length < MAX_TREASURE)
		{
			//continue adding treasure items as long as one was found in the previous 1 in 4 random chance.
			var item = this._treasureItems[r - 1];
			
			r = this.getRandomNumber(this._treasureAjectives.length);
			var adjective = this._treasureAjectives[r - 1];

			var item = this._prefixArticle(adjective + ' ' + item);
			treasure.push(item);
			
			r = this.getRandomNumber(this._treasureItems.length * 4);			
		}
					
		return treasure;
	},
	
	_generateExits: function(x,y)
	{
		var max = this._MAZE_SIZE - 1;
		var exits = {n: false, s: false, e: false, w: false};	
		var exitCount = 0;
		var safetyLoopCount = 0;
		var MAX_SAFE_LOOPS = 10000;
		
		while (exitCount < 2 && safetyLoopCount < MAX_SAFE_LOOPS)
		{
			exits.n = (this.getRandomNumber(2) == 2) ? true: false;
			exits.s = (this.getRandomNumber(2) == 2) ? true: false;
			exits.e = (this.getRandomNumber(2) == 2) ? true: false;
			exits.w = (this.getRandomNumber(2) == 2) ? true: false;
			
			exits.n = (y == 0) ? false: exits.n; //no exit north if y is 0
			exits.s = (y == max) ? false: exits.s; //no exit south if y is maximum
			exits.w = (x == 0) ? false: exits.w; //no exit west if x is 0
			exits.e = (x == max) ? false: exits.e; //no exit east if x is maximum
			
			//ensure there is always one exit from any position
			exitCount = 0;
			exitCount += (exits.n === true)? 1: 0;
			exitCount += (exits.s === true)? 1: 0;
			exitCount += (exits.e === true)? 1: 0;
			exitCount += (exits.w === true)? 1: 0;	
			safetyLoopCount ++;			
		}
		
		if (safetyLoopCount >= MAX_SAFE_LOOPS)
		{
			this._appendOutput("error generating exits");
		}
		
		return exits;
	},
	
	_prefixArticle: function(word)
	{
		var article = "a";
		var c = word.charAt(0) 
		if (c=='a' || c=='e' || c == 'i' || c =='o' || c=='u')
		{
			article = 'an';
		}
		
		return article + ' ' + word;
	},
	
	_generateRoomDescription: function()
	{
		var ret = [];
		var r = this.getRandomNumber(this._roomAdjectives.length);
		var roomAdjective = this._roomAdjectives[r - 1];
		
		r = this.getRandomNumber(this._roomTypes.length);
		var roomType = this._roomTypes[r - 1];
		
		var roomDescription = 'You are in ' + this._prefixArticle(roomAdjective) + ' ' + roomType;
		ret.push(roomDescription);
		
		var roomDecoration = "";
		r = this.getRandomNumber(this._roomDecorations.length * 3);
		if (r <= this._roomDecorations.length)
		{
			roomDecoration = this._roomDecorations[r - 1];
			
			r = this.getRandomNumber(this._decorationVerbs.length);
			roomDecoration += ' ' + this._decorationVerbs[r - 1];
			
			r = this.getRandomNumber(this._decoractionLocations.length);
			roomDecoration += ' ' + this._decoractionLocations[r - 1];			
			
			ret.push(roomDecoration);
		}
				
		return ret;
	},
	
    _onInputKeyUp: function (evt)
    {
        if (evt.keyCode == 13)
        {
            this._processInput();
        }
    },	
	
    _appendOutput: function (newText)
    {
		newText = '' + newText;
		this._lastMessageLength += newText.length;
        var text = $(this._output).html();
        $(this._output).html(text + newText + "<br/>");	
    },	
	
    _scroll: function ()
    {
		this._appendOutput("");
        var scrollTime = this._lastMessageLength * 5;
		this._lastMessageLength = 0;
        var newScrollTop = $(this._output)[0].scrollHeight;
        $(this._output).animate({ scrollTop: newScrollTop }, scrollTime);
    },	
	
    _processInput: function ()
    {
        var inputStr = '' + $(this._input).val();
        $(this._input).val("");
		
		var inputStr = inputStr.toLowerCase();
		if (inputStr == '')
		{
			//do nothing
		}
		else if (inputStr == 'n' || inputStr == 's' || inputStr == 'e' || inputStr == 'w')
		{
			this._goDirection(inputStr);
		}
		else if (inputStr == '?')
		{
			this._showHelp();
		}
		else if (inputStr == 'a')
		{
			//look around again
			this._displayCurrentLocation(true);
		}
		else if (inputStr == 'i')
		{
			//look around again
			this._showInventory();
		}
		else
		{
			var parts = inputStr.split(",");
			var x = parseInt(parts[0], 10);
			var y = parseInt(parts[1], 10);
			
			if (parts.length == 2 && isFinite(x) && isFinite(y) && x > 0 && x < this._MAZE_SIZE && y >=0 && y < this._MAZE_SIZE)
			{
				this._posX = x;
				this._posY = y;
				this._currentRoom = this._maze[this._posX][this._posY];
				this._displayCurrentLocation(false);
			}
			else
			{
				this._appendOutput("I don't know what '" + inputStr + "' means! Type ? for help");
			}
		}
		
		if (inputStr != '')
		{
			this._scroll();
		}				
	},
	
	_showInventory: function()
	{
		this._appendOutput("Strength: " + this._strength);
		this._appendOutput("Gold: " + this._gold);

		var plural = (this._treasure.length == 1) ? "": "s";
		if (this._treasure.length > 0)
		{
			this._appendOutput("You are carrying the following item" + plural + ":");
			for (var i = 0; i < this._treasure.length; i++)
			{
				var item = this._treasure[i];
				this._appendOutput(this._INDENT + item);
			}	
		}
	},
	
	_showHelp: function()
	{
		this._appendOutput("Available commands");
		this._appendOutput(this._INDENT + "n,s,e,w: move north, south, east, or west");
		this._appendOutput(this._INDENT + "i: show inventory and statistics");
		this._appendOutput(this._INDENT + "a: look around again");		
		this._appendOutput(this._INDENT + "?: show help");		
	},

	_goDirection: function(dir)
	{	
	
		var exits = this._currentRoom.exits;
		var dx = 0;
		var dy = 0;
		var max = this._MAZE_SIZE - 1;
		
		switch(dir)
		{
			case "n":
				dy = (exits.n === true && this._posY > 0) ? -1: 0;
				break;
			case "s":
				dy = (exits.s === true && this._posY < max) ? 1: 0;
				break;
			case "e":
				dx = (exits.e === true && this._posX < max) ? 1: 0;			
				break;
			case "w":
				dx = (exits.w === true && this._posX > 0) ? -1: 0;			
				break;
		}
		
		if (dx == 0 && dy == 0)
		{
			this._appendOutput("Sorry -- you can't go in that direction");	
		}
		else
		{
			this._posX += dx;
			this._posY += dy;
			this._currentRoom = this._maze[this._posX][this._posY];
			this._displayCurrentLocation(false);
		}		
	},
	
   _displayCurrentLocation: function (lookOnly)
	{
		document.title = this._title + '(' + this._posX + ',' + this._posY + ')'
		this._displayRoom();
		if (lookOnly !== true)
		{
			this._displayMonster();
		}
		if (this._strength > 0)
		{
			this._displayGold();
			this._displayTreasure();
			this._displayExits();
		}
		else
		{
			this._appendOutput("Your strength fails you and you die.");
			this._gameOver();
		}
	},
	
	_displayMonster: function()
	{
		if (this._currentRoom.monster != null)
		{
			var monsterAction = this._prefixArticle(this._currentRoom.monster);
			var r =this.getRandomNumber(this._monsterActions.length);
			monsterAction += ' ' + this._monsterActions[r - 1];
			
			var damage = this.getRandomNumber(10) - 3;
			damage = Math.max(0, damage);
			this._appendOutput(monsterAction);
			if (damage == 0)
			{
				this._appendOutput("although it does no damage");
			}
			else
			{
				this._strength -= damage;
				this._strength = Math.max(0, this._strength);
				var plural = (damage > 1) ? "s": "";
				this._appendOutput("and damages you by " + damage + " point" + plural + ", leaving you with a strength of " + this._strength);				
			}	

			
			if (this._strength > 0 && 3 == this.getRandomNumber(3))
			{
				this._appendOutput("but you injure the " + this._currentRoom.monster + " and it runs away");								
				this._currentRoom.monster = null;
			}			
		}		
	},	
	
	_displayTreasure: function()
	{
		if (this._currentRoom.treasure.length > 0)
		{
			var plural = (this._currentRoom.treasure.length == 1) ? "": "s";
			this._appendOutput("You found the following item" + plural);
			for (var i = 0; i < this._currentRoom.treasure.length; i++)
			{
				var item = this._currentRoom.treasure[i];
				this._appendOutput(this._INDENT + item);
				this._treasure.push(item);
			}
			this._currentRoom.treasure = [];
		}
	},
	
	_displayGold: function()
	{
		if (this._currentRoom.gold != null)
		{
			//{amount: foundGold, description: parts[0]};
			var yousee = "you see ";
			if (this._currentRoom.gold.amount == 0)
			{
				this._appendOutput(yousee + this._currentRoom.gold.description + " but it is empty");				
			}
			else if (this._currentRoom.gold.amount == 1)
			{
				this._appendOutput(yousee + this._currentRoom.gold.description + " containing a single gold piece");				
			}
			else
			{
				this._appendOutput(yousee + this._currentRoom.gold.description + " containing " + this._currentRoom.gold.amount + " gold pieces");				
			}
			this._gold += this._currentRoom.gold.amount;
			if (this._currentRoom.gold.amount > 0)
			{
				this._currentRoom.gold.amount = 0;
				var plural = (this._gold == 1) ? "": "s";
				this._appendOutput("you now have " + this._gold + " gold piece" + plural);							
			}
		}		
	},
	
	_displayRoom: function()
	{
		for (var i = 0; i < this._currentRoom.description.length; i++)
		{
			var line = this._currentRoom.description[i];
			this._appendOutput(line);
		}
	},
	
	_displayExits: function()
	{
		var exitDescriptions = [];
		var addition = "";
		if (this._currentRoom.exits.n === true)
		{
			exitDescriptions.push("North");
		}
		if (this._currentRoom.exits.s === true)
		{
			exitDescriptions.push("South");
		}	
		if (this._currentRoom.exits.e === true)
		{
			exitDescriptions.push("East");
		}		
		if (this._currentRoom.exits.w === true)
		{
			exitDescriptions.push("West");
		}
	
		if (exitDescriptions.length == 0)
		{
			exitDescriptions.push("nowhere! You are trapped!");
			this._appendOutput("There are no exits. This is a trap!");	
			this._appendOutput("within a few days, you die of thirst");				
			this._gameOver();		
		}
		else if (exitDescriptions.length == 1)
		{
			addition = "only";
		}
		else
		{
			exitDescriptions.push("or " + exitDescriptions.pop());
		}
		
		if (exitDescriptions.length > 0)
		{
			var message = "You can go " + exitDescriptions.join(", ");
			this._appendOutput(message);
		}		 		
	},
	
	getRandomNumber: function (max)
    {
        ret = Math.floor((Math.random() * max) + 1);
        return ret;
    },
	
	_gameOver: function()
	{
		this._appendOutput("Game over. Refresh to try again.");	
		this._scroll();		
		$(this._input).prop('disabled', true);		
	}
	
});

function onDomReady()
{
	var game = new Caves();
	game.begin();
}
$(document).ready(onDomReady);

