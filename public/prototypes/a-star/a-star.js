/* A* Pathfinding Demo */

//define global vars
var canvas;
var ctx;
var canvasSize = {};
var cols = 0;
var rows = 0;
var nodeSize = 15; // width/height of tiles
var nodes = []; // array to hold ALL nodes
var openNodes = []; // openList, recommend eventual switch to binary heap
var closedNodes = []; // closedList

// define Node class
var Node = function Node(x,y,walkable) {
	this.x = x;
	this.y = y;
	this.walkable = walkable;
	this.color = this.walkable ? '#888888' : '#000000';
	this.stroke = '#000000';

	this.changeState = function(){
		this.walkable = !this.walkable;
		this.color = this.walkable ? '#888888' : '#000000';
	}

	this.draw = function() {
		ctx.fillStyle = this.color;
		ctx.strokeStyle = this.stroke;
		ctx.fillRect( this.x * nodeSize, this.y * nodeSize, nodeSize, nodeSize );
		ctx.strokeRect( this.x * nodeSize, this.y * nodeSize, nodeSize, nodeSize );
		/*
		if( this.f ){
			ctx.fillStyle = '#000000';
			ctx.fillText( this.f , this.x*nodeSize + 1, this.y*nodeSize + 11, nodeSize );
		}
		if( this.g ){
			ctx.fillText( this.g , this.x*nodeSize + 1, (this.y+1)*nodeSize - 1, nodeSize );
		}
		if( this.h ){
			ctx.fillText( this.h , (this.x+1)*nodeSize - 15, (this.y+1)*nodeSize - 1, nodeSize );
		}
		*/
	}
}

// call to initialize canvas
var defineCanvas = function ( canvasId ){
	canvas = document.getElementById( canvasId );
	ctx = canvas.getContext('2d');
	canvasSize.width = canvas.getAttribute('width');
	canvasSize.height = canvas.getAttribute('height');
}

// fill out the nodes array (and go ahead and draw them)
var buildNodes = function ( ){
	for( var y = 0; y * nodeSize < canvasSize.height; y++ ){
		for( var x = 0; x * nodeSize < canvasSize.width; x++ ){

			var n = new Node( x , y , (Math.random() < .75 ? true : false) );
			nodes.push(n);

			if( y == 0 ) cols++;

		}
		rows++;
	}

	for( var n = 0; n < nodes.length; n++ ){
		nodes[n].draw();
	}
}
// do the math to retrieve a node from the 1-dimensional nodes array
var getNode = function( x , y ){
	if( x > cols - 1 || x < 0 || y > rows - 1 || y < 0 ) return false;
	return nodes[ y*cols + x ];
}
// do the real work
var loops = 0;
var getPath = function( sx , sy , ex , ey ){ // sx/sy = start x and y, ex/ey = end x and y

	loops = 0;
	var startTime = new Date().getTime();

	// define our starting and ending points
	var start = getNode( sx , sy );
	var end = getNode( ex , ey );

	if( !start.walkable || !end.walkable ) return false;

	var path = [];

	var cur = start;

	// clear open and closed lists
	openNodes = new BinaryHeap(function(n){ return n.f; });
	closedNodes = [];

	// work!
	var limit = 0; // for debugging, prevent infinite loop
	while( cur != end && limit < cols * rows ){

		// add to closed list
		cur.closed = true;
		closedNodes.push(cur); // no reason for this to be a heap

		// check all adjacent squares, loop through x-1 to x+1 and y-1 to y+1
		for( var x = cur.x - 1; x <= cur.x + 1; x++ ){
			for( var y = cur.y - 1; y <= cur.y + 1; y++ ){

				if( x == cur.x && y == cur.y ) continue; // that's this node!

				var check = getNode( x , y );

				if( check && check.walkable && !check.closed ){

					//check if diag
					var isDiag = (x==cur.x || y==cur.y ? false : true);
					//check that not diag around corner
					if( isDiag ){
						if( !getNode( x , cur.y ).walkable ||
							!getNode( cur.x , y ).walkable ) continue;
					}

					//figure g
					var g = (cur.g || 0) + (isDiag ? 14 : 10);

					//now see if it's already in our openList, and this path is better
					var inOpen = false;
					if( check.open ){
						if( !isNaN(check.g) && check.g < g ) continue; // existing path to this node is already better
						else inOpen = true;
					}

					//heuristic!
					if( !check.h ){ // in case we've already figured this out once
						var h = 0;
						var difX = Math.abs(end.x - check.x);
						var difY = Math.abs(end.y - check.y);
						while( difX > 0 && difY > 0 ){
							//diagonal
							h += 14;
							difX--; difY--;
						}
						while( difX > 0 && difY == 0 ){
							//straight horizontal
							h += 10;
							difX--;
						}
						while( difY > 0 && difX == 0 ){
							//straight vertical
							h += 10;
							difY--;
						}

						check.h = h;
					}

					var f = g+check.h;

					check.f = f;
					check.g = g;
					check.parent = cur;

					//add to the openList
					if( !inOpen ) {
						check.open = true;
						openNodes.push(check);
					}
					else {
						// need to sort the heap since a node has changed values
						openNodes.remove(check);
						openNodes.push(check);
					}


				}

			}
		}

		//check that a new node was found
		if( openNodes.size() == 0 ){
			//console.log( 'time: ' + (new Date().getTime() - startTime) );
			resetNodes();
			return false;
		}

		//find smallest f value in openList, and pull it out
		cur = openNodes.shift();
		limit++;

	}
	path.unshift( cur );
	while( cur && cur.parent && cur != start ){
		path.unshift(cur.parent);
		cur = cur.parent;
	}
	//console.log( 'time (heap): ' + (new Date().getTime() - startTime) + 'ms with ' + loops + ' loops' );

	resetNodes();

	return path;
}

