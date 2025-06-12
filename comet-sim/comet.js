
var Simulator = $.klass
({

	//TODO: checkbox to show trails or not (tail instead)
	//TODO: use starting data from input boxes.

	_canvas: null,
	_context2d: null,
	_originX: null,
	_originY: null,
	
	_starMass: 1000000,
	_starRadius: 5,
	
	_cometMass: 1,
	_G: .02,  //in our universe of arbitrary units, we choose our own gravitational constant.
	
	_cometData: {posX: 310.0, posY: 50.0, vX: 8.0, vY: -5.4, aX: 0.0, aY: 0.0},

	init: function()
	{
		this._canvas = $("CANVAS")[0];
		this._context2d = this._canvas.getContext("2d");
		
		this._originX = $(this._canvas).width()/2;
		this._originY = $(this._canvas).height()/2;
		
		this._pXInput = $("#posX")[0];
		this._pYInput = $("#posY")[0];
		this._aXInput = $("#accX")[0];
		this._aYInput = $("#accY")[0];
		this._vXInput = $("#velX")[0];
		this._vYInput = $("#velY")[0];
		
		this._pathOnlyInput = $("#pathOnly")[0];
		
		this._updateStats();
		
		$("#start").click($.proxy(this._start, this));
		$("#stop").click($.proxy(this._stop, this));
		$("#stop").hide();
	},
	
	_start: function()
	{	

		$("#start").hide();
		$("#stop").show();

		this._cometData.posX = parseFloat($(this._pXInput).val());
		this._cometData.posY = parseFloat($(this._pYInput).val());

		this._cometData.aX = parseFloat($(this._aXInput).val());
		this._cometData.aY = parseFloat($(this._aYInput).val());

		this._cometData.vX = parseFloat($(this._vXInput).val());
		this._cometData.vY = parseFloat($(this._vYInput).val());
		
		var updateFunc = $.proxy(this._updateCanvas, this);
		this._interval = setInterval(updateFunc, 50);	
	},
	
	_stop: function()
	{
		clearInterval(this._interval);
		$("#stop").hide();
		$("#start").show();
	},
	
	_updateCanvas: function()
	{
	
		var pathOnly = $(this._pathOnlyInput).is(':checked');
	
		this._calculateGravity();
		
		if (pathOnly === false)
		{
			this._drawSpace();
			this._drawStar();
			this._drawTail();
			this._drawComet();		
		}

		this._drawComet();	
		this._updateStats();
	},
	
	_updateStats: function()
	{
		$(this._pXInput).val(this._cometData.posX);
		$(this._pYInput).val(this._cometData.posY);

		$(this._aXInput).val(this._cometData.aX);
		$(this._aYInput).val(this._cometData.aY);

		$(this._vXInput).val(this._cometData.vX);
		$(this._vYInput).val(this._cometData.vY);
	},
	
	_drawSpace: function()
	{
		this._context2d.fillStyle="#000000";
		this._context2d.fillRect(0,0,this._originX * 2, this._originY * 2);
	},
	
	_drawStar: function()
	{
		this._context2d.fillStyle="#FFFF00";
		this._context2d.beginPath();
		this._context2d.arc(this._originX, this._originY, this._starRadius, 0, 2 * Math.PI);
		this._context2d.closePath();
		this._context2d.fill()
	},
	
	_drawComet: function()
	{
		this._context2d.fillStyle="#DDDDFF";
		this._context2d.beginPath();
		this._context2d.arc(this._cometData.posX, this._cometData.posY, 2, 0, 2 * Math.PI);
		this._context2d.closePath();
		this._context2d.fill()
	},
	
	_drawTail: function()
	{
		var oldStyle = this._context2d.strokeStyle;
		var oldWidth = this._context2d.lineWidth;
		this._context2d.strokeStyle="blue";
		this._context2d.lineWidth=3;

		this._context2d.beginPath();
		this._context2d.moveTo(this._cometData.posX, this._cometData.posY);
		this._context2d.lineTo(this._cometData.posX - this._cometData.aX * 10, this._cometData.posY - this._cometData.aY * 10);
		this._context2d.closePath();
		
		//this._context2d.moveTo(50,50);
		//this._context2d.lineTo(100,100);
		this._context2d.stroke();
		this._context2d.lineWidth=oldWidth;
		this._context2d.strokeStyle = oldStyle;
	},
	
	_calculateGravity: function()
	{
		var dx = 0.0 + this._originX - this._cometData.posX;
		var dy = 0.0 + this._originY - this._cometData.posY;
		
		//pythagoras, but don't sqrt it -- we only have to square it again.
		var rSquared = (dx * dx) + (dy * dy);
		var force = (this._G * this._cometMass * this._starMass) / rSquared;
		var acc = force/this._cometMass;
		
		//normalize to get the accelaration vectors.
		var r = Math.sqrt(rSquared);
		var nx = dx / r;
		var ny = dy / r;
		this._cometData.aX = acc * nx;
		this._cometData.aY = acc * ny;
		
		//calculate the new velocity
		this._cometData.vX += this._cometData.aX;
		this._cometData.vY += this._cometData.aY;
		
		//calculate the new position
		this._cometData.posX += this._cometData.vX;
		this._cometData.posY += this._cometData.vY;
		
	}

});

function onDomReady()
{
	var simulator = new Simulator();
}
$(document).ready(onDomReady);

