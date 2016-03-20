/* classes and implementation for isometric tile display */

// constants
var TILE_WIDTH = 50;
var TILE_HEIGHT = 25;
var cols = 20;
var rows = 20;

/* Objects, which are placeable by assigning a parent tile */
var IsoObject = function IsoObject ( parentTile , sprite , sizeX , sizeY ) {

	this.parentTile = parentTile;
	this.sprite = sprite;
	this.drawOrder = 0;
	this.updateDrawOrder = function(){
		if( this.parentTile && this.sprite ){
			this.drawOrder = this.parentTile.dy + this.sprite.offsetY;
		}
	}
	this.updateDrawOrder();
	this.changeFacing = function(face){ this.sprite.changeFacing(face); }
	this.changeFrame = function(frame){ this.sprite.changeFrame(frame); }
	this.draw = function(){
		if( this.parentTile ) this.sprite.draw( ctx , this.parentTile );
	}
	this.setParent = function( tile ){
		if( tile.obj && tile.obj != this ) {
			console.log(tile.obj); throw 'tile already has an object!';
		}

		if( this.parentTile ){
			this.parentTile.obj = null;
		}
		tile.obj = this;
		this.parentTile = tile;

		this.drawOrder = tile.dy + this.sprite.offsetY;
	}

	objects.push( this );

}

/* handling of sprites */
var Sprite = function Sprite ( src , y , width , height , startFacing , startFrame , totalFrames ) {
	/**
	* Defines a Sprite.  If hasFacing, then vertical order is N, NE, E, SE, S, SW, W, NW
	* These correspond to a number, 				0   1    2   3   4   5    6   7
	* If isAnim, then horizontal is frames.  startFrame uses 0 index.
	*/
	this.src = src;
	this.img = new Image();
	this.img.src = src;
	this.base = y; // stores the sliceY of the start of the sprite, so we can change facing by moving vertically down the sprite
	this.y = y; // stores the sliceY px of the sprite, not the actual position
	this.x = 0;
	this.width = width;
	this.height = height;
	this.offsetX = 0;
	this.offsetY = 0;

	if( !isNaN(startFacing) ){
		this.y += startFacing * height;
		this.facing = startFacing;
	}
	if( !isNaN(startFrame) && !isNaN(totalFrames) ){
		this.x += startFrame * width;
		this.frames = totalFrames;
		this.frame = startFrame;
	}

	// drawImage( image , sliceX , sliceY , sliceWidth , sliceHeight , posX , posY , posWidth , posHeight )
	this.draw = function ( ctx , tile , y ) {
		// args = canvas context, tile   OR canvas context, x, y
		if( typeof tile == 'number' && typeof y == 'number' ){
			var x = tile;
		}
		else {
			var x = tile.dx + TILE_WIDTH/2 - this.width/2,
			    y = tile.dy + TILE_HEIGHT - this.height;
		}

		if( this.img.complete ) ctx.drawImage( this.img , this.x , this.y , this.width , this.height , x + this.offsetX , y + this.offsetY , this.width , this.height );
	}

	this.changeFacing = function ( facing ){
		/* 	0 = N
			1 = NE
			2 = E
			3 = SE
			4 = S
			5 = SW
			6 = W
			7 = NW
		*/
		this.y = this.base + this.height * facing;
		this.facing = facing;
	}
	this.changeFrame = function ( frame ){
		this.frame = frame;
		this.x = frame * this.width;
	}
	this.setOffset = function (x,y){
		this.offsetX = x;
		this.offsetY = y;
	}
}


/* THE TILES! */
var Tile = function Tile (x,y,difficulty,sprite,obj) {

	// NOT pixel position, but grid position
	this.x = x;
	this.y = y;

	// pixel position of top/left
	this.dx = (((cols-y)*TILE_WIDTH) / 2) + (x*TILE_WIDTH/2);
	this.dy = (y*TILE_HEIGHT)/2 + (x*TILE_HEIGHT/2);

	if( sprite ) this.sprite = sprite;
	if( obj ){
		this.obj = obj;
		this.obj.setParent( this );
	}
	else this.obj = null;

	if( !this.sprite ){
		this.image = document.createElement('canvas');
		this.imgCtx = this.image.getContext('2d');
		var imgCtx = this.imgCtx;

		imgCtx.beginPath();
		imgCtx.moveTo( TILE_WIDTH/2 , 0 );
		imgCtx.lineTo( TILE_WIDTH, TILE_HEIGHT/2 );
		imgCtx.lineTo( TILE_WIDTH/2 , TILE_HEIGHT );
		imgCtx.lineTo( 0 , TILE_HEIGHT/2 );
		imgCtx.closePath();
		imgCtx.strokeStyle = '#000000';
		imgCtx.fillStyle = '#aaaaaa';
		imgCtx.stroke();
		imgCtx.fill();
	}

	this.draw = function(color) {
		if( this.sprite ) this.sprite.draw( ctx , this );
		else if( this.image ) ctx.drawImage( this.image , this.dx, this.dy );
		else {
			ctx.beginPath();
			ctx.moveTo( this.dx + TILE_WIDTH/2 , this.dy );
			ctx.lineTo( this.dx + TILE_WIDTH, this.dy + TILE_HEIGHT/2 );
			ctx.lineTo( this.dx + TILE_WIDTH/2 , this.dy + TILE_HEIGHT );
			ctx.lineTo( this.dx , this.dy + TILE_HEIGHT/2 );
			ctx.closePath();
			ctx.strokeStyle = '#000000';
			ctx.fillStyle = color || '#cccccc';
			ctx.stroke();
			ctx.fill();
		}
		/* now handled in separate loop
		if( this.obj ) {
			this.obj.draw();
		}
		*/
	}
}

var getTile = function (x,y) {
	return tiles[(y*cols)+x];
}
