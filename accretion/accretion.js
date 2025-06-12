
var Simulator = $.klass
({

	_canvas: null,
	_context2d: null,
	_G: .001,  //in our universe of arbitrary units, we choose our own gravitational constant.
	
	_particles: null,
	
	_zoom: 1,

	init: function()
	{
		this._canvas = $("CANVAS")[0];
		this._context2d = this._canvas.getContext("2d");
		$("#start").click($.proxy(this._start, this));		
		$("#stop").click($.proxy(this._stop, this));
		$("#largest").click($.proxy(this._largestParticles, this));
		$("#average").click($.proxy(this._averageParticles, this));
		$("#zoomout").click($.proxy(this._zoomOut, this));
		$("#zoomin").click($.proxy(this._zoomIn, this));
		$("#stop").hide();
		$("#largest").hide();
		$("#average").hide();
		$("#zoomout").hide();
		$("#zoomin").hide();

		$("#particles").val(3000);
		this._zoom = 1;
		$("#zoom").val(this._zoom);

	},
	
	_start: function()
	{
		this._originX = $(this._canvas).width()/2;
		this._originY = $(this._canvas).height()/2;
		
		var particleCount = $("#particles").val();
		this._createParticles(particleCount);
		
		this._updateStats();
	
		var updateFunc = $.proxy(this._updateCanvas, this);
		this._interval = setInterval(updateFunc, 50);	
		
		this._drawSpace();
		
		$("#start").hide();
		$("#stop").show();
		$("#largest").show();
		$("#average").show();
		$("#zoomout").show();
		$("#zoomin").show();
		
		this._zoom = 1;
		$("#zoom").val(this._zoom);
	},
	
	_createParticles: function(particleCount)
	{
		//_cometData: {posX: 310.0, posY: 50.0, vX: 8.0, vY: -5.4, aX: 0.0, aY: 0.0},
		this._particles = [];
		this._particleCount = particleCount;
		
		var vel = 0.01;
		
		for (var i=0; i < particleCount; i++)
		{
			this._particles[i] = 
			{
				posX: this._originX + (Math.random() - 0.5) * 0.5 * $(this._canvas).width(),
				posY: this._originY + (Math.random() - 0.5) * 0.5 * $(this._canvas).height(),
				vX: (Math.random() - 0.5) * vel,
				vY: (Math.random() - 0.5) * vel,
				mass: Math.random() * 2 + 1
			};
			
			this._particles[i].size =  parseInt(Math.sqrt(this._particles[i].mass));
			//this._particles[i].newX = this._particles[i].posX;
			//this._particles[i].newY = this._particles[i].newY;
		}	
	},
	
	_zoomIn: function()
	{		
		this._zoom *= 2;
		$("#zoom").val(this._zoom);
	},	
		
	_zoomOut: function()
	{		
		this._zoom *= 0.5;
		$("#zoom").val(this._zoom);
	},	
	
	_averageParticles: function()
	{
		var posX = 0;
		var posY = 0;
		var vX = 0;
		var vY = 0;
		
		for (var i=0; i < this._particles.length; i++)
		{
			var particleData = this._particles[i];
			posX += particleData.posX;
			posY += particleData.posY;		
			vX += particleData.vX;
			vY += particleData.vY;
		}
		
		posX /= this._particles.length;
		posY /= this._particles.length;
		vX /= this._particles.length;
		vY /= this._particles.length;
		
		posX -= this._originX;
		posY -= this._originY;
						
		this._repositionParticles(posX, posY, vX, vY);
	},	
	
	_largestParticles: function()
	{
		var largestMass = -1;
		var largestIndex = -1;
		
		for (var i=0; i < this._particles.length; i++)
		{
			var particleData = this._particles[i];
			if (particleData.mass > largestMass)
			{
				largestMass = particleData.mass;
				largestIndex = i;
			}
		}
		
		var posX = this._particles[largestIndex].posX - this._originX;
		var posY = this._particles[largestIndex].posY - this._originY;
		
		var vX = this._particles[largestIndex].vX;
		var vY = this._particles[largestIndex].vY;
		
		this._repositionParticles(posX, posY, vX, vY);
	},
	
	_repositionParticles: function(posX, posY, vX, vY)
	{	
		for (var i=0; i < this._particles.length; i++)
		{
			var particleData = this._particles[i];
			particleData.posX -= posX;
			particleData.posY -= posY;

			particleData.vX -= vX;
			particleData.vY -= vY;			
		}		
	},
	
	_stop: function()
	{
		clearInterval(this._interval);
		$("#stop").hide();
		$("#start").show();
		$("#largest").hide();
		$("#average").hide();
		$("#zoomin").hide();
		$("#zommout").hide();
	},
	
	_updateCanvas: function()
	{	
		this._drawSpace();
		
		var keepers = [];
		
		for (var n = 0; n < this._particles.length; n++)
		{
			var particleData = this._particles[n];
			//this._drawParticle(particleData, "#000000");
			for (var m = n + 1; m < this._particles.length; m++)
			{
				this._calculateGravity(particleData, this._particles[m]);
			}
			if (particleData.mass > 0)
			{
				this._drawParticle(particleData, "#FFFFFF");
				keepers.push(particleData);
			}
		}
		this._particles = keepers;
	},
	
	_updateStats: function()
	{
	
	},
	
	_drawSpace: function()
	{
		this._context2d.fillStyle="#000000";
		this._context2d.fillRect(0,0,this._originX * 2, this._originY * 2);
	},
	
	_drawParticle: function(particleData, fillStyle)
	{
		if (particleData.size > 0)
		{
			this._context2d.fillStyle=fillStyle;
			this._context2d.beginPath();
			
			var posX = ((particleData.posX - this._originX) * this._zoom) + this._originX;
			var posY = ((particleData.posY - this._originY) * this._zoom) + this._originY;
			var size = particleData.size * this._zoom;
			
			size = Math.max(size, 1);
			
			if (size > 3)
			{
				this._context2d.arc(posX, posY , size, 0, 2 * Math.PI);
			}
			else
			{
				this._context2d.fillRect(posX, posY, size, size);
			}
			this._context2d.closePath();
			this._context2d.fill()
		}
	},
	
	_calculateGravity: function(particle1, particle2)
	{
		if (particle1.mass == 0 || particle2.mass == 0)
		{
			return;
		}
		var dx = 0.0 + particle1.posX - particle2.posX;
		var dy = 0.0 + particle1.posY - particle2.posY;
		
		//pythagoras, but don't sqrt it -- we only have to square it again.
		var rSquared = (dx * dx) + (dy * dy);
		var force = (this._G * particle1.mass * particle2.mass) / rSquared;
				
		//normalize to get the acceleration vectors.
		var r = Math.sqrt(rSquared);
		
		var touchDistance = (particle1.size + particle2.size);
		if (r > touchDistance)
		{
			var nx = dx / r;
			var ny = dy / r;
			
			this._applyForces(particle1, force, -nx, -ny);
			this._applyForces(particle2, force, nx, ny);
		}
		else
		{
			var mRatio = particle2.mass/particle1.mass;
			
			particle1.mass += particle2.mass;
			particle1.vX += particle2.vX * mRatio;
			particle1.vY += particle2.vY * mRatio;	
			particle2.mass = 0;
			particle1.size = parseInt(Math.sqrt(particle1.mass));
			particle2.size = 0;
		
			this._particleCount --;
			$("#particles").val(this._particleCount);
		}
	},
	
	_applyForces: function(particleData, force, nx, ny)
	{
		var accel = force/particleData.mass;
		aX = accel * nx;
		aY = accel * ny;
		particleData.vX += aX;
		particleData.vY += aY;
		particleData.posX += particleData.vX;
		particleData.posY += particleData.vY;
	}

});

function onDomReady()
{
	var simulator = new Simulator();
}
$(document).ready(onDomReady);

