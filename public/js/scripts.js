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
      onScroll.apply(_this, [_this.getPercentage()]);
    }
  }

  // start 'er up
  this.enable();
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
  disable: function () {
    loop.removeFunction(this.onResize);
    if (this.onScroll)
      loop.removeFunction(this.onScroll);
  },
  enable: function () {
    loop.addResizeFunction(this.onResize);
    if (this.onScroll)
      loop.addScrollFunction(this.onScroll);
  },
  destroy: function () {
    this.disable();
    delete this;
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
var ScrollController = require('lib/scrollController');
var getScrollPos = require('lib/getScrollPos');
var eases = require('lib/ease');

// settings
var HEADER_HALFTONE_SETTINGS = {
  fade: 12,
  maxRadius: 16
}
var INNER_HALFTONE_SETTINGS = {
  fade: 0,
  imageSizing: 'contain',
  inEaseStart: .1, // scroll percentage to start animation in on first dot
  inEaseEnd: .5, // scroll percentage to end animation in on last dot
  outEaseStart: .75,
  cornering: 8
}
var RELATED_HALFTONE_SETTINGS = {
  fade: 0,
  inEaseStart: -.4,
  inEaseEnd: .8,
  inEaseFn: eases.linear,
  outEaseStart: .6,
  outEaseEnd: 1.2
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
    this.header.animIn(1200);
  }

  // init other halftones
  var halftoneEls = element.querySelectorAll('.halftone');
  this.halftones = [];
  for (var i = 0, len = halftoneEls.length; i < len; i++) {
    var ht = new Halftone(halftoneEls[i], INNER_HALFTONE_SETTINGS);
    //ht.animIn(1200);
    this.halftones.push(ht);
  }

  var relatedsEl = element.querySelector('.relateds');
  if (relatedsEl) {
    this.halftones.push(new Halftone(relatedsEl, RELATED_HALFTONE_SETTINGS));
  }

  // buttons
  // var buttonEls = element.querySelectorAll('.button');
  // this.buttons = [];
  // for (var i = 0, len = buttonEls.length; i < len; i++) {
  //   var ht = new Halftone(buttonEls[i], {
  //     fade: 1,
  //     inEaseStart: 0,
  //     inEaseEnd: 1,
  //     outEaseStart: 1.1,
  //     outEaseEnd: 1.1,
  //     control: 'none',
  //     fill: '#046c6f'
  //   });
  //   buttonEls[i].addEventListener('mouseover',function () {
  //     ht.anim(.5,1,3000);
  //   }, false);
  //   buttonEls[i].addEventListener('mouseout',function () {
  //     ht.anim(1,.5,3000);
  //   }, false);
  //   this.halftones.push(ht);
  // }

  // listen for when to destroy
  var _this = this;
  var onScroll = function (scrollPercentage) {
    if (getScrollPos() > this.bottom + 300)
      _this.destroy(true);
  }
  this.scrollController = new ScrollController(this.element);
}
Article.prototype = {
  destroy: function (isPast) {
    var newScrollPos = getScrollPos() - this.element.offsetHeight;
    if (this.header)
      this.header.destroy();
    for (var i = 0, len = this.halftones.length; i < len; i++)
      this.halftones[i].destroy();

    this.scrollController.destroy();

    // fix scroll position
    if (isPast) {
      var retried = false;
      function fixScroll () {
        window.scrollTo(0,newScrollPos);
      }
      fixScroll();
      requestAnimationFrame(fixScroll);
    }
    this.element.remove();
    //delete this;
  }
}

