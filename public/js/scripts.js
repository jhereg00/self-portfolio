(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var bps = [720,960,1200,1680];

var windowSize = require('lib/getWindowSize');

var getBreakpoint = function () {
  var size = windowSize.width();
  for (var i = 0; i < bps.length; i++) {
    if (bps[i] > size)
      return i;
  }
  return bps.length;
}

module.exports = getBreakpoint;

},{"lib/getWindowSize":5}],2:[function(require,module,exports){
// a bunch of easing functions for making animations
// all accept start, change, and percent

var eases = {
  'easeInOut' : function (s,c,p) {
    if (p < .5) {
      return s + c * (2 * p * p);
    }
    else {
      return s + c * (-2 * (p - 1) * (p - 1) + 1);
    }
  },
  'easeIn' : function (s,c,p) {
    return s + c * p * p;
  },
  'easeInCubic' : function (s,c,p) {
    return s + c * (p * p * p);
  },
  'easeOut' : function (s,c,p) {
    return s + c * (-1 * (p - 1) * (p - 1) + 1);
  },
  'easeOutCubic' : function (s,c,p) {
    return s + c * ((p - 1) * (p - 1) * (p - 1) + 1);
  },
  'linear' : function (s,c,p) {
    return s + c * p;
  }
}
module.exports = eases;

},{}],3:[function(require,module,exports){
/**
 *  Function: os.getPageOffset
 *  gets the page offset top and left of a DOM element
 */
module.exports = function getPageOffset (element) {
  if (!element) {
    console.error('getPageOffset passed an invalid element:', element);
  }
  var pageOffsetX = element.offsetLeft,
  pageOffsetY = element.offsetTop;

  while (element = element.offsetParent) {
    pageOffsetX += element.offsetLeft;
    pageOffsetY += element.offsetTop;
  }

  return {
    left : pageOffsetX,
    top : pageOffsetY
  }
}

},{}],4:[function(require,module,exports){
/**
 *  getScrollPos
 *
 *  cross browser way to get scrollTop
 */
module.exports = (function (undefined) {
  if (window.scrollY !== undefined)
    return function getScrollPos () { return window.scrollY; }
  else
    return function getScrollPos () { return document.documentElement.scrollTop; }
})();

},{}],5:[function(require,module,exports){
/**
 *  get window size, cross browser friendly
 *  call .width() or .height() to get the relevant value in pixels
 */
var windowHeight = function windowHeight () {
  return window.innerHeight || document.documentElement.clientHeight;
};
var windowWidth = function windowWidth () {
  return window.innerWidth || document.documentElement.clientWidth;
};

module.exports = {
  width: windowWidth,
  height: windowHeight
}

},{}],6:[function(require,module,exports){
/**
 *  Loop
 *
 *  The requestAnimationFrame Loop. It handles animation and state changes
 *  related to scrolling or window sizing. It can also be used for regular js
 *  driven animation as well.
 *
 *  To use:
 *    exports.addScrollFunction(fn) - adds a function to fire whenever scroll
 *      position changes
 *    exports.addResizeFunction(fn) - adds a function to fire whenever the
 *      window is resized, debounced by the value of the resizeDebounce var
 *    exports.addFunction(fn) - adds a function to fire on every iteration of
 *      the loop. Limit the use of this
 *    exports.removeFunction(fn) - removes a function from the list of functions
 *      to fire
 *    exports.start() - starts the loop (doesn't need to be called unless the
 *      loop was stopped at some point)
 *    exports.stop() - stops the loop
 *    exports.force() - forces the next iteration of the loop to fire scroll and
 *      resize functions, regardless of whether or not either things actually
 *      happened
 */

/**
 * Provides requestAnimationFrame in a cross browser way.
 * @author paulirish / http://paulirish.com/
 */
if ( !window.requestAnimationFrame ) {
	window.requestAnimationFrame = ( function() {
		return window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function( /* function FrameRequestCallback */ callback ) {
			window.setTimeout( callback, 1000 / 60 );
		};
	} )();
}

;(function (document,window,undefined) {

  // other lib helpers
  var getScrollPos = require('lib/getScrollPos');

  // private vars
  var running = true,
      lastBodyWidth = document.body.offsetWidth, // store width to determine if resize needed
      lastBodyHeight = document.body.offsetHeight, // store height to determine if resize needed
      lastScroll = -1,
      lastTime = new Date().getTime(), // last time so we know how long it's been
      resizeDebounce = 500
      ;

  // save the functions the loop should run
  // will be passed currentTime, timeChange
  var loopFuncs = {
    resize : [], // functions to run on resize
    scroll : [], // functions to run on scroll
    tick : [] // functions to run every tick
  };

  // add/remove methods for those functions
  var addLoopFunction = function addLoopFunction (type, fn) {
    if (loopFuncs[type].indexOf(fn) === -1) { // make sure it doesn't already exist (only works with non-anonymous functions)
      loopFuncs[type].push(fn);
			start();
      return true;
    }
    return false;
  }
  var addScrollFunction = function addScrollFunction (fn) {
    return addLoopFunction('scroll',fn);
  }
  var addResizeFunction = function addResizeFunction (fn) {
    return addLoopFunction('resize',fn);
  }
  var addFunction = function addFunction (fn) {
    return addLoopFunction('tick',fn);
  }
  var removeFunction = function removeFunction (fn) {
    var types = ['resize','scroll','tick'];
    var found = false;
    for (var i = 0; i < types.length; i++) {
      var index = loopFuncs[types[i]].indexOf(fn);
      if (index !== -1) {
        loopFuncs[types[i]].splice(index,1);
        found = true;
        break;
      }
    }
		// check that we're still listening
    for (var i = 0; i < types.length; i++) {
			if (loopFuncs[types[i]].length)
				break;
			else if (i === types.length - 1)
				stop();
		}
    return found;
  }

  // do all functions of a given type
  var doLoopFunctions = function doLoopFunctions (type,currentTime) {
    for (var i = 0, len = loopFuncs[type].length; i < len; i++) {
			if (loopFuncs[type][i]) // extra check for safety
      	loopFuncs[type][i].call(window,currentTime);
    }
  }

  // start/stop control
  var start = function startLoop () {
    running = true;
		loopFn();
  }
  var stop = function stopLoop () {
    running = false;
  }

  // force it to fire next time through by setting lastScroll and lastBodyWidth
  // to impossible values
  var force = function forceLoop () {
    lastBodyWidth = -1;
    lastScroll = -1;
  }

  // hold a resize timout so we can debounce it
  var resizeTimeout = null;

  // the real deal!
  // in a closure for maximum safety, and so it autostarts
  // note: after checking using jsperf, rather than making one big todo array of
  // all the functions, it's faster to call each array of functions separately
  function loopFn() {

    // check that we're actually running...
    if (running) {

      var currentTime = new Date().getTime();
      var timeChange = currentTime - lastTime;
      var currentScroll = getScrollPos();

      // check if resize
      if (document.body.offsetWidth !== lastBodyWidth || document.body.offsetHeight !== lastBodyHeight) {
        // resize is true, save new sizes
        lastBodyWidth = document.body.offsetWidth;
        lastBodyHeight = document.body.offsetHeight;

        if (resizeTimeout)
          window.clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(function () {
          doLoopFunctions('resize',currentTime);
        }, resizeDebounce);
      }

      // check if scroll
      if (lastScroll !== currentScroll) {
        // scroll is true, save new position
        lastScroll = currentScroll;

        // call each function
        doLoopFunctions('scroll',currentTime);
      }

      // do the always functions
      doLoopFunctions('tick',currentTime);

      // save the new time
      lastTime = currentTime;

			// make sure we do the tick again next time
	    requestAnimationFrame(loopFn);
    }
  };

  // export the useful functions
  module.exports = {
    addScrollFunction: addScrollFunction,
    addResizeFunction: addResizeFunction,
    addFunction: addFunction,
    removeFunction: removeFunction,
    start: start,
    stop: stop,
    force: force
  }

})(document,window);

},{"lib/getScrollPos":4}],7:[function(require,module,exports){
/**
 *  Useful class for handling parallaxing things
 *  Stores object measurements and returns percentage of scroll when asked
 */

// helpers
var getPageOffset = require('lib/getPageOffset'),
    windowSize = require('lib/getWindowSize'),
    getScrollPos = require('lib/getScrollPos'),
    loop = require('lib/loop')
    ;


var Parallax = function Parallax (element, onScroll) {
  if (!this instanceof Parallax)
    return new Parallax(element);

  var _this = this;
  this.element = element;

  // get measurements immediately
  this.measure();
  if (onScroll)
    onScroll(_this.getPercentage());

  // listeners
  this.onResize = function measureParallax () {
    _this.measure();
  }
  if (onScroll) {
    this.onScroll = function scrollParallax () {
      onScroll(_this.getPercentage());
    }
  }

  // start 'er up
  this.init();
}
Parallax.prototype = {
  measure: function () {
    var po = getPageOffset(this.element);
    this.top = po.top - windowSize.height();
    this.bottom = po.top + this.element.offsetHeight;
    this.height = this.bottom - this.top;
  },
  getPercentage: function () {
    var scrollY = getScrollPos();
    var perc = (scrollY - this.top) / (this.height);
    return perc;
  },
  init: function () {
    loop.addResizeFunction(this.onResize);
    if (this.onScroll)
      loop.addScrollFunction(this.onScroll);
  },
  destroy: function () {
    loop.removeFunction(this.onResize);
    if (this.onScroll)
      loop.removeFunction(this.onScroll);
  }
}

module.exports = Parallax;

},{"lib/getPageOffset":3,"lib/getScrollPos":4,"lib/getWindowSize":5,"lib/loop":6}],8:[function(require,module,exports){
/**
 *  Sets Transform styles cross browser
 *  @param {HTMLElement}
 *  @param {string} value of the transform style
 */

var transformAttributes = ['transform','webkitTransform','mozTransform','msTransform'];
var setTransform = function (element, transformString) {
  for (var i = 0, len = transformAttributes.length; i < len; i++) {
    element.style[transformAttributes[i]] = transformString;
  }
}

module.exports = setTransform;

},{}],9:[function(require,module,exports){
/**
 *  Full Article controller
 */

// requirements
var Halftone = require('objects/halftone');

// settings
var HEADER_HALFTONE_SETTINGS = {
  fade: 12
}
var INNER_HALFTONE_SETTINGS = {
  fade: 0,
  imageSizing: 'contain',
  inEaseStart: .1, // scroll percentage to start animation in on first dot
  inEaseEnd: .5, // scroll percentage to end animation in on last dot
  cornering: 4
}

/**
 *  Article class
 *  @param {HTMLElement} the whole damn article
 */
var Article = function (element) {
  this.element = element;

  // init header
  var headerEl = element.querySelector('.article__header');
  if (headerEl) {
    this.header = new Halftone(headerEl, HEADER_HALFTONE_SETTINGS);
  }

  // init other halftones
  var halftoneEls = element.querySelectorAll('.halftone');
  this.halftones = [];
  for (var i = 0, len = halftoneEls.length; i < len; i++) {
    this.halftones.push(new Halftone(halftoneEls[i], INNER_HALFTONE_SETTINGS));
  }
}

// temp init article
window.article = new Article(document.querySelector('.article'));

},{"objects/halftone":10}],10:[function(require,module,exports){
/**
 *  Controls cool halftone thingies
 */

// requirements
var eases = require('lib/ease');
var ScrollController = require('lib/scrollController');
var setTransform = require('lib/setTransform');
var windowSize = require('lib/getWindowSize');
var getBreakpoint = require('lib/breakpoints');
var loop = require('lib/loop');

// settings
var DEFAULTS = {
  fade: 4, // rows to fade top and bottom, if 0 the canvas is sized to be contained instead of overflow on the sides
  maxRadius: 15, // maximum radius for a dot
  inEaseFn: eases.easeOut,
  inEaseStart: .2, // scroll percentage to start animation in on first dot
  inEaseEnd: .8, // scroll percentage to end animation in on last dot
  outEaseFn: eases.linear,
  outEaseStart: .6, // scroll percentage to start animation out on first dot
  outEaseEnd: 1.4, // scroll percentage to end animation out on last dot
  fixed: false, // fixed position and full screen?
  imageSizing: 'cover', // 'cover' or 'contain'
  cornering: 0 // diagnal top left fade
}

/**
 *  Dot class
 *  @param {int} grid position X
 *  @param {int} grid position Y
 *  @param {Number} max radius
 *  @param {Halftone} parent halftone object
 *
 *  @method draw ({canvas context})
 *  @method setRadiusByPercentage ({percent of max radius})
 */
var Dot = function (gridX, gridY, maxRadius, parent) {
  this.gridX = gridX;
  this.gridY = gridY;
  this.maxRadius = maxRadius;
  this.radius = maxRadius;
  this.parent = parent;
  this.percentage = (this.gridX + this.gridY) / (this.parent.columns + this.parent.rows);

  // define location within canvas context
  this.x = this.gridX * this.parent.settings.maxRadius;
  this.y = this.gridY * this.parent.settings.maxRadius;
  if (this.parent.settings.fade)
    this.y += this.parent.settings.maxRadius;

  // handle cornering
  if (this.parent.settings.cornering && this.gridX + this.gridY <= this.parent.settings.cornering + 1) {
    this.maxRadius = eases.linear(.33,.66,(this.gridX + this.gridY) / (this.parent.settings.cornering + 1)) * this.maxRadius;
    this.radius = this.maxRadius;
  }
  else if (this.parent.settings.cornering && -1 * ((this.gridX + this.gridY) - (this.parent.columns + this.parent.rows - 2)) <= this.parent.settings.cornering + 1) {
    this.maxRadius = eases.linear(.33,.66,-1 * ((this.gridX + this.gridY) - (this.parent.columns + this.parent.rows - 2)) / (this.parent.settings.cornering + 1)) * this.maxRadius;
    this.radius = this.maxRadius;
  }
}
Dot.prototype = {
  draw: function (ctx) {
    ctx.moveTo(this.x, this.y - this.radius);
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
  },
  setRadiusByPercentage: function (percent) {
    this.radius = Math.max(0, Math.min(this.maxRadius, percent * this.maxRadius));
  }
}

/**
 *  Halftone class
 *  @param {HTMLElement} element, optionally with a background image, to turn into the toy
 *  @param {object} settings that can override DEFAULTS defined above
 *
 *  @method draw({percentage of animation progress})
 *  @method createCanvas()
 *  @method getPercentageFromScroll() - returns a percentage of progress past element based on scrolling
 *  @method init()
 */
var Halftone = function (element, settings) {
  this.element = element;
  this.settings = {};
  settings = settings || {};
  for (var prop in DEFAULTS) {
    this.settings[prop] = settings[prop] !== undefined ? settings[prop] : DEFAULTS[prop];
  }

  var computedStyle = getComputedStyle(this.element);
  // make sure positioning is valid
  if (computedStyle.position === 'static') {
    this.element.style.position = 'relative';
  }
  // set up color and image
  this.fill = computedStyle.backgroundColor;
  if (!!computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
    this.image = new Image();
    this.image.src = computedStyle.backgroundImage.match(/\((?:'|")?(.+?)(?:'|")?\)/)[1];
    console.log(this.image);
  }
  this.element.style.background = 'none';

  // listeners
  var _this = this;
  this.onResize = function () {
    _this.createCanvas();
  }
  this.onScroll = function (percentage) {
    _this.draw(percentage);
  }

  // autostart
  this.init();
}
Halftone.prototype = {
  draw: function (percentage) {
    if (!this.canvas) {
      return false;
    }

    // clear current crap
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.ctx.save();
    this.ctx.beginPath();
    // handle animation
    // in vars
    var effectiveInPerc = (percentage - this.settings.inEaseStart) / (this.settings.inEaseEnd - this.settings.inEaseStart);
    effectiveInPerc = effectiveInPerc < 1 ? this.settings.inEaseFn(-1,3,effectiveInPerc) : 2;
    // out vars
    var effectiveOutPerc = (percentage - this.settings.outEaseStart) / (this.settings.outEaseEnd - this.settings.outEaseStart);
    effectiveOutPerc = effectiveOutPerc > 0 ? this.settings.outEaseFn(2,-3,effectiveOutPerc) : 2;

    for (var i = 0, len = this.dots.length; i < len; i++) {
      var dotInPerc = effectiveInPerc - this.dots[i].percentage;
      var dotOutPerc = effectiveOutPerc - (1 - this.dots[i].percentage);
      this.dots[i].setRadiusByPercentage(Math.min(dotInPerc,dotOutPerc));
      this.dots[i].draw(this.ctx);
    }

    this.ctx.fill();

    if (this.image && this.imageOffsets) {
      console.log('try draw image');
      this.ctx.globalCompositeOperation = "source-atop";
      this.ctx.drawImage(this.image, this.imageOffsets.x, this.imageOffsets.y, this.imageOffsets.width, this.imageOffsets.height);
    }
    this.ctx.restore();
  },
  createCanvas: function () {
    // kill existing canvas
    if (this.canvas) {
      this.canvas.remove();
    }
    // create new canvas and dots
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('class','canvas-halftone');
    if (!this.settings.fixed || getBreakpoint() < 3) {
      // normal sizing and positioning
      var columns = Math.floor(this.element.offsetWidth / this.settings.maxRadius);
      var rows = Math.floor(this.element.offsetHeight / this.settings.maxRadius);
      if (this.settings.fade) {
        columns += 2;
        rows += this.settings.fade * 2 + 2;
      }
      else {
        if (columns % 2 === 0)
          columns += 1;
        if (rows % 2 === 0)
          rows += 1;
      }
    }
    else {
      // fixed sizing and positioning
      var columns = Math.floor(windowSize.width() / this.settings.maxRadius) + 2;
      var rows = Math.floor(windowSize.height() / this.settings.maxRadius) + this.settings.fade * 2 + 2;
      setTransform(this.element,'none');
      setTransform(this.canvas,'none');
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = this.settings.fade * this.settings.maxRadius * -1 + 'px';
      this.canvas.style.left = 0;
    }
    this.canvas.width = (columns - 1) * this.settings.maxRadius;
    this.canvas.height = (this.settings.fade ? rows + 1 : rows - 1) * this.settings.maxRadius;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.fillStyle = this.fill;
    this.columns = columns;
    this.rows = rows;

    // define the dots
    this.dots = [];
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < columns; x+= 2) {
        var rad;
        if (y < this.settings.fade) {
          rad = (y + 1) / (this.settings.fade + 1) * this.settings.maxRadius;
        }
        else if (y >= rows - this.settings.fade) {
          rad = -1 * (y + 1 - rows) / (this.settings.fade + 1) * this.settings.maxRadius;
        }
        else if (!this.settings.fade && y === 0 && x === 0 && !this.settings.fixed) {
          continue;
        }
        else if (!this.settings.fade && y === 0 && x === columns - 1 && !this.settings.fixed) {
          continue;
        }
        else if (!this.settings.fade && y === rows - 1 && x === 0 && !this.settings.fixed) {
          continue;
        }
        else if (!this.settings.fade && y === rows - 1 && x === columns - 1 && !this.settings.fixed) {
          continue;
        }
        else {
          rad = this.settings.maxRadius;
        }
        this.dots.push(new Dot(y % 2 ? x + 1 : x, y, rad, this));
      }
    }

    this.element.appendChild(this.canvas);

    // determine image size
    if (this.image) {
      if (this.image.complete) {
        this.sizeImage();
      }
      else {
        var _this = this;
        this.image.onload = function () {
          _this.sizeImage();
          _this.draw(getBreakpoint() >= 3 ? _this.scrollController.getPercentage() : .45);
        }
      }
    }

    // establish scroll based controls only if screen is large enough for us to care
    if (getBreakpoint() >= 3) {
      this.scrollController = new ScrollController(this.element, this.onScroll);
    }
    else {
      this.draw(.45);
    }
  },
  sizeImage: function () {
    var scale = this.canvas.width / this.image.width;
    if (this.settings.imageSizing === 'cover' && scale * this.image.height < this.canvas.height) {
      scale = this.canvas.height / this.image.height;
    }
    else if (this.settings.imageSizing === 'contain' && scale * this.image.height > this.canvas.height) {
      scale = this.canvas.height / this.image.height;
    }
    //this.imageScale = scale;
    this.imageOffsets = {
      x: (this.canvas.width - this.image.width * scale) / 2,
      y: (this.canvas.height - this.image.height * scale) / 2,
      width: this.image.width * scale,
      height: this.image.height * scale
    }
  },
  getPercentageFromScroll: function () {
    return this.scrollController.getPercentage();
  },
  init: function () {
    // make the canvas
    this.createCanvas();

    // scroll listener added in createCanvas fn

    // listen for resize
    loop.addResizeFunction(this.onResize);
  },
  destroy: function () {
    if (this.scrollController)
      this.scrollController.destroy();
    loop.removeFunction(this.onResize);
    this.canvas.remove();
    delete this;
  }
}

// temp auto init
// var htrEls = document.querySelectorAll('.halftone');
// var htrs = [];
// for (var i = 0, len = htrEls.length; i < len; i++) {
//   htrs.push(new Halftone(htrEls[i], { fade: 12, fixed: false }));
// }
// window.htrs = htrs;
module.exports = Halftone;

},{"lib/breakpoints":1,"lib/ease":2,"lib/getWindowSize":5,"lib/loop":6,"lib/scrollController":7,"lib/setTransform":8}],11:[function(require,module,exports){
/**
 *  scripts.js
 *  This should include objects, which in turn include the lib files they need.
 *  This keeps us using a modular approach to dev while also only including the
 *  parts of the library we need.
 */
// objects
require('objects/article');

},{"objects/article":9}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYnJlYWtwb2ludHMuanMiLCJsaWIvZWFzZS5qcyIsImxpYi9nZXRQYWdlT2Zmc2V0LmpzIiwibGliL2dldFNjcm9sbFBvcy5qcyIsImxpYi9nZXRXaW5kb3dTaXplLmpzIiwibGliL2xvb3AuanMiLCJsaWIvc2Nyb2xsQ29udHJvbGxlci5qcyIsImxpYi9zZXRUcmFuc2Zvcm0uanMiLCJvYmplY3RzL2FydGljbGUuanMiLCJvYmplY3RzL2hhbGZ0b25lLmpzIiwic2NyaXB0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGJwcyA9IFs3MjAsOTYwLDEyMDAsMTY4MF07XG5cbnZhciB3aW5kb3dTaXplID0gcmVxdWlyZSgnbGliL2dldFdpbmRvd1NpemUnKTtcblxudmFyIGdldEJyZWFrcG9pbnQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzaXplID0gd2luZG93U2l6ZS53aWR0aCgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJwcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChicHNbaV0gPiBzaXplKVxuICAgICAgcmV0dXJuIGk7XG4gIH1cbiAgcmV0dXJuIGJwcy5sZW5ndGg7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0QnJlYWtwb2ludDtcbiIsIi8vIGEgYnVuY2ggb2YgZWFzaW5nIGZ1bmN0aW9ucyBmb3IgbWFraW5nIGFuaW1hdGlvbnNcbi8vIGFsbCBhY2NlcHQgc3RhcnQsIGNoYW5nZSwgYW5kIHBlcmNlbnRcblxudmFyIGVhc2VzID0ge1xuICAnZWFzZUluT3V0JyA6IGZ1bmN0aW9uIChzLGMscCkge1xuICAgIGlmIChwIDwgLjUpIHtcbiAgICAgIHJldHVybiBzICsgYyAqICgyICogcCAqIHApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBzICsgYyAqICgtMiAqIChwIC0gMSkgKiAocCAtIDEpICsgMSk7XG4gICAgfVxuICB9LFxuICAnZWFzZUluJyA6IGZ1bmN0aW9uIChzLGMscCkge1xuICAgIHJldHVybiBzICsgYyAqIHAgKiBwO1xuICB9LFxuICAnZWFzZUluQ3ViaWMnIDogZnVuY3Rpb24gKHMsYyxwKSB7XG4gICAgcmV0dXJuIHMgKyBjICogKHAgKiBwICogcCk7XG4gIH0sXG4gICdlYXNlT3V0JyA6IGZ1bmN0aW9uIChzLGMscCkge1xuICAgIHJldHVybiBzICsgYyAqICgtMSAqIChwIC0gMSkgKiAocCAtIDEpICsgMSk7XG4gIH0sXG4gICdlYXNlT3V0Q3ViaWMnIDogZnVuY3Rpb24gKHMsYyxwKSB7XG4gICAgcmV0dXJuIHMgKyBjICogKChwIC0gMSkgKiAocCAtIDEpICogKHAgLSAxKSArIDEpO1xuICB9LFxuICAnbGluZWFyJyA6IGZ1bmN0aW9uIChzLGMscCkge1xuICAgIHJldHVybiBzICsgYyAqIHA7XG4gIH1cbn1cbm1vZHVsZS5leHBvcnRzID0gZWFzZXM7XG4iLCIvKipcbiAqICBGdW5jdGlvbjogb3MuZ2V0UGFnZU9mZnNldFxuICogIGdldHMgdGhlIHBhZ2Ugb2Zmc2V0IHRvcCBhbmQgbGVmdCBvZiBhIERPTSBlbGVtZW50XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0UGFnZU9mZnNldCAoZWxlbWVudCkge1xuICBpZiAoIWVsZW1lbnQpIHtcbiAgICBjb25zb2xlLmVycm9yKCdnZXRQYWdlT2Zmc2V0IHBhc3NlZCBhbiBpbnZhbGlkIGVsZW1lbnQ6JywgZWxlbWVudCk7XG4gIH1cbiAgdmFyIHBhZ2VPZmZzZXRYID0gZWxlbWVudC5vZmZzZXRMZWZ0LFxuICBwYWdlT2Zmc2V0WSA9IGVsZW1lbnQub2Zmc2V0VG9wO1xuXG4gIHdoaWxlIChlbGVtZW50ID0gZWxlbWVudC5vZmZzZXRQYXJlbnQpIHtcbiAgICBwYWdlT2Zmc2V0WCArPSBlbGVtZW50Lm9mZnNldExlZnQ7XG4gICAgcGFnZU9mZnNldFkgKz0gZWxlbWVudC5vZmZzZXRUb3A7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGxlZnQgOiBwYWdlT2Zmc2V0WCxcbiAgICB0b3AgOiBwYWdlT2Zmc2V0WVxuICB9XG59XG4iLCIvKipcbiAqICBnZXRTY3JvbGxQb3NcbiAqXG4gKiAgY3Jvc3MgYnJvd3NlciB3YXkgdG8gZ2V0IHNjcm9sbFRvcFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAodW5kZWZpbmVkKSB7XG4gIGlmICh3aW5kb3cuc2Nyb2xsWSAhPT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBmdW5jdGlvbiBnZXRTY3JvbGxQb3MgKCkgeyByZXR1cm4gd2luZG93LnNjcm9sbFk7IH1cbiAgZWxzZVxuICAgIHJldHVybiBmdW5jdGlvbiBnZXRTY3JvbGxQb3MgKCkgeyByZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcDsgfVxufSkoKTtcbiIsIi8qKlxuICogIGdldCB3aW5kb3cgc2l6ZSwgY3Jvc3MgYnJvd3NlciBmcmllbmRseVxuICogIGNhbGwgLndpZHRoKCkgb3IgLmhlaWdodCgpIHRvIGdldCB0aGUgcmVsZXZhbnQgdmFsdWUgaW4gcGl4ZWxzXG4gKi9cbnZhciB3aW5kb3dIZWlnaHQgPSBmdW5jdGlvbiB3aW5kb3dIZWlnaHQgKCkge1xuICByZXR1cm4gd2luZG93LmlubmVySGVpZ2h0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XG59O1xudmFyIHdpbmRvd1dpZHRoID0gZnVuY3Rpb24gd2luZG93V2lkdGggKCkge1xuICByZXR1cm4gd2luZG93LmlubmVyV2lkdGggfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHdpZHRoOiB3aW5kb3dXaWR0aCxcbiAgaGVpZ2h0OiB3aW5kb3dIZWlnaHRcbn1cbiIsIi8qKlxuICogIExvb3BcbiAqXG4gKiAgVGhlIHJlcXVlc3RBbmltYXRpb25GcmFtZSBMb29wLiBJdCBoYW5kbGVzIGFuaW1hdGlvbiBhbmQgc3RhdGUgY2hhbmdlc1xuICogIHJlbGF0ZWQgdG8gc2Nyb2xsaW5nIG9yIHdpbmRvdyBzaXppbmcuIEl0IGNhbiBhbHNvIGJlIHVzZWQgZm9yIHJlZ3VsYXIganNcbiAqICBkcml2ZW4gYW5pbWF0aW9uIGFzIHdlbGwuXG4gKlxuICogIFRvIHVzZTpcbiAqICAgIGV4cG9ydHMuYWRkU2Nyb2xsRnVuY3Rpb24oZm4pIC0gYWRkcyBhIGZ1bmN0aW9uIHRvIGZpcmUgd2hlbmV2ZXIgc2Nyb2xsXG4gKiAgICAgIHBvc2l0aW9uIGNoYW5nZXNcbiAqICAgIGV4cG9ydHMuYWRkUmVzaXplRnVuY3Rpb24oZm4pIC0gYWRkcyBhIGZ1bmN0aW9uIHRvIGZpcmUgd2hlbmV2ZXIgdGhlXG4gKiAgICAgIHdpbmRvdyBpcyByZXNpemVkLCBkZWJvdW5jZWQgYnkgdGhlIHZhbHVlIG9mIHRoZSByZXNpemVEZWJvdW5jZSB2YXJcbiAqICAgIGV4cG9ydHMuYWRkRnVuY3Rpb24oZm4pIC0gYWRkcyBhIGZ1bmN0aW9uIHRvIGZpcmUgb24gZXZlcnkgaXRlcmF0aW9uIG9mXG4gKiAgICAgIHRoZSBsb29wLiBMaW1pdCB0aGUgdXNlIG9mIHRoaXNcbiAqICAgIGV4cG9ydHMucmVtb3ZlRnVuY3Rpb24oZm4pIC0gcmVtb3ZlcyBhIGZ1bmN0aW9uIGZyb20gdGhlIGxpc3Qgb2YgZnVuY3Rpb25zXG4gKiAgICAgIHRvIGZpcmVcbiAqICAgIGV4cG9ydHMuc3RhcnQoKSAtIHN0YXJ0cyB0aGUgbG9vcCAoZG9lc24ndCBuZWVkIHRvIGJlIGNhbGxlZCB1bmxlc3MgdGhlXG4gKiAgICAgIGxvb3Agd2FzIHN0b3BwZWQgYXQgc29tZSBwb2ludClcbiAqICAgIGV4cG9ydHMuc3RvcCgpIC0gc3RvcHMgdGhlIGxvb3BcbiAqICAgIGV4cG9ydHMuZm9yY2UoKSAtIGZvcmNlcyB0aGUgbmV4dCBpdGVyYXRpb24gb2YgdGhlIGxvb3AgdG8gZmlyZSBzY3JvbGwgYW5kXG4gKiAgICAgIHJlc2l6ZSBmdW5jdGlvbnMsIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciBvciBub3QgZWl0aGVyIHRoaW5ncyBhY3R1YWxseVxuICogICAgICBoYXBwZW5lZFxuICovXG5cbi8qKlxuICogUHJvdmlkZXMgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIGluIGEgY3Jvc3MgYnJvd3NlciB3YXkuXG4gKiBAYXV0aG9yIHBhdWxpcmlzaCAvIGh0dHA6Ly9wYXVsaXJpc2guY29tL1xuICovXG5pZiAoICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICkge1xuXHR3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gKCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuXHRcdHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHR3aW5kb3cub1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuXHRcdHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuXHRcdGZ1bmN0aW9uKCAvKiBmdW5jdGlvbiBGcmFtZVJlcXVlc3RDYWxsYmFjayAqLyBjYWxsYmFjayApIHtcblx0XHRcdHdpbmRvdy5zZXRUaW1lb3V0KCBjYWxsYmFjaywgMTAwMCAvIDYwICk7XG5cdFx0fTtcblx0fSApKCk7XG59XG5cbjsoZnVuY3Rpb24gKGRvY3VtZW50LHdpbmRvdyx1bmRlZmluZWQpIHtcblxuICAvLyBvdGhlciBsaWIgaGVscGVyc1xuICB2YXIgZ2V0U2Nyb2xsUG9zID0gcmVxdWlyZSgnbGliL2dldFNjcm9sbFBvcycpO1xuXG4gIC8vIHByaXZhdGUgdmFyc1xuICB2YXIgcnVubmluZyA9IHRydWUsXG4gICAgICBsYXN0Qm9keVdpZHRoID0gZG9jdW1lbnQuYm9keS5vZmZzZXRXaWR0aCwgLy8gc3RvcmUgd2lkdGggdG8gZGV0ZXJtaW5lIGlmIHJlc2l6ZSBuZWVkZWRcbiAgICAgIGxhc3RCb2R5SGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5vZmZzZXRIZWlnaHQsIC8vIHN0b3JlIGhlaWdodCB0byBkZXRlcm1pbmUgaWYgcmVzaXplIG5lZWRlZFxuICAgICAgbGFzdFNjcm9sbCA9IC0xLFxuICAgICAgbGFzdFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSwgLy8gbGFzdCB0aW1lIHNvIHdlIGtub3cgaG93IGxvbmcgaXQncyBiZWVuXG4gICAgICByZXNpemVEZWJvdW5jZSA9IDUwMFxuICAgICAgO1xuXG4gIC8vIHNhdmUgdGhlIGZ1bmN0aW9ucyB0aGUgbG9vcCBzaG91bGQgcnVuXG4gIC8vIHdpbGwgYmUgcGFzc2VkIGN1cnJlbnRUaW1lLCB0aW1lQ2hhbmdlXG4gIHZhciBsb29wRnVuY3MgPSB7XG4gICAgcmVzaXplIDogW10sIC8vIGZ1bmN0aW9ucyB0byBydW4gb24gcmVzaXplXG4gICAgc2Nyb2xsIDogW10sIC8vIGZ1bmN0aW9ucyB0byBydW4gb24gc2Nyb2xsXG4gICAgdGljayA6IFtdIC8vIGZ1bmN0aW9ucyB0byBydW4gZXZlcnkgdGlja1xuICB9O1xuXG4gIC8vIGFkZC9yZW1vdmUgbWV0aG9kcyBmb3IgdGhvc2UgZnVuY3Rpb25zXG4gIHZhciBhZGRMb29wRnVuY3Rpb24gPSBmdW5jdGlvbiBhZGRMb29wRnVuY3Rpb24gKHR5cGUsIGZuKSB7XG4gICAgaWYgKGxvb3BGdW5jc1t0eXBlXS5pbmRleE9mKGZuKSA9PT0gLTEpIHsgLy8gbWFrZSBzdXJlIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdCAob25seSB3b3JrcyB3aXRoIG5vbi1hbm9ueW1vdXMgZnVuY3Rpb25zKVxuICAgICAgbG9vcEZ1bmNzW3R5cGVdLnB1c2goZm4pO1xuXHRcdFx0c3RhcnQoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIGFkZFNjcm9sbEZ1bmN0aW9uID0gZnVuY3Rpb24gYWRkU2Nyb2xsRnVuY3Rpb24gKGZuKSB7XG4gICAgcmV0dXJuIGFkZExvb3BGdW5jdGlvbignc2Nyb2xsJyxmbik7XG4gIH1cbiAgdmFyIGFkZFJlc2l6ZUZ1bmN0aW9uID0gZnVuY3Rpb24gYWRkUmVzaXplRnVuY3Rpb24gKGZuKSB7XG4gICAgcmV0dXJuIGFkZExvb3BGdW5jdGlvbigncmVzaXplJyxmbik7XG4gIH1cbiAgdmFyIGFkZEZ1bmN0aW9uID0gZnVuY3Rpb24gYWRkRnVuY3Rpb24gKGZuKSB7XG4gICAgcmV0dXJuIGFkZExvb3BGdW5jdGlvbigndGljaycsZm4pO1xuICB9XG4gIHZhciByZW1vdmVGdW5jdGlvbiA9IGZ1bmN0aW9uIHJlbW92ZUZ1bmN0aW9uIChmbikge1xuICAgIHZhciB0eXBlcyA9IFsncmVzaXplJywnc2Nyb2xsJywndGljayddO1xuICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBpbmRleCA9IGxvb3BGdW5jc1t0eXBlc1tpXV0uaW5kZXhPZihmbik7XG4gICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgIGxvb3BGdW5jc1t0eXBlc1tpXV0uc3BsaWNlKGluZGV4LDEpO1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblx0XHQvLyBjaGVjayB0aGF0IHdlJ3JlIHN0aWxsIGxpc3RlbmluZ1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChsb29wRnVuY3NbdHlwZXNbaV1dLmxlbmd0aClcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRlbHNlIGlmIChpID09PSB0eXBlcy5sZW5ndGggLSAxKVxuXHRcdFx0XHRzdG9wKCk7XG5cdFx0fVxuICAgIHJldHVybiBmb3VuZDtcbiAgfVxuXG4gIC8vIGRvIGFsbCBmdW5jdGlvbnMgb2YgYSBnaXZlbiB0eXBlXG4gIHZhciBkb0xvb3BGdW5jdGlvbnMgPSBmdW5jdGlvbiBkb0xvb3BGdW5jdGlvbnMgKHR5cGUsY3VycmVudFRpbWUpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gbG9vcEZ1bmNzW3R5cGVdLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAobG9vcEZ1bmNzW3R5cGVdW2ldKSAvLyBleHRyYSBjaGVjayBmb3Igc2FmZXR5XG4gICAgICBcdGxvb3BGdW5jc1t0eXBlXVtpXS5jYWxsKHdpbmRvdyxjdXJyZW50VGltZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gc3RhcnQvc3RvcCBjb250cm9sXG4gIHZhciBzdGFydCA9IGZ1bmN0aW9uIHN0YXJ0TG9vcCAoKSB7XG4gICAgcnVubmluZyA9IHRydWU7XG5cdFx0bG9vcEZuKCk7XG4gIH1cbiAgdmFyIHN0b3AgPSBmdW5jdGlvbiBzdG9wTG9vcCAoKSB7XG4gICAgcnVubmluZyA9IGZhbHNlO1xuICB9XG5cbiAgLy8gZm9yY2UgaXQgdG8gZmlyZSBuZXh0IHRpbWUgdGhyb3VnaCBieSBzZXR0aW5nIGxhc3RTY3JvbGwgYW5kIGxhc3RCb2R5V2lkdGhcbiAgLy8gdG8gaW1wb3NzaWJsZSB2YWx1ZXNcbiAgdmFyIGZvcmNlID0gZnVuY3Rpb24gZm9yY2VMb29wICgpIHtcbiAgICBsYXN0Qm9keVdpZHRoID0gLTE7XG4gICAgbGFzdFNjcm9sbCA9IC0xO1xuICB9XG5cbiAgLy8gaG9sZCBhIHJlc2l6ZSB0aW1vdXQgc28gd2UgY2FuIGRlYm91bmNlIGl0XG4gIHZhciByZXNpemVUaW1lb3V0ID0gbnVsbDtcblxuICAvLyB0aGUgcmVhbCBkZWFsIVxuICAvLyBpbiBhIGNsb3N1cmUgZm9yIG1heGltdW0gc2FmZXR5LCBhbmQgc28gaXQgYXV0b3N0YXJ0c1xuICAvLyBub3RlOiBhZnRlciBjaGVja2luZyB1c2luZyBqc3BlcmYsIHJhdGhlciB0aGFuIG1ha2luZyBvbmUgYmlnIHRvZG8gYXJyYXkgb2ZcbiAgLy8gYWxsIHRoZSBmdW5jdGlvbnMsIGl0J3MgZmFzdGVyIHRvIGNhbGwgZWFjaCBhcnJheSBvZiBmdW5jdGlvbnMgc2VwYXJhdGVseVxuICBmdW5jdGlvbiBsb29wRm4oKSB7XG5cbiAgICAvLyBjaGVjayB0aGF0IHdlJ3JlIGFjdHVhbGx5IHJ1bm5pbmcuLi5cbiAgICBpZiAocnVubmluZykge1xuXG4gICAgICB2YXIgY3VycmVudFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgIHZhciB0aW1lQ2hhbmdlID0gY3VycmVudFRpbWUgLSBsYXN0VGltZTtcbiAgICAgIHZhciBjdXJyZW50U2Nyb2xsID0gZ2V0U2Nyb2xsUG9zKCk7XG5cbiAgICAgIC8vIGNoZWNrIGlmIHJlc2l6ZVxuICAgICAgaWYgKGRvY3VtZW50LmJvZHkub2Zmc2V0V2lkdGggIT09IGxhc3RCb2R5V2lkdGggfHwgZG9jdW1lbnQuYm9keS5vZmZzZXRIZWlnaHQgIT09IGxhc3RCb2R5SGVpZ2h0KSB7XG4gICAgICAgIC8vIHJlc2l6ZSBpcyB0cnVlLCBzYXZlIG5ldyBzaXplc1xuICAgICAgICBsYXN0Qm9keVdpZHRoID0gZG9jdW1lbnQuYm9keS5vZmZzZXRXaWR0aDtcbiAgICAgICAgbGFzdEJvZHlIZWlnaHQgPSBkb2N1bWVudC5ib2R5Lm9mZnNldEhlaWdodDtcblxuICAgICAgICBpZiAocmVzaXplVGltZW91dClcbiAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHJlc2l6ZVRpbWVvdXQpO1xuICAgICAgICByZXNpemVUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGRvTG9vcEZ1bmN0aW9ucygncmVzaXplJyxjdXJyZW50VGltZSk7XG4gICAgICAgIH0sIHJlc2l6ZURlYm91bmNlKTtcbiAgICAgIH1cblxuICAgICAgLy8gY2hlY2sgaWYgc2Nyb2xsXG4gICAgICBpZiAobGFzdFNjcm9sbCAhPT0gY3VycmVudFNjcm9sbCkge1xuICAgICAgICAvLyBzY3JvbGwgaXMgdHJ1ZSwgc2F2ZSBuZXcgcG9zaXRpb25cbiAgICAgICAgbGFzdFNjcm9sbCA9IGN1cnJlbnRTY3JvbGw7XG5cbiAgICAgICAgLy8gY2FsbCBlYWNoIGZ1bmN0aW9uXG4gICAgICAgIGRvTG9vcEZ1bmN0aW9ucygnc2Nyb2xsJyxjdXJyZW50VGltZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIGRvIHRoZSBhbHdheXMgZnVuY3Rpb25zXG4gICAgICBkb0xvb3BGdW5jdGlvbnMoJ3RpY2snLGN1cnJlbnRUaW1lKTtcblxuICAgICAgLy8gc2F2ZSB0aGUgbmV3IHRpbWVcbiAgICAgIGxhc3RUaW1lID0gY3VycmVudFRpbWU7XG5cblx0XHRcdC8vIG1ha2Ugc3VyZSB3ZSBkbyB0aGUgdGljayBhZ2FpbiBuZXh0IHRpbWVcblx0ICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wRm4pO1xuICAgIH1cbiAgfTtcblxuICAvLyBleHBvcnQgdGhlIHVzZWZ1bCBmdW5jdGlvbnNcbiAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWRkU2Nyb2xsRnVuY3Rpb246IGFkZFNjcm9sbEZ1bmN0aW9uLFxuICAgIGFkZFJlc2l6ZUZ1bmN0aW9uOiBhZGRSZXNpemVGdW5jdGlvbixcbiAgICBhZGRGdW5jdGlvbjogYWRkRnVuY3Rpb24sXG4gICAgcmVtb3ZlRnVuY3Rpb246IHJlbW92ZUZ1bmN0aW9uLFxuICAgIHN0YXJ0OiBzdGFydCxcbiAgICBzdG9wOiBzdG9wLFxuICAgIGZvcmNlOiBmb3JjZVxuICB9XG5cbn0pKGRvY3VtZW50LHdpbmRvdyk7XG4iLCIvKipcbiAqICBVc2VmdWwgY2xhc3MgZm9yIGhhbmRsaW5nIHBhcmFsbGF4aW5nIHRoaW5nc1xuICogIFN0b3JlcyBvYmplY3QgbWVhc3VyZW1lbnRzIGFuZCByZXR1cm5zIHBlcmNlbnRhZ2Ugb2Ygc2Nyb2xsIHdoZW4gYXNrZWRcbiAqL1xuXG4vLyBoZWxwZXJzXG52YXIgZ2V0UGFnZU9mZnNldCA9IHJlcXVpcmUoJ2xpYi9nZXRQYWdlT2Zmc2V0JyksXG4gICAgd2luZG93U2l6ZSA9IHJlcXVpcmUoJ2xpYi9nZXRXaW5kb3dTaXplJyksXG4gICAgZ2V0U2Nyb2xsUG9zID0gcmVxdWlyZSgnbGliL2dldFNjcm9sbFBvcycpLFxuICAgIGxvb3AgPSByZXF1aXJlKCdsaWIvbG9vcCcpXG4gICAgO1xuXG5cbnZhciBQYXJhbGxheCA9IGZ1bmN0aW9uIFBhcmFsbGF4IChlbGVtZW50LCBvblNjcm9sbCkge1xuICBpZiAoIXRoaXMgaW5zdGFuY2VvZiBQYXJhbGxheClcbiAgICByZXR1cm4gbmV3IFBhcmFsbGF4KGVsZW1lbnQpO1xuXG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cbiAgLy8gZ2V0IG1lYXN1cmVtZW50cyBpbW1lZGlhdGVseVxuICB0aGlzLm1lYXN1cmUoKTtcbiAgaWYgKG9uU2Nyb2xsKVxuICAgIG9uU2Nyb2xsKF90aGlzLmdldFBlcmNlbnRhZ2UoKSk7XG5cbiAgLy8gbGlzdGVuZXJzXG4gIHRoaXMub25SZXNpemUgPSBmdW5jdGlvbiBtZWFzdXJlUGFyYWxsYXggKCkge1xuICAgIF90aGlzLm1lYXN1cmUoKTtcbiAgfVxuICBpZiAob25TY3JvbGwpIHtcbiAgICB0aGlzLm9uU2Nyb2xsID0gZnVuY3Rpb24gc2Nyb2xsUGFyYWxsYXggKCkge1xuICAgICAgb25TY3JvbGwoX3RoaXMuZ2V0UGVyY2VudGFnZSgpKTtcbiAgICB9XG4gIH1cblxuICAvLyBzdGFydCAnZXIgdXBcbiAgdGhpcy5pbml0KCk7XG59XG5QYXJhbGxheC5wcm90b3R5cGUgPSB7XG4gIG1lYXN1cmU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcG8gPSBnZXRQYWdlT2Zmc2V0KHRoaXMuZWxlbWVudCk7XG4gICAgdGhpcy50b3AgPSBwby50b3AgLSB3aW5kb3dTaXplLmhlaWdodCgpO1xuICAgIHRoaXMuYm90dG9tID0gcG8udG9wICsgdGhpcy5lbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgICB0aGlzLmhlaWdodCA9IHRoaXMuYm90dG9tIC0gdGhpcy50b3A7XG4gIH0sXG4gIGdldFBlcmNlbnRhZ2U6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2Nyb2xsWSA9IGdldFNjcm9sbFBvcygpO1xuICAgIHZhciBwZXJjID0gKHNjcm9sbFkgLSB0aGlzLnRvcCkgLyAodGhpcy5oZWlnaHQpO1xuICAgIHJldHVybiBwZXJjO1xuICB9LFxuICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgbG9vcC5hZGRSZXNpemVGdW5jdGlvbih0aGlzLm9uUmVzaXplKTtcbiAgICBpZiAodGhpcy5vblNjcm9sbClcbiAgICAgIGxvb3AuYWRkU2Nyb2xsRnVuY3Rpb24odGhpcy5vblNjcm9sbCk7XG4gIH0sXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcbiAgICBsb29wLnJlbW92ZUZ1bmN0aW9uKHRoaXMub25SZXNpemUpO1xuICAgIGlmICh0aGlzLm9uU2Nyb2xsKVxuICAgICAgbG9vcC5yZW1vdmVGdW5jdGlvbih0aGlzLm9uU2Nyb2xsKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhcmFsbGF4O1xuIiwiLyoqXG4gKiAgU2V0cyBUcmFuc2Zvcm0gc3R5bGVzIGNyb3NzIGJyb3dzZXJcbiAqICBAcGFyYW0ge0hUTUxFbGVtZW50fVxuICogIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBvZiB0aGUgdHJhbnNmb3JtIHN0eWxlXG4gKi9cblxudmFyIHRyYW5zZm9ybUF0dHJpYnV0ZXMgPSBbJ3RyYW5zZm9ybScsJ3dlYmtpdFRyYW5zZm9ybScsJ21velRyYW5zZm9ybScsJ21zVHJhbnNmb3JtJ107XG52YXIgc2V0VHJhbnNmb3JtID0gZnVuY3Rpb24gKGVsZW1lbnQsIHRyYW5zZm9ybVN0cmluZykge1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gdHJhbnNmb3JtQXR0cmlidXRlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGVsZW1lbnQuc3R5bGVbdHJhbnNmb3JtQXR0cmlidXRlc1tpXV0gPSB0cmFuc2Zvcm1TdHJpbmc7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXRUcmFuc2Zvcm07XG4iLCIvKipcclxuICogIEZ1bGwgQXJ0aWNsZSBjb250cm9sbGVyXHJcbiAqL1xyXG5cclxuLy8gcmVxdWlyZW1lbnRzXHJcbnZhciBIYWxmdG9uZSA9IHJlcXVpcmUoJ29iamVjdHMvaGFsZnRvbmUnKTtcclxuXHJcbi8vIHNldHRpbmdzXHJcbnZhciBIRUFERVJfSEFMRlRPTkVfU0VUVElOR1MgPSB7XHJcbiAgZmFkZTogMTJcclxufVxyXG52YXIgSU5ORVJfSEFMRlRPTkVfU0VUVElOR1MgPSB7XHJcbiAgZmFkZTogMCxcclxuICBpbWFnZVNpemluZzogJ2NvbnRhaW4nLFxyXG4gIGluRWFzZVN0YXJ0OiAuMSwgLy8gc2Nyb2xsIHBlcmNlbnRhZ2UgdG8gc3RhcnQgYW5pbWF0aW9uIGluIG9uIGZpcnN0IGRvdFxyXG4gIGluRWFzZUVuZDogLjUsIC8vIHNjcm9sbCBwZXJjZW50YWdlIHRvIGVuZCBhbmltYXRpb24gaW4gb24gbGFzdCBkb3RcclxuICBjb3JuZXJpbmc6IDRcclxufVxyXG5cclxuLyoqXHJcbiAqICBBcnRpY2xlIGNsYXNzXHJcbiAqICBAcGFyYW0ge0hUTUxFbGVtZW50fSB0aGUgd2hvbGUgZGFtbiBhcnRpY2xlXHJcbiAqL1xyXG52YXIgQXJ0aWNsZSA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XHJcbiAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuXHJcbiAgLy8gaW5pdCBoZWFkZXJcclxuICB2YXIgaGVhZGVyRWwgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hcnRpY2xlX19oZWFkZXInKTtcclxuICBpZiAoaGVhZGVyRWwpIHtcclxuICAgIHRoaXMuaGVhZGVyID0gbmV3IEhhbGZ0b25lKGhlYWRlckVsLCBIRUFERVJfSEFMRlRPTkVfU0VUVElOR1MpO1xyXG4gIH1cclxuXHJcbiAgLy8gaW5pdCBvdGhlciBoYWxmdG9uZXNcclxuICB2YXIgaGFsZnRvbmVFbHMgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5oYWxmdG9uZScpO1xyXG4gIHRoaXMuaGFsZnRvbmVzID0gW107XHJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGhhbGZ0b25lRWxzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICB0aGlzLmhhbGZ0b25lcy5wdXNoKG5ldyBIYWxmdG9uZShoYWxmdG9uZUVsc1tpXSwgSU5ORVJfSEFMRlRPTkVfU0VUVElOR1MpKTtcclxuICB9XHJcbn1cclxuXHJcbi8vIHRlbXAgaW5pdCBhcnRpY2xlXHJcbndpbmRvdy5hcnRpY2xlID0gbmV3IEFydGljbGUoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFydGljbGUnKSk7XHJcbiIsIi8qKlxyXG4gKiAgQ29udHJvbHMgY29vbCBoYWxmdG9uZSB0aGluZ2llc1xyXG4gKi9cclxuXHJcbi8vIHJlcXVpcmVtZW50c1xyXG52YXIgZWFzZXMgPSByZXF1aXJlKCdsaWIvZWFzZScpO1xyXG52YXIgU2Nyb2xsQ29udHJvbGxlciA9IHJlcXVpcmUoJ2xpYi9zY3JvbGxDb250cm9sbGVyJyk7XHJcbnZhciBzZXRUcmFuc2Zvcm0gPSByZXF1aXJlKCdsaWIvc2V0VHJhbnNmb3JtJyk7XHJcbnZhciB3aW5kb3dTaXplID0gcmVxdWlyZSgnbGliL2dldFdpbmRvd1NpemUnKTtcclxudmFyIGdldEJyZWFrcG9pbnQgPSByZXF1aXJlKCdsaWIvYnJlYWtwb2ludHMnKTtcclxudmFyIGxvb3AgPSByZXF1aXJlKCdsaWIvbG9vcCcpO1xyXG5cclxuLy8gc2V0dGluZ3NcclxudmFyIERFRkFVTFRTID0ge1xyXG4gIGZhZGU6IDQsIC8vIHJvd3MgdG8gZmFkZSB0b3AgYW5kIGJvdHRvbSwgaWYgMCB0aGUgY2FudmFzIGlzIHNpemVkIHRvIGJlIGNvbnRhaW5lZCBpbnN0ZWFkIG9mIG92ZXJmbG93IG9uIHRoZSBzaWRlc1xyXG4gIG1heFJhZGl1czogMTUsIC8vIG1heGltdW0gcmFkaXVzIGZvciBhIGRvdFxyXG4gIGluRWFzZUZuOiBlYXNlcy5lYXNlT3V0LFxyXG4gIGluRWFzZVN0YXJ0OiAuMiwgLy8gc2Nyb2xsIHBlcmNlbnRhZ2UgdG8gc3RhcnQgYW5pbWF0aW9uIGluIG9uIGZpcnN0IGRvdFxyXG4gIGluRWFzZUVuZDogLjgsIC8vIHNjcm9sbCBwZXJjZW50YWdlIHRvIGVuZCBhbmltYXRpb24gaW4gb24gbGFzdCBkb3RcclxuICBvdXRFYXNlRm46IGVhc2VzLmxpbmVhcixcclxuICBvdXRFYXNlU3RhcnQ6IC42LCAvLyBzY3JvbGwgcGVyY2VudGFnZSB0byBzdGFydCBhbmltYXRpb24gb3V0IG9uIGZpcnN0IGRvdFxyXG4gIG91dEVhc2VFbmQ6IDEuNCwgLy8gc2Nyb2xsIHBlcmNlbnRhZ2UgdG8gZW5kIGFuaW1hdGlvbiBvdXQgb24gbGFzdCBkb3RcclxuICBmaXhlZDogZmFsc2UsIC8vIGZpeGVkIHBvc2l0aW9uIGFuZCBmdWxsIHNjcmVlbj9cclxuICBpbWFnZVNpemluZzogJ2NvdmVyJywgLy8gJ2NvdmVyJyBvciAnY29udGFpbidcclxuICBjb3JuZXJpbmc6IDAgLy8gZGlhZ25hbCB0b3AgbGVmdCBmYWRlXHJcbn1cclxuXHJcbi8qKlxyXG4gKiAgRG90IGNsYXNzXHJcbiAqICBAcGFyYW0ge2ludH0gZ3JpZCBwb3NpdGlvbiBYXHJcbiAqICBAcGFyYW0ge2ludH0gZ3JpZCBwb3NpdGlvbiBZXHJcbiAqICBAcGFyYW0ge051bWJlcn0gbWF4IHJhZGl1c1xyXG4gKiAgQHBhcmFtIHtIYWxmdG9uZX0gcGFyZW50IGhhbGZ0b25lIG9iamVjdFxyXG4gKlxyXG4gKiAgQG1ldGhvZCBkcmF3ICh7Y2FudmFzIGNvbnRleHR9KVxyXG4gKiAgQG1ldGhvZCBzZXRSYWRpdXNCeVBlcmNlbnRhZ2UgKHtwZXJjZW50IG9mIG1heCByYWRpdXN9KVxyXG4gKi9cclxudmFyIERvdCA9IGZ1bmN0aW9uIChncmlkWCwgZ3JpZFksIG1heFJhZGl1cywgcGFyZW50KSB7XHJcbiAgdGhpcy5ncmlkWCA9IGdyaWRYO1xyXG4gIHRoaXMuZ3JpZFkgPSBncmlkWTtcclxuICB0aGlzLm1heFJhZGl1cyA9IG1heFJhZGl1cztcclxuICB0aGlzLnJhZGl1cyA9IG1heFJhZGl1cztcclxuICB0aGlzLnBhcmVudCA9IHBhcmVudDtcclxuICB0aGlzLnBlcmNlbnRhZ2UgPSAodGhpcy5ncmlkWCArIHRoaXMuZ3JpZFkpIC8gKHRoaXMucGFyZW50LmNvbHVtbnMgKyB0aGlzLnBhcmVudC5yb3dzKTtcclxuXHJcbiAgLy8gZGVmaW5lIGxvY2F0aW9uIHdpdGhpbiBjYW52YXMgY29udGV4dFxyXG4gIHRoaXMueCA9IHRoaXMuZ3JpZFggKiB0aGlzLnBhcmVudC5zZXR0aW5ncy5tYXhSYWRpdXM7XHJcbiAgdGhpcy55ID0gdGhpcy5ncmlkWSAqIHRoaXMucGFyZW50LnNldHRpbmdzLm1heFJhZGl1cztcclxuICBpZiAodGhpcy5wYXJlbnQuc2V0dGluZ3MuZmFkZSlcclxuICAgIHRoaXMueSArPSB0aGlzLnBhcmVudC5zZXR0aW5ncy5tYXhSYWRpdXM7XHJcblxyXG4gIC8vIGhhbmRsZSBjb3JuZXJpbmdcclxuICBpZiAodGhpcy5wYXJlbnQuc2V0dGluZ3MuY29ybmVyaW5nICYmIHRoaXMuZ3JpZFggKyB0aGlzLmdyaWRZIDw9IHRoaXMucGFyZW50LnNldHRpbmdzLmNvcm5lcmluZyArIDEpIHtcclxuICAgIHRoaXMubWF4UmFkaXVzID0gZWFzZXMubGluZWFyKC4zMywuNjYsKHRoaXMuZ3JpZFggKyB0aGlzLmdyaWRZKSAvICh0aGlzLnBhcmVudC5zZXR0aW5ncy5jb3JuZXJpbmcgKyAxKSkgKiB0aGlzLm1heFJhZGl1cztcclxuICAgIHRoaXMucmFkaXVzID0gdGhpcy5tYXhSYWRpdXM7XHJcbiAgfVxyXG4gIGVsc2UgaWYgKHRoaXMucGFyZW50LnNldHRpbmdzLmNvcm5lcmluZyAmJiAtMSAqICgodGhpcy5ncmlkWCArIHRoaXMuZ3JpZFkpIC0gKHRoaXMucGFyZW50LmNvbHVtbnMgKyB0aGlzLnBhcmVudC5yb3dzIC0gMikpIDw9IHRoaXMucGFyZW50LnNldHRpbmdzLmNvcm5lcmluZyArIDEpIHtcclxuICAgIHRoaXMubWF4UmFkaXVzID0gZWFzZXMubGluZWFyKC4zMywuNjYsLTEgKiAoKHRoaXMuZ3JpZFggKyB0aGlzLmdyaWRZKSAtICh0aGlzLnBhcmVudC5jb2x1bW5zICsgdGhpcy5wYXJlbnQucm93cyAtIDIpKSAvICh0aGlzLnBhcmVudC5zZXR0aW5ncy5jb3JuZXJpbmcgKyAxKSkgKiB0aGlzLm1heFJhZGl1cztcclxuICAgIHRoaXMucmFkaXVzID0gdGhpcy5tYXhSYWRpdXM7XHJcbiAgfVxyXG59XHJcbkRvdC5wcm90b3R5cGUgPSB7XHJcbiAgZHJhdzogZnVuY3Rpb24gKGN0eCkge1xyXG4gICAgY3R4Lm1vdmVUbyh0aGlzLngsIHRoaXMueSAtIHRoaXMucmFkaXVzKTtcclxuICAgIGN0eC5hcmModGhpcy54LCB0aGlzLnksIHRoaXMucmFkaXVzLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xyXG4gIH0sXHJcbiAgc2V0UmFkaXVzQnlQZXJjZW50YWdlOiBmdW5jdGlvbiAocGVyY2VudCkge1xyXG4gICAgdGhpcy5yYWRpdXMgPSBNYXRoLm1heCgwLCBNYXRoLm1pbih0aGlzLm1heFJhZGl1cywgcGVyY2VudCAqIHRoaXMubWF4UmFkaXVzKSk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogIEhhbGZ0b25lIGNsYXNzXHJcbiAqICBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50LCBvcHRpb25hbGx5IHdpdGggYSBiYWNrZ3JvdW5kIGltYWdlLCB0byB0dXJuIGludG8gdGhlIHRveVxyXG4gKiAgQHBhcmFtIHtvYmplY3R9IHNldHRpbmdzIHRoYXQgY2FuIG92ZXJyaWRlIERFRkFVTFRTIGRlZmluZWQgYWJvdmVcclxuICpcclxuICogIEBtZXRob2QgZHJhdyh7cGVyY2VudGFnZSBvZiBhbmltYXRpb24gcHJvZ3Jlc3N9KVxyXG4gKiAgQG1ldGhvZCBjcmVhdGVDYW52YXMoKVxyXG4gKiAgQG1ldGhvZCBnZXRQZXJjZW50YWdlRnJvbVNjcm9sbCgpIC0gcmV0dXJucyBhIHBlcmNlbnRhZ2Ugb2YgcHJvZ3Jlc3MgcGFzdCBlbGVtZW50IGJhc2VkIG9uIHNjcm9sbGluZ1xyXG4gKiAgQG1ldGhvZCBpbml0KClcclxuICovXHJcbnZhciBIYWxmdG9uZSA9IGZ1bmN0aW9uIChlbGVtZW50LCBzZXR0aW5ncykge1xyXG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgdGhpcy5zZXR0aW5ncyA9IHt9O1xyXG4gIHNldHRpbmdzID0gc2V0dGluZ3MgfHwge307XHJcbiAgZm9yICh2YXIgcHJvcCBpbiBERUZBVUxUUykge1xyXG4gICAgdGhpcy5zZXR0aW5nc1twcm9wXSA9IHNldHRpbmdzW3Byb3BdICE9PSB1bmRlZmluZWQgPyBzZXR0aW5nc1twcm9wXSA6IERFRkFVTFRTW3Byb3BdO1xyXG4gIH1cclxuXHJcbiAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHRoaXMuZWxlbWVudCk7XHJcbiAgLy8gbWFrZSBzdXJlIHBvc2l0aW9uaW5nIGlzIHZhbGlkXHJcbiAgaWYgKGNvbXB1dGVkU3R5bGUucG9zaXRpb24gPT09ICdzdGF0aWMnKSB7XHJcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xyXG4gIH1cclxuICAvLyBzZXQgdXAgY29sb3IgYW5kIGltYWdlXHJcbiAgdGhpcy5maWxsID0gY29tcHV0ZWRTdHlsZS5iYWNrZ3JvdW5kQ29sb3I7XHJcbiAgaWYgKCEhY29tcHV0ZWRTdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgJiYgY29tcHV0ZWRTdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgIT09ICdub25lJykge1xyXG4gICAgdGhpcy5pbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgdGhpcy5pbWFnZS5zcmMgPSBjb21wdXRlZFN0eWxlLmJhY2tncm91bmRJbWFnZS5tYXRjaCgvXFwoKD86J3xcIik/KC4rPykoPzonfFwiKT9cXCkvKVsxXTtcclxuICAgIGNvbnNvbGUubG9nKHRoaXMuaW1hZ2UpO1xyXG4gIH1cclxuICB0aGlzLmVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZCA9ICdub25lJztcclxuXHJcbiAgLy8gbGlzdGVuZXJzXHJcbiAgdmFyIF90aGlzID0gdGhpcztcclxuICB0aGlzLm9uUmVzaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgX3RoaXMuY3JlYXRlQ2FudmFzKCk7XHJcbiAgfVxyXG4gIHRoaXMub25TY3JvbGwgPSBmdW5jdGlvbiAocGVyY2VudGFnZSkge1xyXG4gICAgX3RoaXMuZHJhdyhwZXJjZW50YWdlKTtcclxuICB9XHJcblxyXG4gIC8vIGF1dG9zdGFydFxyXG4gIHRoaXMuaW5pdCgpO1xyXG59XHJcbkhhbGZ0b25lLnByb3RvdHlwZSA9IHtcclxuICBkcmF3OiBmdW5jdGlvbiAocGVyY2VudGFnZSkge1xyXG4gICAgaWYgKCF0aGlzLmNhbnZhcykge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY2xlYXIgY3VycmVudCBjcmFwXHJcbiAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwwLHRoaXMuY2FudmFzLndpZHRoLHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICB0aGlzLmN0eC5zYXZlKCk7XHJcbiAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgIC8vIGhhbmRsZSBhbmltYXRpb25cclxuICAgIC8vIGluIHZhcnNcclxuICAgIHZhciBlZmZlY3RpdmVJblBlcmMgPSAocGVyY2VudGFnZSAtIHRoaXMuc2V0dGluZ3MuaW5FYXNlU3RhcnQpIC8gKHRoaXMuc2V0dGluZ3MuaW5FYXNlRW5kIC0gdGhpcy5zZXR0aW5ncy5pbkVhc2VTdGFydCk7XHJcbiAgICBlZmZlY3RpdmVJblBlcmMgPSBlZmZlY3RpdmVJblBlcmMgPCAxID8gdGhpcy5zZXR0aW5ncy5pbkVhc2VGbigtMSwzLGVmZmVjdGl2ZUluUGVyYykgOiAyO1xyXG4gICAgLy8gb3V0IHZhcnNcclxuICAgIHZhciBlZmZlY3RpdmVPdXRQZXJjID0gKHBlcmNlbnRhZ2UgLSB0aGlzLnNldHRpbmdzLm91dEVhc2VTdGFydCkgLyAodGhpcy5zZXR0aW5ncy5vdXRFYXNlRW5kIC0gdGhpcy5zZXR0aW5ncy5vdXRFYXNlU3RhcnQpO1xyXG4gICAgZWZmZWN0aXZlT3V0UGVyYyA9IGVmZmVjdGl2ZU91dFBlcmMgPiAwID8gdGhpcy5zZXR0aW5ncy5vdXRFYXNlRm4oMiwtMyxlZmZlY3RpdmVPdXRQZXJjKSA6IDI7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuZG90cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICB2YXIgZG90SW5QZXJjID0gZWZmZWN0aXZlSW5QZXJjIC0gdGhpcy5kb3RzW2ldLnBlcmNlbnRhZ2U7XHJcbiAgICAgIHZhciBkb3RPdXRQZXJjID0gZWZmZWN0aXZlT3V0UGVyYyAtICgxIC0gdGhpcy5kb3RzW2ldLnBlcmNlbnRhZ2UpO1xyXG4gICAgICB0aGlzLmRvdHNbaV0uc2V0UmFkaXVzQnlQZXJjZW50YWdlKE1hdGgubWluKGRvdEluUGVyYyxkb3RPdXRQZXJjKSk7XHJcbiAgICAgIHRoaXMuZG90c1tpXS5kcmF3KHRoaXMuY3R4KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmN0eC5maWxsKCk7XHJcblxyXG4gICAgaWYgKHRoaXMuaW1hZ2UgJiYgdGhpcy5pbWFnZU9mZnNldHMpIHtcclxuICAgICAgY29uc29sZS5sb2coJ3RyeSBkcmF3IGltYWdlJyk7XHJcbiAgICAgIHRoaXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwic291cmNlLWF0b3BcIjtcclxuICAgICAgdGhpcy5jdHguZHJhd0ltYWdlKHRoaXMuaW1hZ2UsIHRoaXMuaW1hZ2VPZmZzZXRzLngsIHRoaXMuaW1hZ2VPZmZzZXRzLnksIHRoaXMuaW1hZ2VPZmZzZXRzLndpZHRoLCB0aGlzLmltYWdlT2Zmc2V0cy5oZWlnaHQpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5jdHgucmVzdG9yZSgpO1xyXG4gIH0sXHJcbiAgY3JlYXRlQ2FudmFzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBraWxsIGV4aXN0aW5nIGNhbnZhc1xyXG4gICAgaWYgKHRoaXMuY2FudmFzKSB7XHJcbiAgICAgIHRoaXMuY2FudmFzLnJlbW92ZSgpO1xyXG4gICAgfVxyXG4gICAgLy8gY3JlYXRlIG5ldyBjYW52YXMgYW5kIGRvdHNcclxuICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICB0aGlzLmNhbnZhcy5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywnY2FudmFzLWhhbGZ0b25lJyk7XHJcbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZml4ZWQgfHwgZ2V0QnJlYWtwb2ludCgpIDwgMykge1xyXG4gICAgICAvLyBub3JtYWwgc2l6aW5nIGFuZCBwb3NpdGlvbmluZ1xyXG4gICAgICB2YXIgY29sdW1ucyA9IE1hdGguZmxvb3IodGhpcy5lbGVtZW50Lm9mZnNldFdpZHRoIC8gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMpO1xyXG4gICAgICB2YXIgcm93cyA9IE1hdGguZmxvb3IodGhpcy5lbGVtZW50Lm9mZnNldEhlaWdodCAvIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzKTtcclxuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuZmFkZSkge1xyXG4gICAgICAgIGNvbHVtbnMgKz0gMjtcclxuICAgICAgICByb3dzICs9IHRoaXMuc2V0dGluZ3MuZmFkZSAqIDIgKyAyO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGlmIChjb2x1bW5zICUgMiA9PT0gMClcclxuICAgICAgICAgIGNvbHVtbnMgKz0gMTtcclxuICAgICAgICBpZiAocm93cyAlIDIgPT09IDApXHJcbiAgICAgICAgICByb3dzICs9IDE7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBmaXhlZCBzaXppbmcgYW5kIHBvc2l0aW9uaW5nXHJcbiAgICAgIHZhciBjb2x1bW5zID0gTWF0aC5mbG9vcih3aW5kb3dTaXplLndpZHRoKCkgLyB0aGlzLnNldHRpbmdzLm1heFJhZGl1cykgKyAyO1xyXG4gICAgICB2YXIgcm93cyA9IE1hdGguZmxvb3Iod2luZG93U2l6ZS5oZWlnaHQoKSAvIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzKSArIHRoaXMuc2V0dGluZ3MuZmFkZSAqIDIgKyAyO1xyXG4gICAgICBzZXRUcmFuc2Zvcm0odGhpcy5lbGVtZW50LCdub25lJyk7XHJcbiAgICAgIHNldFRyYW5zZm9ybSh0aGlzLmNhbnZhcywnbm9uZScpO1xyXG4gICAgICB0aGlzLmNhbnZhcy5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XHJcbiAgICAgIHRoaXMuY2FudmFzLnN0eWxlLnRvcCA9IHRoaXMuc2V0dGluZ3MuZmFkZSAqIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzICogLTEgKyAncHgnO1xyXG4gICAgICB0aGlzLmNhbnZhcy5zdHlsZS5sZWZ0ID0gMDtcclxuICAgIH1cclxuICAgIHRoaXMuY2FudmFzLndpZHRoID0gKGNvbHVtbnMgLSAxKSAqIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzO1xyXG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gKHRoaXMuc2V0dGluZ3MuZmFkZSA/IHJvd3MgKyAxIDogcm93cyAtIDEpICogdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXM7XHJcbiAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLmZpbGw7XHJcbiAgICB0aGlzLmNvbHVtbnMgPSBjb2x1bW5zO1xyXG4gICAgdGhpcy5yb3dzID0gcm93cztcclxuXHJcbiAgICAvLyBkZWZpbmUgdGhlIGRvdHNcclxuICAgIHRoaXMuZG90cyA9IFtdO1xyXG4gICAgZm9yICh2YXIgeSA9IDA7IHkgPCByb3dzOyB5KyspIHtcclxuICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCBjb2x1bW5zOyB4Kz0gMikge1xyXG4gICAgICAgIHZhciByYWQ7XHJcbiAgICAgICAgaWYgKHkgPCB0aGlzLnNldHRpbmdzLmZhZGUpIHtcclxuICAgICAgICAgIHJhZCA9ICh5ICsgMSkgLyAodGhpcy5zZXR0aW5ncy5mYWRlICsgMSkgKiB0aGlzLnNldHRpbmdzLm1heFJhZGl1cztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoeSA+PSByb3dzIC0gdGhpcy5zZXR0aW5ncy5mYWRlKSB7XHJcbiAgICAgICAgICByYWQgPSAtMSAqICh5ICsgMSAtIHJvd3MpIC8gKHRoaXMuc2V0dGluZ3MuZmFkZSArIDEpICogdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCF0aGlzLnNldHRpbmdzLmZhZGUgJiYgeSA9PT0gMCAmJiB4ID09PSAwICYmICF0aGlzLnNldHRpbmdzLmZpeGVkKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMuc2V0dGluZ3MuZmFkZSAmJiB5ID09PSAwICYmIHggPT09IGNvbHVtbnMgLSAxICYmICF0aGlzLnNldHRpbmdzLmZpeGVkKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMuc2V0dGluZ3MuZmFkZSAmJiB5ID09PSByb3dzIC0gMSAmJiB4ID09PSAwICYmICF0aGlzLnNldHRpbmdzLmZpeGVkKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMuc2V0dGluZ3MuZmFkZSAmJiB5ID09PSByb3dzIC0gMSAmJiB4ID09PSBjb2x1bW5zIC0gMSAmJiAhdGhpcy5zZXR0aW5ncy5maXhlZCkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgcmFkID0gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZG90cy5wdXNoKG5ldyBEb3QoeSAlIDIgPyB4ICsgMSA6IHgsIHksIHJhZCwgdGhpcykpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuY2FudmFzKTtcclxuXHJcbiAgICAvLyBkZXRlcm1pbmUgaW1hZ2Ugc2l6ZVxyXG4gICAgaWYgKHRoaXMuaW1hZ2UpIHtcclxuICAgICAgaWYgKHRoaXMuaW1hZ2UuY29tcGxldGUpIHtcclxuICAgICAgICB0aGlzLnNpemVJbWFnZSgpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5pbWFnZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBfdGhpcy5zaXplSW1hZ2UoKTtcclxuICAgICAgICAgIF90aGlzLmRyYXcoZ2V0QnJlYWtwb2ludCgpID49IDMgPyBfdGhpcy5zY3JvbGxDb250cm9sbGVyLmdldFBlcmNlbnRhZ2UoKSA6IC40NSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZXN0YWJsaXNoIHNjcm9sbCBiYXNlZCBjb250cm9scyBvbmx5IGlmIHNjcmVlbiBpcyBsYXJnZSBlbm91Z2ggZm9yIHVzIHRvIGNhcmVcclxuICAgIGlmIChnZXRCcmVha3BvaW50KCkgPj0gMykge1xyXG4gICAgICB0aGlzLnNjcm9sbENvbnRyb2xsZXIgPSBuZXcgU2Nyb2xsQ29udHJvbGxlcih0aGlzLmVsZW1lbnQsIHRoaXMub25TY3JvbGwpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMuZHJhdyguNDUpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgc2l6ZUltYWdlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2NhbGUgPSB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMuaW1hZ2Uud2lkdGg7XHJcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5pbWFnZVNpemluZyA9PT0gJ2NvdmVyJyAmJiBzY2FsZSAqIHRoaXMuaW1hZ2UuaGVpZ2h0IDwgdGhpcy5jYW52YXMuaGVpZ2h0KSB7XHJcbiAgICAgIHNjYWxlID0gdGhpcy5jYW52YXMuaGVpZ2h0IC8gdGhpcy5pbWFnZS5oZWlnaHQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0aGlzLnNldHRpbmdzLmltYWdlU2l6aW5nID09PSAnY29udGFpbicgJiYgc2NhbGUgKiB0aGlzLmltYWdlLmhlaWdodCA+IHRoaXMuY2FudmFzLmhlaWdodCkge1xyXG4gICAgICBzY2FsZSA9IHRoaXMuY2FudmFzLmhlaWdodCAvIHRoaXMuaW1hZ2UuaGVpZ2h0O1xyXG4gICAgfVxyXG4gICAgLy90aGlzLmltYWdlU2NhbGUgPSBzY2FsZTtcclxuICAgIHRoaXMuaW1hZ2VPZmZzZXRzID0ge1xyXG4gICAgICB4OiAodGhpcy5jYW52YXMud2lkdGggLSB0aGlzLmltYWdlLndpZHRoICogc2NhbGUpIC8gMixcclxuICAgICAgeTogKHRoaXMuY2FudmFzLmhlaWdodCAtIHRoaXMuaW1hZ2UuaGVpZ2h0ICogc2NhbGUpIC8gMixcclxuICAgICAgd2lkdGg6IHRoaXMuaW1hZ2Uud2lkdGggKiBzY2FsZSxcclxuICAgICAgaGVpZ2h0OiB0aGlzLmltYWdlLmhlaWdodCAqIHNjYWxlXHJcbiAgICB9XHJcbiAgfSxcclxuICBnZXRQZXJjZW50YWdlRnJvbVNjcm9sbDogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2Nyb2xsQ29udHJvbGxlci5nZXRQZXJjZW50YWdlKCk7XHJcbiAgfSxcclxuICBpbml0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBtYWtlIHRoZSBjYW52YXNcclxuICAgIHRoaXMuY3JlYXRlQ2FudmFzKCk7XHJcblxyXG4gICAgLy8gc2Nyb2xsIGxpc3RlbmVyIGFkZGVkIGluIGNyZWF0ZUNhbnZhcyBmblxyXG5cclxuICAgIC8vIGxpc3RlbiBmb3IgcmVzaXplXHJcbiAgICBsb29wLmFkZFJlc2l6ZUZ1bmN0aW9uKHRoaXMub25SZXNpemUpO1xyXG4gIH0sXHJcbiAgZGVzdHJveTogZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMuc2Nyb2xsQ29udHJvbGxlcilcclxuICAgICAgdGhpcy5zY3JvbGxDb250cm9sbGVyLmRlc3Ryb3koKTtcclxuICAgIGxvb3AucmVtb3ZlRnVuY3Rpb24odGhpcy5vblJlc2l6ZSk7XHJcbiAgICB0aGlzLmNhbnZhcy5yZW1vdmUoKTtcclxuICAgIGRlbGV0ZSB0aGlzO1xyXG4gIH1cclxufVxyXG5cclxuLy8gdGVtcCBhdXRvIGluaXRcclxuLy8gdmFyIGh0ckVscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5oYWxmdG9uZScpO1xyXG4vLyB2YXIgaHRycyA9IFtdO1xyXG4vLyBmb3IgKHZhciBpID0gMCwgbGVuID0gaHRyRWxzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbi8vICAgaHRycy5wdXNoKG5ldyBIYWxmdG9uZShodHJFbHNbaV0sIHsgZmFkZTogMTIsIGZpeGVkOiBmYWxzZSB9KSk7XHJcbi8vIH1cclxuLy8gd2luZG93Lmh0cnMgPSBodHJzO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEhhbGZ0b25lO1xyXG4iLCIvKipcbiAqICBzY3JpcHRzLmpzXG4gKiAgVGhpcyBzaG91bGQgaW5jbHVkZSBvYmplY3RzLCB3aGljaCBpbiB0dXJuIGluY2x1ZGUgdGhlIGxpYiBmaWxlcyB0aGV5IG5lZWQuXG4gKiAgVGhpcyBrZWVwcyB1cyB1c2luZyBhIG1vZHVsYXIgYXBwcm9hY2ggdG8gZGV2IHdoaWxlIGFsc28gb25seSBpbmNsdWRpbmcgdGhlXG4gKiAgcGFydHMgb2YgdGhlIGxpYnJhcnkgd2UgbmVlZC5cbiAqL1xuLy8gb2JqZWN0c1xucmVxdWlyZSgnb2JqZWN0cy9hcnRpY2xlJyk7XG4iXX0=