var resetNodes = function(){
	for( var n = 0; n < nodes.length; n++ ){
		nodes[n].closed = false;
		nodes[n].open = false;
		nodes[n].f = undefined;
		nodes[n].g = undefined;
		nodes[n].h = undefined;
		nodes[n].parent = undefined;
	}
}


/*----------------------------*/
/*   DEFINE BINARY HEAP   */
/* ---------------------------*/
// from: http://eloquentjavascript.net/appendix2.html
function BinaryHeap(scoreFunction){
	this.content = [];
	this.scoreFunction = scoreFunction
}

BinaryHeap.prototype = {
	push: function(el){
		// add to end, then bubble up
		this.content.push(el);
		this.bubbleUp(this.content.length-1);
	},
	shift: function() { // renamed from source to better represent what it actually does
		// Store the first element so we can return it
		var ret = this.content[0];

		// check that any elements are left
		if( this.content.length > 1 ){
			// move last element to front
			this.content[0] = this.content.pop();
			// sink it
			this.sinkDown(0);
		}
		else this.content = []; // delete this last item

		return ret;
	},
	remove: function(node) {
		// check that the node is in the heap, and where
		var i = this.content.indexOf(node);
		if( i > -1 ){
			// use the same process as shift
			this.content[i] = this.content.pop();
			if( i != this.content.length ){
				if( this.scoreFunction(this.content[i]) < this.scoreFunction(node) )
					this.bubbleUp(i);
				else
					this.sinkDown(i);
			}
			return;
		}
	},
	size: function() { return this.content.length; },
	indexOf: function(node){
		var len = this.content.length;
		for( var i = 0; i < len; i++ ){
			if( this.content[i] == node ) return i;
		}
		return -1;
	},

	// the big one!
	bubbleUp: function(n) {
		// fetch element to move
		var el = this.content[n];
		// while we're not at the top
		while( n > 0 ){
			// compute parent element's index, and fetch
			var parentN = Math.floor((n+1)/2)-1,
				parent = this.content[parentN];
			// check if parent is greater and swap
			if(this.scoreFunction(el) < this.scoreFunction(parent)){
				this.content[parentN] = el;
				this.content[n] = parent;
				n = parentN;
			}
			// found a parent that is less, so stop
			else {
				break;
			}
		}
	},

	sinkDown: function(n) {
		// get target elem and its score
		var len = this.content.length,
		    el = this.content[n],
		    elScore = this.scoreFunction(el);

		// loop until broken
		while( true ){
			// figure out children
			var child2N = (n+1)*2, child1N = child2N - 1;
			// store the swap pos later
			var swap = null;
			// check if first child
			if ( child1N < len ){
				// compute its score.
				var child1 = this.content[child1N],
				    child1Score = this.scoreFunction(child1);
				// compare
				if( child1Score < elScore ) swap = child1N;
			}
			// now check child 2
			if ( child2N < len ){
				var child2 = this.content[child2N],
				    child2Score = this.scoreFunction(child2);
				if(child2Score < (swap == null ? elScore : child1Score)) swap = child2N;
			}

			// swap if needed
			if ( swap != null ){
				this.content[n] = this.content[swap];
				this.content[swap] = el;
				n = swap;
			}
			// if not, stop loop
			else break;
		}
	}
}