// temp init article
window.article = new Article(document.querySelector('.article'));

},{"lib/ease":2,"lib/getScrollPos":4,"lib/scrollController":7,"objects/halftone":10}],10:[function(require,module,exports){
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
  maxRadius: 10, // maximum radius for a dot
  inEaseFn: eases.easeOut,
  inEaseStart: .2, // scroll percentage to start animation in on first dot
  inEaseEnd: .8, // scroll percentage to end animation in on last dot
  outEaseFn: eases.linear,
  outEaseStart: .6, // scroll percentage to start animation out on first dot
  outEaseEnd: 1.1, // scroll percentage to end animation out on last dot
  fixed: false, // fixed position and full screen?
  imageSizing: 'cover', // 'cover' or 'contain'
  cornering: 0, // diagnal top left fade
  control: 'scroll', // 'scroll', 'mouse' (TODO), or 'none'
  fill: null // optionally override fill color
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
 *  @method sizeImage() - for internal use
 *  @method getPercentageFromScroll() - returns a percentage of progress past element based on scrolling
 *  @method init()
 *  @method destroy()
 *  @method animIn({animation time in ms})
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
  this.fill = this.settings.fill || computedStyle.backgroundColor;
  if (!!computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
    this.image = new Image();
    this.image.src = computedStyle.backgroundImage.match(/\((?:'|")?(.+?)(?:'|")?\)/)[1];
  }
  if (!this.settings.fill)
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
    if (!this.canvas || (percentage < this.settings.inEaseStart || percentage > this.settings.outEaseEnd)) {
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

    // center in container
    // if (!this.settings.fixed || getBreakpoint < 3) {
    //   this.canvas.style.position = 'absolute';
    //   this.canvas.style.top = (this.element.offsetHeight - this.canvas.height) / 2 + 'px';
    //   this.canvas.style.left = (this.element.offsetWidth - this.canvas.width) / 2 + 'px';
    // }


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

    if (this.element.children.length) {
      this.element.insertBefore(this.canvas, this.element.children[0]);
    }
    else {
      this.element.appendChild(this.canvas);
    }

    // determine image size
    if (this.image) {
      if (this.image.complete) {
        this.sizeImage();
      }
      else {
        var _this = this;
        this.image.onload = function () {
          _this.sizeImage();
          _this.draw(_this.getPercentageFromScroll());
        }
      }
    }

    // establish scroll based controls only if screen is large enough for us to care
    if (getBreakpoint() >= 3 && this.settings.control === 'scroll') {
      this.scrollController = new ScrollController(this.element, this.onScroll);
    }
    else {
      if (this.scrollController) {
        this.scrollController.destroy();
        this.scrollController = null;
      }
      this.draw(this.getPercentageFromScroll());
    }
  },
  sizeImage: function () {
    // make sure we successfully loaded
    if (!this.image.width || !this.image.height) {
      this.imageOffsets = null;
      return false;
    }

    // figure out the scale to match 'cover' or 'contain', as defined by settings
    var scale = this.canvas.width / this.image.width;
    if (this.settings.imageSizing === 'cover' && scale * this.image.height < this.canvas.height) {
      scale = this.canvas.height / this.image.height;
    }
    else if (this.settings.imageSizing === 'contain' && scale * this.image.height > this.canvas.height) {
      scale = this.canvas.height / this.image.height;
    }
    // save the x,y,width,height of the scaled image so it can be easily drawn without math
    this.imageOffsets = {
      x: (this.canvas.width - this.image.width * scale) / 2,
      y: (this.canvas.height - this.image.height * scale) / 2,
      width: this.image.width * scale,
      height: this.image.height * scale
    }
  },
  getPercentageFromScroll: function () {
    return this.scrollController ? this.scrollController.getPercentage() : .55;
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
  },
  anim: function (startPerc, endPerc, time, ease, cb) {
    // first, turn off scroll listening
    if (this.scrollController)
      this.scrollController.disable();
    // establish defaults
    startPerc = startPerc || 0;
    endPerc = !isNaN(endPerc) ? endPerc : 1;
    time = time || 1000;
    ease = ease || eases.easeInOut;
    // get some base vars
    var startTime = new Date().getTime();
    var deltaPerc = endPerc - startPerc;
    var _this = this;
    var running = true;
    // this goes in the loop
    var animationFn = function () {
      if (running) {
        var now = new Date().getTime();
        var deltaTime = (now - startTime) / time;
        if (deltaTime < 1)
          _this.draw(ease(startPerc,deltaPerc,deltaTime));
        else {
          running = false;
          _this.draw(endPerc);
          if (_this.scrollController)
            _this.scrollController.enable();
          // get back out of the loop
          loop.removeFunction(animationFn);
          if (cb)
            cb();
        }
      }
    }
    loop.addFunction(animationFn);
  },
  animIn: function (time, cb) {
    // animate the canvas from inEaseStart to current scroll pos
    // check if we even need to
    var endPerc = this.getPercentageFromScroll();
    if (endPerc < this.settings.inEaseStart)
      return false;

    this.anim(this.settings.inEaseStart, endPerc, time, eases.easeOut, cb);
  },
  animOut: function (time, cb) {
    // animate the canvas from inEaseStart to current scroll pos
    // check if we even need to
    var startPerc = this.getPercentageFromScroll();
    if (startPerc < this.settings.inEaseStart)
      return false;

    this.anim(startPerc, this.settings.inEaseStart, time, eases.easeIn, cb);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYnJlYWtwb2ludHMuanMiLCJsaWIvZWFzZS5qcyIsImxpYi9nZXRQYWdlT2Zmc2V0LmpzIiwibGliL2dldFNjcm9sbFBvcy5qcyIsImxpYi9nZXRXaW5kb3dTaXplLmpzIiwibGliL2xvb3AuanMiLCJsaWIvc2Nyb2xsQ29udHJvbGxlci5qcyIsImxpYi9zZXRUcmFuc2Zvcm0uanMiLCJvYmplY3RzL2FydGljbGUuanMiLCJvYmplY3RzL2hhbGZ0b25lLmpzIiwic2NyaXB0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBicHMgPSBbNzIwLDk2MCwxMjAwLDE2ODBdO1xuXG52YXIgd2luZG93U2l6ZSA9IHJlcXVpcmUoJ2xpYi9nZXRXaW5kb3dTaXplJyk7XG5cbnZhciBnZXRCcmVha3BvaW50ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc2l6ZSA9IHdpbmRvd1NpemUud2lkdGgoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBicHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYnBzW2ldID4gc2l6ZSlcbiAgICAgIHJldHVybiBpO1xuICB9XG4gIHJldHVybiBicHMubGVuZ3RoO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldEJyZWFrcG9pbnQ7XG4iLCIvLyBhIGJ1bmNoIG9mIGVhc2luZyBmdW5jdGlvbnMgZm9yIG1ha2luZyBhbmltYXRpb25zXG4vLyBhbGwgYWNjZXB0IHN0YXJ0LCBjaGFuZ2UsIGFuZCBwZXJjZW50XG5cbnZhciBlYXNlcyA9IHtcbiAgJ2Vhc2VJbk91dCcgOiBmdW5jdGlvbiAocyxjLHApIHtcbiAgICBpZiAocCA8IC41KSB7XG4gICAgICByZXR1cm4gcyArIGMgKiAoMiAqIHAgKiBwKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gcyArIGMgKiAoLTIgKiAocCAtIDEpICogKHAgLSAxKSArIDEpO1xuICAgIH1cbiAgfSxcbiAgJ2Vhc2VJbicgOiBmdW5jdGlvbiAocyxjLHApIHtcbiAgICByZXR1cm4gcyArIGMgKiBwICogcDtcbiAgfSxcbiAgJ2Vhc2VJbkN1YmljJyA6IGZ1bmN0aW9uIChzLGMscCkge1xuICAgIHJldHVybiBzICsgYyAqIChwICogcCAqIHApO1xuICB9LFxuICAnZWFzZU91dCcgOiBmdW5jdGlvbiAocyxjLHApIHtcbiAgICByZXR1cm4gcyArIGMgKiAoLTEgKiAocCAtIDEpICogKHAgLSAxKSArIDEpO1xuICB9LFxuICAnZWFzZU91dEN1YmljJyA6IGZ1bmN0aW9uIChzLGMscCkge1xuICAgIHJldHVybiBzICsgYyAqICgocCAtIDEpICogKHAgLSAxKSAqIChwIC0gMSkgKyAxKTtcbiAgfSxcbiAgJ2xpbmVhcicgOiBmdW5jdGlvbiAocyxjLHApIHtcbiAgICByZXR1cm4gcyArIGMgKiBwO1xuICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IGVhc2VzO1xuIiwiLyoqXG4gKiAgRnVuY3Rpb246IG9zLmdldFBhZ2VPZmZzZXRcbiAqICBnZXRzIHRoZSBwYWdlIG9mZnNldCB0b3AgYW5kIGxlZnQgb2YgYSBET00gZWxlbWVudFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldFBhZ2VPZmZzZXQgKGVsZW1lbnQpIHtcbiAgaWYgKCFlbGVtZW50KSB7XG4gICAgY29uc29sZS5lcnJvcignZ2V0UGFnZU9mZnNldCBwYXNzZWQgYW4gaW52YWxpZCBlbGVtZW50OicsIGVsZW1lbnQpO1xuICB9XG4gIHZhciBwYWdlT2Zmc2V0WCA9IGVsZW1lbnQub2Zmc2V0TGVmdCxcbiAgcGFnZU9mZnNldFkgPSBlbGVtZW50Lm9mZnNldFRvcDtcblxuICB3aGlsZSAoZWxlbWVudCA9IGVsZW1lbnQub2Zmc2V0UGFyZW50KSB7XG4gICAgcGFnZU9mZnNldFggKz0gZWxlbWVudC5vZmZzZXRMZWZ0O1xuICAgIHBhZ2VPZmZzZXRZICs9IGVsZW1lbnQub2Zmc2V0VG9wO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBsZWZ0IDogcGFnZU9mZnNldFgsXG4gICAgdG9wIDogcGFnZU9mZnNldFlcbiAgfVxufVxuIiwiLyoqXG4gKiAgZ2V0U2Nyb2xsUG9zXG4gKlxuICogIGNyb3NzIGJyb3dzZXIgd2F5IHRvIGdldCBzY3JvbGxUb3BcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKHVuZGVmaW5lZCkge1xuICBpZiAod2luZG93LnNjcm9sbFkgIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0U2Nyb2xsUG9zICgpIHsgcmV0dXJuIHdpbmRvdy5zY3JvbGxZOyB9XG4gIGVsc2VcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0U2Nyb2xsUG9zICgpIHsgcmV0dXJuIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3A7IH1cbn0pKCk7XG4iLCIvKipcbiAqICBnZXQgd2luZG93IHNpemUsIGNyb3NzIGJyb3dzZXIgZnJpZW5kbHlcbiAqICBjYWxsIC53aWR0aCgpIG9yIC5oZWlnaHQoKSB0byBnZXQgdGhlIHJlbGV2YW50IHZhbHVlIGluIHBpeGVsc1xuICovXG52YXIgd2luZG93SGVpZ2h0ID0gZnVuY3Rpb24gd2luZG93SGVpZ2h0ICgpIHtcbiAgcmV0dXJuIHdpbmRvdy5pbm5lckhlaWdodCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xufTtcbnZhciB3aW5kb3dXaWR0aCA9IGZ1bmN0aW9uIHdpbmRvd1dpZHRoICgpIHtcbiAgcmV0dXJuIHdpbmRvdy5pbm5lcldpZHRoIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB3aWR0aDogd2luZG93V2lkdGgsXG4gIGhlaWdodDogd2luZG93SGVpZ2h0XG59XG4iLCIvKipcbiAqICBMb29wXG4gKlxuICogIFRoZSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgTG9vcC4gSXQgaGFuZGxlcyBhbmltYXRpb24gYW5kIHN0YXRlIGNoYW5nZXNcbiAqICByZWxhdGVkIHRvIHNjcm9sbGluZyBvciB3aW5kb3cgc2l6aW5nLiBJdCBjYW4gYWxzbyBiZSB1c2VkIGZvciByZWd1bGFyIGpzXG4gKiAgZHJpdmVuIGFuaW1hdGlvbiBhcyB3ZWxsLlxuICpcbiAqICBUbyB1c2U6XG4gKiAgICBleHBvcnRzLmFkZFNjcm9sbEZ1bmN0aW9uKGZuKSAtIGFkZHMgYSBmdW5jdGlvbiB0byBmaXJlIHdoZW5ldmVyIHNjcm9sbFxuICogICAgICBwb3NpdGlvbiBjaGFuZ2VzXG4gKiAgICBleHBvcnRzLmFkZFJlc2l6ZUZ1bmN0aW9uKGZuKSAtIGFkZHMgYSBmdW5jdGlvbiB0byBmaXJlIHdoZW5ldmVyIHRoZVxuICogICAgICB3aW5kb3cgaXMgcmVzaXplZCwgZGVib3VuY2VkIGJ5IHRoZSB2YWx1ZSBvZiB0aGUgcmVzaXplRGVib3VuY2UgdmFyXG4gKiAgICBleHBvcnRzLmFkZEZ1bmN0aW9uKGZuKSAtIGFkZHMgYSBmdW5jdGlvbiB0byBmaXJlIG9uIGV2ZXJ5IGl0ZXJhdGlvbiBvZlxuICogICAgICB0aGUgbG9vcC4gTGltaXQgdGhlIHVzZSBvZiB0aGlzXG4gKiAgICBleHBvcnRzLnJlbW92ZUZ1bmN0aW9uKGZuKSAtIHJlbW92ZXMgYSBmdW5jdGlvbiBmcm9tIHRoZSBsaXN0IG9mIGZ1bmN0aW9uc1xuICogICAgICB0byBmaXJlXG4gKiAgICBleHBvcnRzLnN0YXJ0KCkgLSBzdGFydHMgdGhlIGxvb3AgKGRvZXNuJ3QgbmVlZCB0byBiZSBjYWxsZWQgdW5sZXNzIHRoZVxuICogICAgICBsb29wIHdhcyBzdG9wcGVkIGF0IHNvbWUgcG9pbnQpXG4gKiAgICBleHBvcnRzLnN0b3AoKSAtIHN0b3BzIHRoZSBsb29wXG4gKiAgICBleHBvcnRzLmZvcmNlKCkgLSBmb3JjZXMgdGhlIG5leHQgaXRlcmF0aW9uIG9mIHRoZSBsb29wIHRvIGZpcmUgc2Nyb2xsIGFuZFxuICogICAgICByZXNpemUgZnVuY3Rpb25zLCByZWdhcmRsZXNzIG9mIHdoZXRoZXIgb3Igbm90IGVpdGhlciB0aGluZ3MgYWN0dWFsbHlcbiAqICAgICAgaGFwcGVuZWRcbiAqL1xuXG4vKipcbiAqIFByb3ZpZGVzIHJlcXVlc3RBbmltYXRpb25GcmFtZSBpbiBhIGNyb3NzIGJyb3dzZXIgd2F5LlxuICogQGF1dGhvciBwYXVsaXJpc2ggLyBodHRwOi8vcGF1bGlyaXNoLmNvbS9cbiAqL1xuaWYgKCAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSApIHtcblx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9ICggZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHR3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG5cdFx0d2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHR3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHRmdW5jdGlvbiggLyogZnVuY3Rpb24gRnJhbWVSZXF1ZXN0Q2FsbGJhY2sgKi8gY2FsbGJhY2sgKSB7XG5cdFx0XHR3aW5kb3cuc2V0VGltZW91dCggY2FsbGJhY2ssIDEwMDAgLyA2MCApO1xuXHRcdH07XG5cdH0gKSgpO1xufVxuXG47KGZ1bmN0aW9uIChkb2N1bWVudCx3aW5kb3csdW5kZWZpbmVkKSB7XG5cbiAgLy8gb3RoZXIgbGliIGhlbHBlcnNcbiAgdmFyIGdldFNjcm9sbFBvcyA9IHJlcXVpcmUoJ2xpYi9nZXRTY3JvbGxQb3MnKTtcblxuICAvLyBwcml2YXRlIHZhcnNcbiAgdmFyIHJ1bm5pbmcgPSB0cnVlLFxuICAgICAgbGFzdEJvZHlXaWR0aCA9IGRvY3VtZW50LmJvZHkub2Zmc2V0V2lkdGgsIC8vIHN0b3JlIHdpZHRoIHRvIGRldGVybWluZSBpZiByZXNpemUgbmVlZGVkXG4gICAgICBsYXN0Qm9keUhlaWdodCA9IGRvY3VtZW50LmJvZHkub2Zmc2V0SGVpZ2h0LCAvLyBzdG9yZSBoZWlnaHQgdG8gZGV0ZXJtaW5lIGlmIHJlc2l6ZSBuZWVkZWRcbiAgICAgIGxhc3RTY3JvbGwgPSAtMSxcbiAgICAgIGxhc3RUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCksIC8vIGxhc3QgdGltZSBzbyB3ZSBrbm93IGhvdyBsb25nIGl0J3MgYmVlblxuICAgICAgcmVzaXplRGVib3VuY2UgPSA1MDBcbiAgICAgIDtcblxuICAvLyBzYXZlIHRoZSBmdW5jdGlvbnMgdGhlIGxvb3Agc2hvdWxkIHJ1blxuICAvLyB3aWxsIGJlIHBhc3NlZCBjdXJyZW50VGltZSwgdGltZUNoYW5nZVxuICB2YXIgbG9vcEZ1bmNzID0ge1xuICAgIHJlc2l6ZSA6IFtdLCAvLyBmdW5jdGlvbnMgdG8gcnVuIG9uIHJlc2l6ZVxuICAgIHNjcm9sbCA6IFtdLCAvLyBmdW5jdGlvbnMgdG8gcnVuIG9uIHNjcm9sbFxuICAgIHRpY2sgOiBbXSAvLyBmdW5jdGlvbnMgdG8gcnVuIGV2ZXJ5IHRpY2tcbiAgfTtcblxuICAvLyBhZGQvcmVtb3ZlIG1ldGhvZHMgZm9yIHRob3NlIGZ1bmN0aW9uc1xuICB2YXIgYWRkTG9vcEZ1bmN0aW9uID0gZnVuY3Rpb24gYWRkTG9vcEZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgIGlmIChsb29wRnVuY3NbdHlwZV0uaW5kZXhPZihmbikgPT09IC0xKSB7IC8vIG1ha2Ugc3VyZSBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QgKG9ubHkgd29ya3Mgd2l0aCBub24tYW5vbnltb3VzIGZ1bmN0aW9ucylcbiAgICAgIGxvb3BGdW5jc1t0eXBlXS5wdXNoKGZuKTtcblx0XHRcdHN0YXJ0KCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciBhZGRTY3JvbGxGdW5jdGlvbiA9IGZ1bmN0aW9uIGFkZFNjcm9sbEZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBhZGRMb29wRnVuY3Rpb24oJ3Njcm9sbCcsZm4pO1xuICB9XG4gIHZhciBhZGRSZXNpemVGdW5jdGlvbiA9IGZ1bmN0aW9uIGFkZFJlc2l6ZUZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBhZGRMb29wRnVuY3Rpb24oJ3Jlc2l6ZScsZm4pO1xuICB9XG4gIHZhciBhZGRGdW5jdGlvbiA9IGZ1bmN0aW9uIGFkZEZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBhZGRMb29wRnVuY3Rpb24oJ3RpY2snLGZuKTtcbiAgfVxuICB2YXIgcmVtb3ZlRnVuY3Rpb24gPSBmdW5jdGlvbiByZW1vdmVGdW5jdGlvbiAoZm4pIHtcbiAgICB2YXIgdHlwZXMgPSBbJ3Jlc2l6ZScsJ3Njcm9sbCcsJ3RpY2snXTtcbiAgICB2YXIgZm91bmQgPSBmYWxzZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR5cGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaW5kZXggPSBsb29wRnVuY3NbdHlwZXNbaV1dLmluZGV4T2YoZm4pO1xuICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICBsb29wRnVuY3NbdHlwZXNbaV1dLnNwbGljZShpbmRleCwxKTtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cdFx0Ly8gY2hlY2sgdGhhdCB3ZSdyZSBzdGlsbCBsaXN0ZW5pbmdcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR5cGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAobG9vcEZ1bmNzW3R5cGVzW2ldXS5sZW5ndGgpXG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZWxzZSBpZiAoaSA9PT0gdHlwZXMubGVuZ3RoIC0gMSlcblx0XHRcdFx0c3RvcCgpO1xuXHRcdH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cblxuICAvLyBkbyBhbGwgZnVuY3Rpb25zIG9mIGEgZ2l2ZW4gdHlwZVxuICB2YXIgZG9Mb29wRnVuY3Rpb25zID0gZnVuY3Rpb24gZG9Mb29wRnVuY3Rpb25zICh0eXBlLGN1cnJlbnRUaW1lKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGxvb3BGdW5jc1t0eXBlXS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGxvb3BGdW5jc1t0eXBlXVtpXSkgLy8gZXh0cmEgY2hlY2sgZm9yIHNhZmV0eVxuICAgICAgXHRsb29wRnVuY3NbdHlwZV1baV0uY2FsbCh3aW5kb3csY3VycmVudFRpbWUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIHN0YXJ0L3N0b3AgY29udHJvbFxuICB2YXIgc3RhcnQgPSBmdW5jdGlvbiBzdGFydExvb3AgKCkge1xuICAgIHJ1bm5pbmcgPSB0cnVlO1xuXHRcdGxvb3BGbigpO1xuICB9XG4gIHZhciBzdG9wID0gZnVuY3Rpb24gc3RvcExvb3AgKCkge1xuICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgfVxuXG4gIC8vIGZvcmNlIGl0IHRvIGZpcmUgbmV4dCB0aW1lIHRocm91Z2ggYnkgc2V0dGluZyBsYXN0U2Nyb2xsIGFuZCBsYXN0Qm9keVdpZHRoXG4gIC8vIHRvIGltcG9zc2libGUgdmFsdWVzXG4gIHZhciBmb3JjZSA9IGZ1bmN0aW9uIGZvcmNlTG9vcCAoKSB7XG4gICAgbGFzdEJvZHlXaWR0aCA9IC0xO1xuICAgIGxhc3RTY3JvbGwgPSAtMTtcbiAgfVxuXG4gIC8vIGhvbGQgYSByZXNpemUgdGltb3V0IHNvIHdlIGNhbiBkZWJvdW5jZSBpdFxuICB2YXIgcmVzaXplVGltZW91dCA9IG51bGw7XG5cbiAgLy8gdGhlIHJlYWwgZGVhbCFcbiAgLy8gaW4gYSBjbG9zdXJlIGZvciBtYXhpbXVtIHNhZmV0eSwgYW5kIHNvIGl0IGF1dG9zdGFydHNcbiAgLy8gbm90ZTogYWZ0ZXIgY2hlY2tpbmcgdXNpbmcganNwZXJmLCByYXRoZXIgdGhhbiBtYWtpbmcgb25lIGJpZyB0b2RvIGFycmF5IG9mXG4gIC8vIGFsbCB0aGUgZnVuY3Rpb25zLCBpdCdzIGZhc3RlciB0byBjYWxsIGVhY2ggYXJyYXkgb2YgZnVuY3Rpb25zIHNlcGFyYXRlbHlcbiAgZnVuY3Rpb24gbG9vcEZuKCkge1xuXG4gICAgLy8gY2hlY2sgdGhhdCB3ZSdyZSBhY3R1YWxseSBydW5uaW5nLi4uXG4gICAgaWYgKHJ1bm5pbmcpIHtcblxuICAgICAgdmFyIGN1cnJlbnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICB2YXIgdGltZUNoYW5nZSA9IGN1cnJlbnRUaW1lIC0gbGFzdFRpbWU7XG4gICAgICB2YXIgY3VycmVudFNjcm9sbCA9IGdldFNjcm9sbFBvcygpO1xuXG4gICAgICAvLyBjaGVjayBpZiByZXNpemVcbiAgICAgIGlmIChkb2N1bWVudC5ib2R5Lm9mZnNldFdpZHRoICE9PSBsYXN0Qm9keVdpZHRoIHx8IGRvY3VtZW50LmJvZHkub2Zmc2V0SGVpZ2h0ICE9PSBsYXN0Qm9keUhlaWdodCkge1xuICAgICAgICAvLyByZXNpemUgaXMgdHJ1ZSwgc2F2ZSBuZXcgc2l6ZXNcbiAgICAgICAgbGFzdEJvZHlXaWR0aCA9IGRvY3VtZW50LmJvZHkub2Zmc2V0V2lkdGg7XG4gICAgICAgIGxhc3RCb2R5SGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5vZmZzZXRIZWlnaHQ7XG5cbiAgICAgICAgaWYgKHJlc2l6ZVRpbWVvdXQpXG4gICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChyZXNpemVUaW1lb3V0KTtcbiAgICAgICAgcmVzaXplVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBkb0xvb3BGdW5jdGlvbnMoJ3Jlc2l6ZScsY3VycmVudFRpbWUpO1xuICAgICAgICB9LCByZXNpemVEZWJvdW5jZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIGNoZWNrIGlmIHNjcm9sbFxuICAgICAgaWYgKGxhc3RTY3JvbGwgIT09IGN1cnJlbnRTY3JvbGwpIHtcbiAgICAgICAgLy8gc2Nyb2xsIGlzIHRydWUsIHNhdmUgbmV3IHBvc2l0aW9uXG4gICAgICAgIGxhc3RTY3JvbGwgPSBjdXJyZW50U2Nyb2xsO1xuXG4gICAgICAgIC8vIGNhbGwgZWFjaCBmdW5jdGlvblxuICAgICAgICBkb0xvb3BGdW5jdGlvbnMoJ3Njcm9sbCcsY3VycmVudFRpbWUpO1xuICAgICAgfVxuXG4gICAgICAvLyBkbyB0aGUgYWx3YXlzIGZ1bmN0aW9uc1xuICAgICAgZG9Mb29wRnVuY3Rpb25zKCd0aWNrJyxjdXJyZW50VGltZSk7XG5cbiAgICAgIC8vIHNhdmUgdGhlIG5ldyB0aW1lXG4gICAgICBsYXN0VGltZSA9IGN1cnJlbnRUaW1lO1xuXG5cdFx0XHQvLyBtYWtlIHN1cmUgd2UgZG8gdGhlIHRpY2sgYWdhaW4gbmV4dCB0aW1lXG5cdCAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcEZuKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gZXhwb3J0IHRoZSB1c2VmdWwgZnVuY3Rpb25zXG4gIG1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFkZFNjcm9sbEZ1bmN0aW9uOiBhZGRTY3JvbGxGdW5jdGlvbixcbiAgICBhZGRSZXNpemVGdW5jdGlvbjogYWRkUmVzaXplRnVuY3Rpb24sXG4gICAgYWRkRnVuY3Rpb246IGFkZEZ1bmN0aW9uLFxuICAgIHJlbW92ZUZ1bmN0aW9uOiByZW1vdmVGdW5jdGlvbixcbiAgICBzdGFydDogc3RhcnQsXG4gICAgc3RvcDogc3RvcCxcbiAgICBmb3JjZTogZm9yY2VcbiAgfVxuXG59KShkb2N1bWVudCx3aW5kb3cpO1xuIiwiLyoqXG4gKiAgVXNlZnVsIGNsYXNzIGZvciBoYW5kbGluZyBwYXJhbGxheGluZyB0aGluZ3NcbiAqICBTdG9yZXMgb2JqZWN0IG1lYXN1cmVtZW50cyBhbmQgcmV0dXJucyBwZXJjZW50YWdlIG9mIHNjcm9sbCB3aGVuIGFza2VkXG4gKi9cblxuLy8gaGVscGVyc1xudmFyIGdldFBhZ2VPZmZzZXQgPSByZXF1aXJlKCdsaWIvZ2V0UGFnZU9mZnNldCcpLFxuICAgIHdpbmRvd1NpemUgPSByZXF1aXJlKCdsaWIvZ2V0V2luZG93U2l6ZScpLFxuICAgIGdldFNjcm9sbFBvcyA9IHJlcXVpcmUoJ2xpYi9nZXRTY3JvbGxQb3MnKSxcbiAgICBsb29wID0gcmVxdWlyZSgnbGliL2xvb3AnKVxuICAgIDtcblxuXG52YXIgUGFyYWxsYXggPSBmdW5jdGlvbiBQYXJhbGxheCAoZWxlbWVudCwgb25TY3JvbGwpIHtcbiAgaWYgKCF0aGlzIGluc3RhbmNlb2YgUGFyYWxsYXgpXG4gICAgcmV0dXJuIG5ldyBQYXJhbGxheChlbGVtZW50KTtcblxuICB2YXIgX3RoaXMgPSB0aGlzO1xuICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG4gIC8vIGdldCBtZWFzdXJlbWVudHMgaW1tZWRpYXRlbHlcbiAgdGhpcy5tZWFzdXJlKCk7XG4gIGlmIChvblNjcm9sbClcbiAgICBvblNjcm9sbChfdGhpcy5nZXRQZXJjZW50YWdlKCkpO1xuXG4gIC8vIGxpc3RlbmVyc1xuICB0aGlzLm9uUmVzaXplID0gZnVuY3Rpb24gbWVhc3VyZVBhcmFsbGF4ICgpIHtcbiAgICBfdGhpcy5tZWFzdXJlKCk7XG4gIH1cbiAgaWYgKG9uU2Nyb2xsKSB7XG4gICAgdGhpcy5vblNjcm9sbCA9IGZ1bmN0aW9uIHNjcm9sbFBhcmFsbGF4ICgpIHtcbiAgICAgIG9uU2Nyb2xsLmFwcGx5KF90aGlzLCBbX3RoaXMuZ2V0UGVyY2VudGFnZSgpXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gc3RhcnQgJ2VyIHVwXG4gIHRoaXMuZW5hYmxlKCk7XG59XG5QYXJhbGxheC5wcm90b3R5cGUgPSB7XG4gIG1lYXN1cmU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcG8gPSBnZXRQYWdlT2Zmc2V0KHRoaXMuZWxlbWVudCk7XG4gICAgdGhpcy50b3AgPSBwby50b3AgLSB3aW5kb3dTaXplLmhlaWdodCgpO1xuICAgIHRoaXMuYm90dG9tID0gcG8udG9wICsgdGhpcy5lbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgICB0aGlzLmhlaWdodCA9IHRoaXMuYm90dG9tIC0gdGhpcy50b3A7XG4gIH0sXG4gIGdldFBlcmNlbnRhZ2U6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2Nyb2xsWSA9IGdldFNjcm9sbFBvcygpO1xuICAgIHZhciBwZXJjID0gKHNjcm9sbFkgLSB0aGlzLnRvcCkgLyAodGhpcy5oZWlnaHQpO1xuICAgIHJldHVybiBwZXJjO1xuICB9LFxuICBkaXNhYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgbG9vcC5yZW1vdmVGdW5jdGlvbih0aGlzLm9uUmVzaXplKTtcbiAgICBpZiAodGhpcy5vblNjcm9sbClcbiAgICAgIGxvb3AucmVtb3ZlRnVuY3Rpb24odGhpcy5vblNjcm9sbCk7XG4gIH0sXG4gIGVuYWJsZTogZnVuY3Rpb24gKCkge1xuICAgIGxvb3AuYWRkUmVzaXplRnVuY3Rpb24odGhpcy5vblJlc2l6ZSk7XG4gICAgaWYgKHRoaXMub25TY3JvbGwpXG4gICAgICBsb29wLmFkZFNjcm9sbEZ1bmN0aW9uKHRoaXMub25TY3JvbGwpO1xuICB9LFxuICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgZGVsZXRlIHRoaXM7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQYXJhbGxheDtcbiIsIi8qKlxuICogIFNldHMgVHJhbnNmb3JtIHN0eWxlcyBjcm9zcyBicm93c2VyXG4gKiAgQHBhcmFtIHtIVE1MRWxlbWVudH1cbiAqICBAcGFyYW0ge3N0cmluZ30gdmFsdWUgb2YgdGhlIHRyYW5zZm9ybSBzdHlsZVxuICovXG5cbnZhciB0cmFuc2Zvcm1BdHRyaWJ1dGVzID0gWyd0cmFuc2Zvcm0nLCd3ZWJraXRUcmFuc2Zvcm0nLCdtb3pUcmFuc2Zvcm0nLCdtc1RyYW5zZm9ybSddO1xudmFyIHNldFRyYW5zZm9ybSA9IGZ1bmN0aW9uIChlbGVtZW50LCB0cmFuc2Zvcm1TdHJpbmcpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRyYW5zZm9ybUF0dHJpYnV0ZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBlbGVtZW50LnN0eWxlW3RyYW5zZm9ybUF0dHJpYnV0ZXNbaV1dID0gdHJhbnNmb3JtU3RyaW5nO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0VHJhbnNmb3JtO1xuIiwiLyoqXHJcbiAqICBGdWxsIEFydGljbGUgY29udHJvbGxlclxyXG4gKi9cclxuXHJcbi8vIHJlcXVpcmVtZW50c1xyXG52YXIgSGFsZnRvbmUgPSByZXF1aXJlKCdvYmplY3RzL2hhbGZ0b25lJyk7XHJcbnZhciBTY3JvbGxDb250cm9sbGVyID0gcmVxdWlyZSgnbGliL3Njcm9sbENvbnRyb2xsZXInKTtcclxudmFyIGdldFNjcm9sbFBvcyA9IHJlcXVpcmUoJ2xpYi9nZXRTY3JvbGxQb3MnKTtcclxudmFyIGVhc2VzID0gcmVxdWlyZSgnbGliL2Vhc2UnKTtcclxuXHJcbi8vIHNldHRpbmdzXHJcbnZhciBIRUFERVJfSEFMRlRPTkVfU0VUVElOR1MgPSB7XHJcbiAgZmFkZTogMTIsXHJcbiAgbWF4UmFkaXVzOiAxNlxyXG59XHJcbnZhciBJTk5FUl9IQUxGVE9ORV9TRVRUSU5HUyA9IHtcclxuICBmYWRlOiAwLFxyXG4gIGltYWdlU2l6aW5nOiAnY29udGFpbicsXHJcbiAgaW5FYXNlU3RhcnQ6IC4xLCAvLyBzY3JvbGwgcGVyY2VudGFnZSB0byBzdGFydCBhbmltYXRpb24gaW4gb24gZmlyc3QgZG90XHJcbiAgaW5FYXNlRW5kOiAuNSwgLy8gc2Nyb2xsIHBlcmNlbnRhZ2UgdG8gZW5kIGFuaW1hdGlvbiBpbiBvbiBsYXN0IGRvdFxyXG4gIG91dEVhc2VTdGFydDogLjc1LFxyXG4gIGNvcm5lcmluZzogOFxyXG59XHJcbnZhciBSRUxBVEVEX0hBTEZUT05FX1NFVFRJTkdTID0ge1xyXG4gIGZhZGU6IDAsXHJcbiAgaW5FYXNlU3RhcnQ6IC0uNCxcclxuICBpbkVhc2VFbmQ6IC44LFxyXG4gIGluRWFzZUZuOiBlYXNlcy5saW5lYXIsXHJcbiAgb3V0RWFzZVN0YXJ0OiAuNixcclxuICBvdXRFYXNlRW5kOiAxLjJcclxufVxyXG5cclxuLyoqXHJcbiAqICBBcnRpY2xlIGNsYXNzXHJcbiAqICBAcGFyYW0ge0hUTUxFbGVtZW50fSB0aGUgd2hvbGUgZGFtbiBhcnRpY2xlXHJcbiAqL1xyXG52YXIgQXJ0aWNsZSA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XHJcbiAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuXHJcbiAgLy8gaW5pdCBoZWFkZXJcclxuICB2YXIgaGVhZGVyRWwgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hcnRpY2xlX19oZWFkZXInKTtcclxuICBpZiAoaGVhZGVyRWwpIHtcclxuICAgIHRoaXMuaGVhZGVyID0gbmV3IEhhbGZ0b25lKGhlYWRlckVsLCBIRUFERVJfSEFMRlRPTkVfU0VUVElOR1MpO1xyXG4gICAgdGhpcy5oZWFkZXIuYW5pbUluKDEyMDApO1xyXG4gIH1cclxuXHJcbiAgLy8gaW5pdCBvdGhlciBoYWxmdG9uZXNcclxuICB2YXIgaGFsZnRvbmVFbHMgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5oYWxmdG9uZScpO1xyXG4gIHRoaXMuaGFsZnRvbmVzID0gW107XHJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGhhbGZ0b25lRWxzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICB2YXIgaHQgPSBuZXcgSGFsZnRvbmUoaGFsZnRvbmVFbHNbaV0sIElOTkVSX0hBTEZUT05FX1NFVFRJTkdTKTtcclxuICAgIC8vaHQuYW5pbUluKDEyMDApO1xyXG4gICAgdGhpcy5oYWxmdG9uZXMucHVzaChodCk7XHJcbiAgfVxyXG5cclxuICB2YXIgcmVsYXRlZHNFbCA9IGVsZW1lbnQucXVlcnlTZWxlY3RvcignLnJlbGF0ZWRzJyk7XHJcbiAgaWYgKHJlbGF0ZWRzRWwpIHtcclxuICAgIHRoaXMuaGFsZnRvbmVzLnB1c2gobmV3IEhhbGZ0b25lKHJlbGF0ZWRzRWwsIFJFTEFURURfSEFMRlRPTkVfU0VUVElOR1MpKTtcclxuICB9XHJcblxyXG4gIC8vIGJ1dHRvbnNcclxuICAvLyB2YXIgYnV0dG9uRWxzID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYnV0dG9uJyk7XHJcbiAgLy8gdGhpcy5idXR0b25zID0gW107XHJcbiAgLy8gZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJ1dHRvbkVscy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gIC8vICAgdmFyIGh0ID0gbmV3IEhhbGZ0b25lKGJ1dHRvbkVsc1tpXSwge1xyXG4gIC8vICAgICBmYWRlOiAxLFxyXG4gIC8vICAgICBpbkVhc2VTdGFydDogMCxcclxuICAvLyAgICAgaW5FYXNlRW5kOiAxLFxyXG4gIC8vICAgICBvdXRFYXNlU3RhcnQ6IDEuMSxcclxuICAvLyAgICAgb3V0RWFzZUVuZDogMS4xLFxyXG4gIC8vICAgICBjb250cm9sOiAnbm9uZScsXHJcbiAgLy8gICAgIGZpbGw6ICcjMDQ2YzZmJ1xyXG4gIC8vICAgfSk7XHJcbiAgLy8gICBidXR0b25FbHNbaV0uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJyxmdW5jdGlvbiAoKSB7XHJcbiAgLy8gICAgIGh0LmFuaW0oLjUsMSwzMDAwKTtcclxuICAvLyAgIH0sIGZhbHNlKTtcclxuICAvLyAgIGJ1dHRvbkVsc1tpXS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW91dCcsZnVuY3Rpb24gKCkge1xyXG4gIC8vICAgICBodC5hbmltKDEsLjUsMzAwMCk7XHJcbiAgLy8gICB9LCBmYWxzZSk7XHJcbiAgLy8gICB0aGlzLmhhbGZ0b25lcy5wdXNoKGh0KTtcclxuICAvLyB9XHJcblxyXG4gIC8vIGxpc3RlbiBmb3Igd2hlbiB0byBkZXN0cm95XHJcbiAgdmFyIF90aGlzID0gdGhpcztcclxuICB2YXIgb25TY3JvbGwgPSBmdW5jdGlvbiAoc2Nyb2xsUGVyY2VudGFnZSkge1xyXG4gICAgaWYgKGdldFNjcm9sbFBvcygpID4gdGhpcy5ib3R0b20gKyAzMDApXHJcbiAgICAgIF90aGlzLmRlc3Ryb3kodHJ1ZSk7XHJcbiAgfVxyXG4gIHRoaXMuc2Nyb2xsQ29udHJvbGxlciA9IG5ldyBTY3JvbGxDb250cm9sbGVyKHRoaXMuZWxlbWVudCk7XHJcbn1cclxuQXJ0aWNsZS5wcm90b3R5cGUgPSB7XHJcbiAgZGVzdHJveTogZnVuY3Rpb24gKGlzUGFzdCkge1xyXG4gICAgdmFyIG5ld1Njcm9sbFBvcyA9IGdldFNjcm9sbFBvcygpIC0gdGhpcy5lbGVtZW50Lm9mZnNldEhlaWdodDtcclxuICAgIGlmICh0aGlzLmhlYWRlcilcclxuICAgICAgdGhpcy5oZWFkZXIuZGVzdHJveSgpO1xyXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuaGFsZnRvbmVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKVxyXG4gICAgICB0aGlzLmhhbGZ0b25lc1tpXS5kZXN0cm95KCk7XHJcblxyXG4gICAgdGhpcy5zY3JvbGxDb250cm9sbGVyLmRlc3Ryb3koKTtcclxuXHJcbiAgICAvLyBmaXggc2Nyb2xsIHBvc2l0aW9uXHJcbiAgICBpZiAoaXNQYXN0KSB7XHJcbiAgICAgIHZhciByZXRyaWVkID0gZmFsc2U7XHJcbiAgICAgIGZ1bmN0aW9uIGZpeFNjcm9sbCAoKSB7XHJcbiAgICAgICAgd2luZG93LnNjcm9sbFRvKDAsbmV3U2Nyb2xsUG9zKTtcclxuICAgICAgfVxyXG4gICAgICBmaXhTY3JvbGwoKTtcclxuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZpeFNjcm9sbCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmVsZW1lbnQucmVtb3ZlKCk7XHJcbiAgICAvL2RlbGV0ZSB0aGlzO1xyXG4gIH1cclxufVxyXG5cclxuLy8gdGVtcCBpbml0IGFydGljbGVcclxud2luZG93LmFydGljbGUgPSBuZXcgQXJ0aWNsZShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYXJ0aWNsZScpKTtcclxuIiwiLyoqXHJcbiAqICBDb250cm9scyBjb29sIGhhbGZ0b25lIHRoaW5naWVzXHJcbiAqL1xyXG5cclxuLy8gcmVxdWlyZW1lbnRzXHJcbnZhciBlYXNlcyA9IHJlcXVpcmUoJ2xpYi9lYXNlJyk7XHJcbnZhciBTY3JvbGxDb250cm9sbGVyID0gcmVxdWlyZSgnbGliL3Njcm9sbENvbnRyb2xsZXInKTtcclxudmFyIHNldFRyYW5zZm9ybSA9IHJlcXVpcmUoJ2xpYi9zZXRUcmFuc2Zvcm0nKTtcclxudmFyIHdpbmRvd1NpemUgPSByZXF1aXJlKCdsaWIvZ2V0V2luZG93U2l6ZScpO1xyXG52YXIgZ2V0QnJlYWtwb2ludCA9IHJlcXVpcmUoJ2xpYi9icmVha3BvaW50cycpO1xyXG52YXIgbG9vcCA9IHJlcXVpcmUoJ2xpYi9sb29wJyk7XHJcblxyXG4vLyBzZXR0aW5nc1xyXG52YXIgREVGQVVMVFMgPSB7XHJcbiAgZmFkZTogNCwgLy8gcm93cyB0byBmYWRlIHRvcCBhbmQgYm90dG9tLCBpZiAwIHRoZSBjYW52YXMgaXMgc2l6ZWQgdG8gYmUgY29udGFpbmVkIGluc3RlYWQgb2Ygb3ZlcmZsb3cgb24gdGhlIHNpZGVzXHJcbiAgbWF4UmFkaXVzOiAxMCwgLy8gbWF4aW11bSByYWRpdXMgZm9yIGEgZG90XHJcbiAgaW5FYXNlRm46IGVhc2VzLmVhc2VPdXQsXHJcbiAgaW5FYXNlU3RhcnQ6IC4yLCAvLyBzY3JvbGwgcGVyY2VudGFnZSB0byBzdGFydCBhbmltYXRpb24gaW4gb24gZmlyc3QgZG90XHJcbiAgaW5FYXNlRW5kOiAuOCwgLy8gc2Nyb2xsIHBlcmNlbnRhZ2UgdG8gZW5kIGFuaW1hdGlvbiBpbiBvbiBsYXN0IGRvdFxyXG4gIG91dEVhc2VGbjogZWFzZXMubGluZWFyLFxyXG4gIG91dEVhc2VTdGFydDogLjYsIC8vIHNjcm9sbCBwZXJjZW50YWdlIHRvIHN0YXJ0IGFuaW1hdGlvbiBvdXQgb24gZmlyc3QgZG90XHJcbiAgb3V0RWFzZUVuZDogMS4xLCAvLyBzY3JvbGwgcGVyY2VudGFnZSB0byBlbmQgYW5pbWF0aW9uIG91dCBvbiBsYXN0IGRvdFxyXG4gIGZpeGVkOiBmYWxzZSwgLy8gZml4ZWQgcG9zaXRpb24gYW5kIGZ1bGwgc2NyZWVuP1xyXG4gIGltYWdlU2l6aW5nOiAnY292ZXInLCAvLyAnY292ZXInIG9yICdjb250YWluJ1xyXG4gIGNvcm5lcmluZzogMCwgLy8gZGlhZ25hbCB0b3AgbGVmdCBmYWRlXHJcbiAgY29udHJvbDogJ3Njcm9sbCcsIC8vICdzY3JvbGwnLCAnbW91c2UnIChUT0RPKSwgb3IgJ25vbmUnXHJcbiAgZmlsbDogbnVsbCAvLyBvcHRpb25hbGx5IG92ZXJyaWRlIGZpbGwgY29sb3JcclxufVxyXG5cclxuLyoqXHJcbiAqICBEb3QgY2xhc3NcclxuICogIEBwYXJhbSB7aW50fSBncmlkIHBvc2l0aW9uIFhcclxuICogIEBwYXJhbSB7aW50fSBncmlkIHBvc2l0aW9uIFlcclxuICogIEBwYXJhbSB7TnVtYmVyfSBtYXggcmFkaXVzXHJcbiAqICBAcGFyYW0ge0hhbGZ0b25lfSBwYXJlbnQgaGFsZnRvbmUgb2JqZWN0XHJcbiAqXHJcbiAqICBAbWV0aG9kIGRyYXcgKHtjYW52YXMgY29udGV4dH0pXHJcbiAqICBAbWV0aG9kIHNldFJhZGl1c0J5UGVyY2VudGFnZSAoe3BlcmNlbnQgb2YgbWF4IHJhZGl1c30pXHJcbiAqL1xyXG52YXIgRG90ID0gZnVuY3Rpb24gKGdyaWRYLCBncmlkWSwgbWF4UmFkaXVzLCBwYXJlbnQpIHtcclxuICB0aGlzLmdyaWRYID0gZ3JpZFg7XHJcbiAgdGhpcy5ncmlkWSA9IGdyaWRZO1xyXG4gIHRoaXMubWF4UmFkaXVzID0gbWF4UmFkaXVzO1xyXG4gIHRoaXMucmFkaXVzID0gbWF4UmFkaXVzO1xyXG4gIHRoaXMucGFyZW50ID0gcGFyZW50O1xyXG4gIHRoaXMucGVyY2VudGFnZSA9ICh0aGlzLmdyaWRYICsgdGhpcy5ncmlkWSkgLyAodGhpcy5wYXJlbnQuY29sdW1ucyArIHRoaXMucGFyZW50LnJvd3MpO1xyXG5cclxuICAvLyBkZWZpbmUgbG9jYXRpb24gd2l0aGluIGNhbnZhcyBjb250ZXh0XHJcbiAgdGhpcy54ID0gdGhpcy5ncmlkWCAqIHRoaXMucGFyZW50LnNldHRpbmdzLm1heFJhZGl1cztcclxuICB0aGlzLnkgPSB0aGlzLmdyaWRZICogdGhpcy5wYXJlbnQuc2V0dGluZ3MubWF4UmFkaXVzO1xyXG4gIGlmICh0aGlzLnBhcmVudC5zZXR0aW5ncy5mYWRlKVxyXG4gICAgdGhpcy55ICs9IHRoaXMucGFyZW50LnNldHRpbmdzLm1heFJhZGl1cztcclxuXHJcbiAgLy8gaGFuZGxlIGNvcm5lcmluZ1xyXG4gIGlmICh0aGlzLnBhcmVudC5zZXR0aW5ncy5jb3JuZXJpbmcgJiYgdGhpcy5ncmlkWCArIHRoaXMuZ3JpZFkgPD0gdGhpcy5wYXJlbnQuc2V0dGluZ3MuY29ybmVyaW5nICsgMSkge1xyXG4gICAgdGhpcy5tYXhSYWRpdXMgPSBlYXNlcy5saW5lYXIoLjMzLC42NiwodGhpcy5ncmlkWCArIHRoaXMuZ3JpZFkpIC8gKHRoaXMucGFyZW50LnNldHRpbmdzLmNvcm5lcmluZyArIDEpKSAqIHRoaXMubWF4UmFkaXVzO1xyXG4gICAgdGhpcy5yYWRpdXMgPSB0aGlzLm1heFJhZGl1cztcclxuICB9XHJcbiAgZWxzZSBpZiAodGhpcy5wYXJlbnQuc2V0dGluZ3MuY29ybmVyaW5nICYmIC0xICogKCh0aGlzLmdyaWRYICsgdGhpcy5ncmlkWSkgLSAodGhpcy5wYXJlbnQuY29sdW1ucyArIHRoaXMucGFyZW50LnJvd3MgLSAyKSkgPD0gdGhpcy5wYXJlbnQuc2V0dGluZ3MuY29ybmVyaW5nICsgMSkge1xyXG4gICAgdGhpcy5tYXhSYWRpdXMgPSBlYXNlcy5saW5lYXIoLjMzLC42NiwtMSAqICgodGhpcy5ncmlkWCArIHRoaXMuZ3JpZFkpIC0gKHRoaXMucGFyZW50LmNvbHVtbnMgKyB0aGlzLnBhcmVudC5yb3dzIC0gMikpIC8gKHRoaXMucGFyZW50LnNldHRpbmdzLmNvcm5lcmluZyArIDEpKSAqIHRoaXMubWF4UmFkaXVzO1xyXG4gICAgdGhpcy5yYWRpdXMgPSB0aGlzLm1heFJhZGl1cztcclxuICB9XHJcbn1cclxuRG90LnByb3RvdHlwZSA9IHtcclxuICBkcmF3OiBmdW5jdGlvbiAoY3R4KSB7XHJcbiAgICBjdHgubW92ZVRvKHRoaXMueCwgdGhpcy55IC0gdGhpcy5yYWRpdXMpO1xyXG4gICAgY3R4LmFyYyh0aGlzLngsIHRoaXMueSwgdGhpcy5yYWRpdXMsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XHJcbiAgfSxcclxuICBzZXRSYWRpdXNCeVBlcmNlbnRhZ2U6IGZ1bmN0aW9uIChwZXJjZW50KSB7XHJcbiAgICB0aGlzLnJhZGl1cyA9IE1hdGgubWF4KDAsIE1hdGgubWluKHRoaXMubWF4UmFkaXVzLCBwZXJjZW50ICogdGhpcy5tYXhSYWRpdXMpKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiAgSGFsZnRvbmUgY2xhc3NcclxuICogIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQsIG9wdGlvbmFsbHkgd2l0aCBhIGJhY2tncm91bmQgaW1hZ2UsIHRvIHR1cm4gaW50byB0aGUgdG95XHJcbiAqICBAcGFyYW0ge29iamVjdH0gc2V0dGluZ3MgdGhhdCBjYW4gb3ZlcnJpZGUgREVGQVVMVFMgZGVmaW5lZCBhYm92ZVxyXG4gKlxyXG4gKiAgQG1ldGhvZCBkcmF3KHtwZXJjZW50YWdlIG9mIGFuaW1hdGlvbiBwcm9ncmVzc30pXHJcbiAqICBAbWV0aG9kIGNyZWF0ZUNhbnZhcygpXHJcbiAqICBAbWV0aG9kIHNpemVJbWFnZSgpIC0gZm9yIGludGVybmFsIHVzZVxyXG4gKiAgQG1ldGhvZCBnZXRQZXJjZW50YWdlRnJvbVNjcm9sbCgpIC0gcmV0dXJucyBhIHBlcmNlbnRhZ2Ugb2YgcHJvZ3Jlc3MgcGFzdCBlbGVtZW50IGJhc2VkIG9uIHNjcm9sbGluZ1xyXG4gKiAgQG1ldGhvZCBpbml0KClcclxuICogIEBtZXRob2QgZGVzdHJveSgpXHJcbiAqICBAbWV0aG9kIGFuaW1Jbih7YW5pbWF0aW9uIHRpbWUgaW4gbXN9KVxyXG4gKi9cclxudmFyIEhhbGZ0b25lID0gZnVuY3Rpb24gKGVsZW1lbnQsIHNldHRpbmdzKSB7XHJcbiAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuICB0aGlzLnNldHRpbmdzID0ge307XHJcbiAgc2V0dGluZ3MgPSBzZXR0aW5ncyB8fCB7fTtcclxuICBmb3IgKHZhciBwcm9wIGluIERFRkFVTFRTKSB7XHJcbiAgICB0aGlzLnNldHRpbmdzW3Byb3BdID0gc2V0dGluZ3NbcHJvcF0gIT09IHVuZGVmaW5lZCA/IHNldHRpbmdzW3Byb3BdIDogREVGQVVMVFNbcHJvcF07XHJcbiAgfVxyXG5cclxuICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUodGhpcy5lbGVtZW50KTtcclxuICAvLyBtYWtlIHN1cmUgcG9zaXRpb25pbmcgaXMgdmFsaWRcclxuICBpZiAoY29tcHV0ZWRTdHlsZS5wb3NpdGlvbiA9PT0gJ3N0YXRpYycpIHtcclxuICAgIHRoaXMuZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XHJcbiAgfVxyXG4gIC8vIHNldCB1cCBjb2xvciBhbmQgaW1hZ2VcclxuICB0aGlzLmZpbGwgPSB0aGlzLnNldHRpbmdzLmZpbGwgfHwgY29tcHV0ZWRTdHlsZS5iYWNrZ3JvdW5kQ29sb3I7XHJcbiAgaWYgKCEhY29tcHV0ZWRTdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgJiYgY29tcHV0ZWRTdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgIT09ICdub25lJykge1xyXG4gICAgdGhpcy5pbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgdGhpcy5pbWFnZS5zcmMgPSBjb21wdXRlZFN0eWxlLmJhY2tncm91bmRJbWFnZS5tYXRjaCgvXFwoKD86J3xcIik/KC4rPykoPzonfFwiKT9cXCkvKVsxXTtcclxuICB9XHJcbiAgaWYgKCF0aGlzLnNldHRpbmdzLmZpbGwpXHJcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZCA9ICdub25lJztcclxuXHJcbiAgLy8gbGlzdGVuZXJzXHJcbiAgdmFyIF90aGlzID0gdGhpcztcclxuICB0aGlzLm9uUmVzaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgX3RoaXMuY3JlYXRlQ2FudmFzKCk7XHJcbiAgfVxyXG4gIHRoaXMub25TY3JvbGwgPSBmdW5jdGlvbiAocGVyY2VudGFnZSkge1xyXG4gICAgX3RoaXMuZHJhdyhwZXJjZW50YWdlKTtcclxuICB9XHJcblxyXG4gIC8vIGF1dG9zdGFydFxyXG4gIHRoaXMuaW5pdCgpO1xyXG59XHJcbkhhbGZ0b25lLnByb3RvdHlwZSA9IHtcclxuICBkcmF3OiBmdW5jdGlvbiAocGVyY2VudGFnZSkge1xyXG4gICAgaWYgKCF0aGlzLmNhbnZhcyB8fCAocGVyY2VudGFnZSA8IHRoaXMuc2V0dGluZ3MuaW5FYXNlU3RhcnQgfHwgcGVyY2VudGFnZSA+IHRoaXMuc2V0dGluZ3Mub3V0RWFzZUVuZCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgLy8gY2xlYXIgY3VycmVudCBjcmFwXHJcbiAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwwLHRoaXMuY2FudmFzLndpZHRoLHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICB0aGlzLmN0eC5zYXZlKCk7XHJcbiAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgIC8vIGhhbmRsZSBhbmltYXRpb25cclxuICAgIC8vIGluIHZhcnNcclxuICAgIHZhciBlZmZlY3RpdmVJblBlcmMgPSAocGVyY2VudGFnZSAtIHRoaXMuc2V0dGluZ3MuaW5FYXNlU3RhcnQpIC8gKHRoaXMuc2V0dGluZ3MuaW5FYXNlRW5kIC0gdGhpcy5zZXR0aW5ncy5pbkVhc2VTdGFydCk7XHJcbiAgICBlZmZlY3RpdmVJblBlcmMgPSBlZmZlY3RpdmVJblBlcmMgPCAxID8gdGhpcy5zZXR0aW5ncy5pbkVhc2VGbigtMSwzLGVmZmVjdGl2ZUluUGVyYykgOiAyO1xyXG4gICAgLy8gb3V0IHZhcnNcclxuICAgIHZhciBlZmZlY3RpdmVPdXRQZXJjID0gKHBlcmNlbnRhZ2UgLSB0aGlzLnNldHRpbmdzLm91dEVhc2VTdGFydCkgLyAodGhpcy5zZXR0aW5ncy5vdXRFYXNlRW5kIC0gdGhpcy5zZXR0aW5ncy5vdXRFYXNlU3RhcnQpO1xyXG4gICAgZWZmZWN0aXZlT3V0UGVyYyA9IGVmZmVjdGl2ZU91dFBlcmMgPiAwID8gdGhpcy5zZXR0aW5ncy5vdXRFYXNlRm4oMiwtMyxlZmZlY3RpdmVPdXRQZXJjKSA6IDI7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuZG90cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICB2YXIgZG90SW5QZXJjID0gZWZmZWN0aXZlSW5QZXJjIC0gdGhpcy5kb3RzW2ldLnBlcmNlbnRhZ2U7XHJcbiAgICAgIHZhciBkb3RPdXRQZXJjID0gZWZmZWN0aXZlT3V0UGVyYyAtICgxIC0gdGhpcy5kb3RzW2ldLnBlcmNlbnRhZ2UpO1xyXG4gICAgICB0aGlzLmRvdHNbaV0uc2V0UmFkaXVzQnlQZXJjZW50YWdlKE1hdGgubWluKGRvdEluUGVyYyxkb3RPdXRQZXJjKSk7XHJcbiAgICAgIHRoaXMuZG90c1tpXS5kcmF3KHRoaXMuY3R4KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmN0eC5maWxsKCk7XHJcblxyXG4gICAgaWYgKHRoaXMuaW1hZ2UgJiYgdGhpcy5pbWFnZU9mZnNldHMpIHtcclxuICAgICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJzb3VyY2UtYXRvcFwiO1xyXG4gICAgICB0aGlzLmN0eC5kcmF3SW1hZ2UodGhpcy5pbWFnZSwgdGhpcy5pbWFnZU9mZnNldHMueCwgdGhpcy5pbWFnZU9mZnNldHMueSwgdGhpcy5pbWFnZU9mZnNldHMud2lkdGgsIHRoaXMuaW1hZ2VPZmZzZXRzLmhlaWdodCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmN0eC5yZXN0b3JlKCk7XHJcbiAgfSxcclxuICBjcmVhdGVDYW52YXM6IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIGtpbGwgZXhpc3RpbmcgY2FudmFzXHJcbiAgICBpZiAodGhpcy5jYW52YXMpIHtcclxuICAgICAgdGhpcy5jYW52YXMucmVtb3ZlKCk7XHJcbiAgICB9XHJcbiAgICAvLyBjcmVhdGUgbmV3IGNhbnZhcyBhbmQgZG90c1xyXG4gICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgIHRoaXMuY2FudmFzLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCdjYW52YXMtaGFsZnRvbmUnKTtcclxuICAgIGlmICghdGhpcy5zZXR0aW5ncy5maXhlZCB8fCBnZXRCcmVha3BvaW50KCkgPCAzKSB7XHJcbiAgICAgIC8vIG5vcm1hbCBzaXppbmcgYW5kIHBvc2l0aW9uaW5nXHJcbiAgICAgIHZhciBjb2x1bW5zID0gTWF0aC5mbG9vcih0aGlzLmVsZW1lbnQub2Zmc2V0V2lkdGggLyB0aGlzLnNldHRpbmdzLm1heFJhZGl1cyk7XHJcbiAgICAgIHZhciByb3dzID0gTWF0aC5mbG9vcih0aGlzLmVsZW1lbnQub2Zmc2V0SGVpZ2h0IC8gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMpO1xyXG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5mYWRlKSB7XHJcbiAgICAgICAgY29sdW1ucyArPSAyO1xyXG4gICAgICAgIHJvd3MgKz0gdGhpcy5zZXR0aW5ncy5mYWRlICogMiArIDI7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgaWYgKGNvbHVtbnMgJSAyID09PSAwKVxyXG4gICAgICAgICAgY29sdW1ucyArPSAxO1xyXG4gICAgICAgIGlmIChyb3dzICUgMiA9PT0gMClcclxuICAgICAgICAgIHJvd3MgKz0gMTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIGZpeGVkIHNpemluZyBhbmQgcG9zaXRpb25pbmdcclxuICAgICAgdmFyIGNvbHVtbnMgPSBNYXRoLmZsb29yKHdpbmRvd1NpemUud2lkdGgoKSAvIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzKSArIDI7XHJcbiAgICAgIHZhciByb3dzID0gTWF0aC5mbG9vcih3aW5kb3dTaXplLmhlaWdodCgpIC8gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMpICsgdGhpcy5zZXR0aW5ncy5mYWRlICogMiArIDI7XHJcbiAgICAgIHNldFRyYW5zZm9ybSh0aGlzLmVsZW1lbnQsJ25vbmUnKTtcclxuICAgICAgc2V0VHJhbnNmb3JtKHRoaXMuY2FudmFzLCdub25lJyk7XHJcbiAgICAgIHRoaXMuY2FudmFzLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcclxuICAgICAgdGhpcy5jYW52YXMuc3R5bGUudG9wID0gdGhpcy5zZXR0aW5ncy5mYWRlICogdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMgKiAtMSArICdweCc7XHJcbiAgICAgIHRoaXMuY2FudmFzLnN0eWxlLmxlZnQgPSAwO1xyXG4gICAgfVxyXG4gICAgdGhpcy5jYW52YXMud2lkdGggPSAoY29sdW1ucyAtIDEpICogdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXM7XHJcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSAodGhpcy5zZXR0aW5ncy5mYWRlID8gcm93cyArIDEgOiByb3dzIC0gMSkgKiB0aGlzLnNldHRpbmdzLm1heFJhZGl1cztcclxuICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IHRoaXMuZmlsbDtcclxuICAgIHRoaXMuY29sdW1ucyA9IGNvbHVtbnM7XHJcbiAgICB0aGlzLnJvd3MgPSByb3dzO1xyXG5cclxuICAgIC8vIGNlbnRlciBpbiBjb250YWluZXJcclxuICAgIC8vIGlmICghdGhpcy5zZXR0aW5ncy5maXhlZCB8fCBnZXRCcmVha3BvaW50IDwgMykge1xyXG4gICAgLy8gICB0aGlzLmNhbnZhcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICAvLyAgIHRoaXMuY2FudmFzLnN0eWxlLnRvcCA9ICh0aGlzLmVsZW1lbnQub2Zmc2V0SGVpZ2h0IC0gdGhpcy5jYW52YXMuaGVpZ2h0KSAvIDIgKyAncHgnO1xyXG4gICAgLy8gICB0aGlzLmNhbnZhcy5zdHlsZS5sZWZ0ID0gKHRoaXMuZWxlbWVudC5vZmZzZXRXaWR0aCAtIHRoaXMuY2FudmFzLndpZHRoKSAvIDIgKyAncHgnO1xyXG4gICAgLy8gfVxyXG5cclxuXHJcbiAgICAvLyBkZWZpbmUgdGhlIGRvdHNcclxuICAgIHRoaXMuZG90cyA9IFtdO1xyXG4gICAgZm9yICh2YXIgeSA9IDA7IHkgPCByb3dzOyB5KyspIHtcclxuICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCBjb2x1bW5zOyB4Kz0gMikge1xyXG4gICAgICAgIHZhciByYWQ7XHJcbiAgICAgICAgaWYgKHkgPCB0aGlzLnNldHRpbmdzLmZhZGUpIHtcclxuICAgICAgICAgIHJhZCA9ICh5ICsgMSkgLyAodGhpcy5zZXR0aW5ncy5mYWRlICsgMSkgKiB0aGlzLnNldHRpbmdzLm1heFJhZGl1cztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoeSA+PSByb3dzIC0gdGhpcy5zZXR0aW5ncy5mYWRlKSB7XHJcbiAgICAgICAgICByYWQgPSAtMSAqICh5ICsgMSAtIHJvd3MpIC8gKHRoaXMuc2V0dGluZ3MuZmFkZSArIDEpICogdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCF0aGlzLnNldHRpbmdzLmZhZGUgJiYgeSA9PT0gMCAmJiB4ID09PSAwICYmICF0aGlzLnNldHRpbmdzLmZpeGVkKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMuc2V0dGluZ3MuZmFkZSAmJiB5ID09PSAwICYmIHggPT09IGNvbHVtbnMgLSAxICYmICF0aGlzLnNldHRpbmdzLmZpeGVkKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMuc2V0dGluZ3MuZmFkZSAmJiB5ID09PSByb3dzIC0gMSAmJiB4ID09PSAwICYmICF0aGlzLnNldHRpbmdzLmZpeGVkKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMuc2V0dGluZ3MuZmFkZSAmJiB5ID09PSByb3dzIC0gMSAmJiB4ID09PSBjb2x1bW5zIC0gMSAmJiAhdGhpcy5zZXR0aW5ncy5maXhlZCkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgcmFkID0gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZG90cy5wdXNoKG5ldyBEb3QoeSAlIDIgPyB4ICsgMSA6IHgsIHksIHJhZCwgdGhpcykpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuZWxlbWVudC5jaGlsZHJlbi5sZW5ndGgpIHtcclxuICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZSh0aGlzLmNhbnZhcywgdGhpcy5lbGVtZW50LmNoaWxkcmVuWzBdKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRldGVybWluZSBpbWFnZSBzaXplXHJcbiAgICBpZiAodGhpcy5pbWFnZSkge1xyXG4gICAgICBpZiAodGhpcy5pbWFnZS5jb21wbGV0ZSkge1xyXG4gICAgICAgIHRoaXMuc2l6ZUltYWdlKCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICB0aGlzLmltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIF90aGlzLnNpemVJbWFnZSgpO1xyXG4gICAgICAgICAgX3RoaXMuZHJhdyhfdGhpcy5nZXRQZXJjZW50YWdlRnJvbVNjcm9sbCgpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBlc3RhYmxpc2ggc2Nyb2xsIGJhc2VkIGNvbnRyb2xzIG9ubHkgaWYgc2NyZWVuIGlzIGxhcmdlIGVub3VnaCBmb3IgdXMgdG8gY2FyZVxyXG4gICAgaWYgKGdldEJyZWFrcG9pbnQoKSA+PSAzICYmIHRoaXMuc2V0dGluZ3MuY29udHJvbCA9PT0gJ3Njcm9sbCcpIHtcclxuICAgICAgdGhpcy5zY3JvbGxDb250cm9sbGVyID0gbmV3IFNjcm9sbENvbnRyb2xsZXIodGhpcy5lbGVtZW50LCB0aGlzLm9uU2Nyb2xsKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBpZiAodGhpcy5zY3JvbGxDb250cm9sbGVyKSB7XHJcbiAgICAgICAgdGhpcy5zY3JvbGxDb250cm9sbGVyLmRlc3Ryb3koKTtcclxuICAgICAgICB0aGlzLnNjcm9sbENvbnRyb2xsZXIgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuZHJhdyh0aGlzLmdldFBlcmNlbnRhZ2VGcm9tU2Nyb2xsKCkpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgc2l6ZUltYWdlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBtYWtlIHN1cmUgd2Ugc3VjY2Vzc2Z1bGx5IGxvYWRlZFxyXG4gICAgaWYgKCF0aGlzLmltYWdlLndpZHRoIHx8ICF0aGlzLmltYWdlLmhlaWdodCkge1xyXG4gICAgICB0aGlzLmltYWdlT2Zmc2V0cyA9IG51bGw7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBmaWd1cmUgb3V0IHRoZSBzY2FsZSB0byBtYXRjaCAnY292ZXInIG9yICdjb250YWluJywgYXMgZGVmaW5lZCBieSBzZXR0aW5nc1xyXG4gICAgdmFyIHNjYWxlID0gdGhpcy5jYW52YXMud2lkdGggLyB0aGlzLmltYWdlLndpZHRoO1xyXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuaW1hZ2VTaXppbmcgPT09ICdjb3ZlcicgJiYgc2NhbGUgKiB0aGlzLmltYWdlLmhlaWdodCA8IHRoaXMuY2FudmFzLmhlaWdodCkge1xyXG4gICAgICBzY2FsZSA9IHRoaXMuY2FudmFzLmhlaWdodCAvIHRoaXMuaW1hZ2UuaGVpZ2h0O1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodGhpcy5zZXR0aW5ncy5pbWFnZVNpemluZyA9PT0gJ2NvbnRhaW4nICYmIHNjYWxlICogdGhpcy5pbWFnZS5oZWlnaHQgPiB0aGlzLmNhbnZhcy5oZWlnaHQpIHtcclxuICAgICAgc2NhbGUgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyB0aGlzLmltYWdlLmhlaWdodDtcclxuICAgIH1cclxuICAgIC8vIHNhdmUgdGhlIHgseSx3aWR0aCxoZWlnaHQgb2YgdGhlIHNjYWxlZCBpbWFnZSBzbyBpdCBjYW4gYmUgZWFzaWx5IGRyYXduIHdpdGhvdXQgbWF0aFxyXG4gICAgdGhpcy5pbWFnZU9mZnNldHMgPSB7XHJcbiAgICAgIHg6ICh0aGlzLmNhbnZhcy53aWR0aCAtIHRoaXMuaW1hZ2Uud2lkdGggKiBzY2FsZSkgLyAyLFxyXG4gICAgICB5OiAodGhpcy5jYW52YXMuaGVpZ2h0IC0gdGhpcy5pbWFnZS5oZWlnaHQgKiBzY2FsZSkgLyAyLFxyXG4gICAgICB3aWR0aDogdGhpcy5pbWFnZS53aWR0aCAqIHNjYWxlLFxyXG4gICAgICBoZWlnaHQ6IHRoaXMuaW1hZ2UuaGVpZ2h0ICogc2NhbGVcclxuICAgIH1cclxuICB9LFxyXG4gIGdldFBlcmNlbnRhZ2VGcm9tU2Nyb2xsOiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zY3JvbGxDb250cm9sbGVyID8gdGhpcy5zY3JvbGxDb250cm9sbGVyLmdldFBlcmNlbnRhZ2UoKSA6IC41NTtcclxuICB9LFxyXG4gIGluaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIG1ha2UgdGhlIGNhbnZhc1xyXG4gICAgdGhpcy5jcmVhdGVDYW52YXMoKTtcclxuXHJcbiAgICAvLyBzY3JvbGwgbGlzdGVuZXIgYWRkZWQgaW4gY3JlYXRlQ2FudmFzIGZuXHJcblxyXG4gICAgLy8gbGlzdGVuIGZvciByZXNpemVcclxuICAgIGxvb3AuYWRkUmVzaXplRnVuY3Rpb24odGhpcy5vblJlc2l6ZSk7XHJcbiAgfSxcclxuICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAodGhpcy5zY3JvbGxDb250cm9sbGVyKVxyXG4gICAgICB0aGlzLnNjcm9sbENvbnRyb2xsZXIuZGVzdHJveSgpO1xyXG4gICAgbG9vcC5yZW1vdmVGdW5jdGlvbih0aGlzLm9uUmVzaXplKTtcclxuICAgIHRoaXMuY2FudmFzLnJlbW92ZSgpO1xyXG4gICAgZGVsZXRlIHRoaXM7XHJcbiAgfSxcclxuICBhbmltOiBmdW5jdGlvbiAoc3RhcnRQZXJjLCBlbmRQZXJjLCB0aW1lLCBlYXNlLCBjYikge1xyXG4gICAgLy8gZmlyc3QsIHR1cm4gb2ZmIHNjcm9sbCBsaXN0ZW5pbmdcclxuICAgIGlmICh0aGlzLnNjcm9sbENvbnRyb2xsZXIpXHJcbiAgICAgIHRoaXMuc2Nyb2xsQ29udHJvbGxlci5kaXNhYmxlKCk7XHJcbiAgICAvLyBlc3RhYmxpc2ggZGVmYXVsdHNcclxuICAgIHN0YXJ0UGVyYyA9IHN0YXJ0UGVyYyB8fCAwO1xyXG4gICAgZW5kUGVyYyA9ICFpc05hTihlbmRQZXJjKSA/IGVuZFBlcmMgOiAxO1xyXG4gICAgdGltZSA9IHRpbWUgfHwgMTAwMDtcclxuICAgIGVhc2UgPSBlYXNlIHx8IGVhc2VzLmVhc2VJbk91dDtcclxuICAgIC8vIGdldCBzb21lIGJhc2UgdmFyc1xyXG4gICAgdmFyIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgdmFyIGRlbHRhUGVyYyA9IGVuZFBlcmMgLSBzdGFydFBlcmM7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgdmFyIHJ1bm5pbmcgPSB0cnVlO1xyXG4gICAgLy8gdGhpcyBnb2VzIGluIHRoZSBsb29wXHJcbiAgICB2YXIgYW5pbWF0aW9uRm4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGlmIChydW5uaW5nKSB7XHJcbiAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgIHZhciBkZWx0YVRpbWUgPSAobm93IC0gc3RhcnRUaW1lKSAvIHRpbWU7XHJcbiAgICAgICAgaWYgKGRlbHRhVGltZSA8IDEpXHJcbiAgICAgICAgICBfdGhpcy5kcmF3KGVhc2Uoc3RhcnRQZXJjLGRlbHRhUGVyYyxkZWx0YVRpbWUpKTtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcclxuICAgICAgICAgIF90aGlzLmRyYXcoZW5kUGVyYyk7XHJcbiAgICAgICAgICBpZiAoX3RoaXMuc2Nyb2xsQ29udHJvbGxlcilcclxuICAgICAgICAgICAgX3RoaXMuc2Nyb2xsQ29udHJvbGxlci5lbmFibGUoKTtcclxuICAgICAgICAgIC8vIGdldCBiYWNrIG91dCBvZiB0aGUgbG9vcFxyXG4gICAgICAgICAgbG9vcC5yZW1vdmVGdW5jdGlvbihhbmltYXRpb25Gbik7XHJcbiAgICAgICAgICBpZiAoY2IpXHJcbiAgICAgICAgICAgIGNiKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBsb29wLmFkZEZ1bmN0aW9uKGFuaW1hdGlvbkZuKTtcclxuICB9LFxyXG4gIGFuaW1JbjogZnVuY3Rpb24gKHRpbWUsIGNiKSB7XHJcbiAgICAvLyBhbmltYXRlIHRoZSBjYW52YXMgZnJvbSBpbkVhc2VTdGFydCB0byBjdXJyZW50IHNjcm9sbCBwb3NcclxuICAgIC8vIGNoZWNrIGlmIHdlIGV2ZW4gbmVlZCB0b1xyXG4gICAgdmFyIGVuZFBlcmMgPSB0aGlzLmdldFBlcmNlbnRhZ2VGcm9tU2Nyb2xsKCk7XHJcbiAgICBpZiAoZW5kUGVyYyA8IHRoaXMuc2V0dGluZ3MuaW5FYXNlU3RhcnQpXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICB0aGlzLmFuaW0odGhpcy5zZXR0aW5ncy5pbkVhc2VTdGFydCwgZW5kUGVyYywgdGltZSwgZWFzZXMuZWFzZU91dCwgY2IpO1xyXG4gIH0sXHJcbiAgYW5pbU91dDogZnVuY3Rpb24gKHRpbWUsIGNiKSB7XHJcbiAgICAvLyBhbmltYXRlIHRoZSBjYW52YXMgZnJvbSBpbkVhc2VTdGFydCB0byBjdXJyZW50IHNjcm9sbCBwb3NcclxuICAgIC8vIGNoZWNrIGlmIHdlIGV2ZW4gbmVlZCB0b1xyXG4gICAgdmFyIHN0YXJ0UGVyYyA9IHRoaXMuZ2V0UGVyY2VudGFnZUZyb21TY3JvbGwoKTtcclxuICAgIGlmIChzdGFydFBlcmMgPCB0aGlzLnNldHRpbmdzLmluRWFzZVN0YXJ0KVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgdGhpcy5hbmltKHN0YXJ0UGVyYywgdGhpcy5zZXR0aW5ncy5pbkVhc2VTdGFydCwgdGltZSwgZWFzZXMuZWFzZUluLCBjYik7XHJcbiAgfVxyXG59XHJcblxyXG4vLyB0ZW1wIGF1dG8gaW5pdFxyXG4vLyB2YXIgaHRyRWxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmhhbGZ0b25lJyk7XHJcbi8vIHZhciBodHJzID0gW107XHJcbi8vIGZvciAodmFyIGkgPSAwLCBsZW4gPSBodHJFbHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuLy8gICBodHJzLnB1c2gobmV3IEhhbGZ0b25lKGh0ckVsc1tpXSwgeyBmYWRlOiAxMiwgZml4ZWQ6IGZhbHNlIH0pKTtcclxuLy8gfVxyXG4vLyB3aW5kb3cuaHRycyA9IGh0cnM7XHJcbm1vZHVsZS5leHBvcnRzID0gSGFsZnRvbmU7XHJcbiIsIi8qKlxuICogIHNjcmlwdHMuanNcbiAqICBUaGlzIHNob3VsZCBpbmNsdWRlIG9iamVjdHMsIHdoaWNoIGluIHR1cm4gaW5jbHVkZSB0aGUgbGliIGZpbGVzIHRoZXkgbmVlZC5cbiAqICBUaGlzIGtlZXBzIHVzIHVzaW5nIGEgbW9kdWxhciBhcHByb2FjaCB0byBkZXYgd2hpbGUgYWxzbyBvbmx5IGluY2x1ZGluZyB0aGVcbiAqICBwYXJ0cyBvZiB0aGUgbGlicmFyeSB3ZSBuZWVkLlxuICovXG4vLyBvYmplY3RzXG5yZXF1aXJlKCdvYmplY3RzL2FydGljbGUnKTtcbiJdfQ==
