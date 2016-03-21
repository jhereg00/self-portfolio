(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 *  Animates window scroll to an element or scrollY
 */

// requirements
var loop = require('lib/loop');
var getPageOffset = require('lib/getPageOffset');
var getScrollPos = require('lib/getScrollPos');
var eases = require('lib/ease');

// settings
var defaultOffsetTop = 48;
var defaultAnimTime = 1000;
var animTime;

// do things!
/**
 *  the function that goes in the loop
 */
var startTime, startPos, endPos;
var animFn = function () {
  var now = new Date().getTime();
  if (now - startTime < animTime)
    window.scrollTo(0, eases.easeInOut(startPos, endPos - startPos, (now - startTime) / animTime));
  else {
    window.scrollTo(0, endPos);
    loop.removeFunction(animFn);
  }
}

/**
 *  Scroll to element or number
 *  @param {HTMLElement or string(id of element) or number}
 *  [@param {number}] position to start scrolling from
 *  [@param {boolean}] pass false to skip animation
 *  [@param {number}] time for animation
 *  [@param {number}] offset from top
 */
var scrollTo = function (dest, scrollPos, anim, time, offset) {
  if (typeof dest === 'string') {
    dest = document.getElementById(dest.replace('#',''));
  }
  if (typeof dest !== 'number') {
    try {
      dest = getPageOffset(dest).top - (isNaN(offset) ? defaultOffsetTop : offset);
    } catch (err) {
      return false;
    }
  }

  loop.removeFunction(animFn);
  if (anim !== false) {
    startPos = scrollPos || getScrollPos();
    endPos = dest;
    startTime = new Date().getTime();
    animTime = time || defaultAnimTime;

    loop.addFunction(animFn);
  }
  else {
    window.scrollTo(0, dest);
  }

  return true;
}

module.exports = scrollTo;

},{"lib/ease":3,"lib/getPageOffset":4,"lib/getScrollPos":5,"lib/loop":7}],2:[function(require,module,exports){
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

},{"lib/getWindowSize":6}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{"lib/getScrollPos":5}],8:[function(require,module,exports){
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

},{"lib/getPageOffset":4,"lib/getScrollPos":5,"lib/getWindowSize":6,"lib/loop":7}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
/**
 *  Full Article controller
 */

// requirements
var Halftone = require('objects/halftone');
var ScrollController = require('lib/scrollController');
var getScrollPos = require('lib/getScrollPos');
var getBreakpoint = require('lib/breakpoints');
var eases = require('lib/ease');

// settings
var HEADER_HALFTONE_SETTINGS = {
  fade: getBreakpoint() >= 2 ? 12 : 1,
  inEaseStart: .1
}
var INNER_HALFTONE_SETTINGS = {
  fade: 0,
  imageSizing: 'contain',
  inEaseStart: .1, // scroll percentage to start animation in on first dot
  inEaseEnd: .5, // scroll percentage to end animation in on last dot
  outEaseStart: .75,
  cornering: 8,
  maxRadius: 12
}
var RELATED_HALFTONE_SETTINGS = {
  fade: 0,
  inEaseStart: -.4,
  inEaseEnd: .8,
  inEaseFn: eases.linear,
  outEaseStart: .6,
  outEaseEnd: 1.2,
  maxRadius: 12
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
    //this.header.animIn(1200);
    window.header = this.header;
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
var articleEl = document.querySelector('.article');
if (articleEl)
  new Article(document.querySelector('.article'));

},{"lib/breakpoints":2,"lib/ease":3,"lib/getScrollPos":5,"lib/scrollController":8,"objects/halftone":12}],11:[function(require,module,exports){
// requirements
var Halftone = require('objects/halftone');
var eases = require('lib/ease');

// settings

// init footer halftone
var footerHalftoneEl = document.querySelector('.footer-main__halftone');
if (footerHalftoneEl) {
  var footerHalftone = new Halftone (footerHalftoneEl, {
    fade: 12,
    maxRadius: 15,
    inEaseStart: -.25,
    inEaseEnd: .1,
    inEaseFn: eases.linear,
    outEaseStart: 1,
    outEaseEnd: 1
  });
}

},{"lib/ease":3,"objects/halftone":12}],12:[function(require,module,exports){
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
  outEaseEnd: 1.1, // scroll percentage to end animation out on last dot
  fixed: false, // fixed position and full screen?
  imageSizing: 'cover', // 'cover' or 'contain'
  cornering: 0, // diagnal top left fade
  control: 'scroll', // 'scroll', 'mouse' (TODO), or 'none'
  fill: null, // optionally override fill color
  initialDrawPercentage: .55, // percentage to draw right away
  minBreakpoint: 0 // minimum breakpoint that canvas can exist
}
var BREAKPOINT_FOR_SCROLL_CONTROL = 2;

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
    if (this.radius > .5) {
      ctx.moveTo(this.x, this.y - this.radius);
      ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    }
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
var Halftone = function (element, settings, dotSizeImage) {
  var _this = this;
  this.element = element;
  this.settings = {};
  settings = settings || {};
  for (var prop in DEFAULTS) {
    this.settings[prop] = settings[prop] !== undefined ? settings[prop] : DEFAULTS[prop];
  }

  if (dotSizeImage) {
    this.dotSizeImage = new Image();
    this.dotSizeImage.src = dotSizeImage;
    this.dotSizeImage.onload = function () {
      _this.sizeDotsByImage();
      _this.lastDrawnPercentage = null;
      _this.draw(_this.getPercentageFromScroll());
    }
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
    // round to .1%
    percentage = Math.round(percentage * 1000) / 1000;

    // should we bother?
    if (!this.canvas || percentage == this.lastDrawnPercentage || (percentage < this.settings.inEaseStart || percentage > this.settings.outEaseEnd)) {
      return false;
    }

      console.log('draw');

    // clear current crap
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

    // have to do the maths
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

    this.lastDrawnPercentage = percentage;
  },
  createCanvas: function () {
    if (getBreakpoint() < this.settings.minBreakpoint) {
      console.log('too small!', this.canvas);
      // we want no canvas!
      if (this.canvas) {
        this.canvas.remove();
        this.canvas = null;
      }
      return false;
    }

    // good to actually make the thing
    var _this = this;
    function addCanvas () {
      if (_this.element.children.length) {
        _this.element.insertBefore(_this.canvas, _this.element.children[0]);
      }
      else {
        _this.element.appendChild(_this.canvas);
      }
    }
    function enableCanvas () {
      // establish scroll based controls only if screen is large enough for us to care
      if (getBreakpoint() >= BREAKPOINT_FOR_SCROLL_CONTROL && _this.settings.control === 'scroll') {
        _this.scrollController = new ScrollController(_this.element, _this.onScroll);
      }
      else {
        if (_this.scrollController) {
          _this.scrollController.destroy();
          _this.scrollController = null;
        }
        _this.draw(_this.getPercentageFromScroll());
      }
    }

    // kill existing canvas
    this.lastDrawnPercentage = null;
    var lastCanvas;
    if (this.canvas) {
      lastCanvas = this.canvas;
    }

    // create new canvas and dots
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('class','canvas-halftone');
    if (!this.settings.fixed || getBreakpoint() < BREAKPOINT_FOR_SCROLL_CONTROL) {
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
      this.canvas.style.top = this.settings.fade * this.settings.maxRadius * -1 - (this.settings.maxRadius) + 'px';
      this.canvas.style.left = 0;
    }
    this.canvas.width = (columns - 1) * this.settings.maxRadius;
    this.canvas.height = (this.settings.fade ? rows + 1 : rows - 1) * this.settings.maxRadius;

    // check that we even need to do this shit
    if (lastCanvas && lastCanvas.width === this.canvas.width && lastCanvas.height === this.canvas.height) {
      // stop remaking, it's the same!
      this.canvas = lastCanvas;
      //addCanvas();
      enableCanvas();
      return;
    }
    else if (lastCanvas) {
      lastCanvas.remove();
    }

    // set the context
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

    if (this.element.children.length) {
      this.element.insertBefore(this.canvas, this.element.children[0]);
    }
    else {
      this.element.appendChild(this.canvas);
    }

    // determine image size
    if (this.image) {
      if (this.image.complete) {
        this.imageOffsets = this.sizeImage(this.image);
      }
      else {
        var _this = this;
        this.image.onload = function () {
          _this.imageOffsets = _this.sizeImage(_this.image);
          _this.lastDrawnPercentage = null;
          _this.draw(_this.getPercentageFromScroll());
        }
      }
    }

    if (this.dotSizeImage && this.dotSizeImage.complete) {
      this.sizeDotsByImage();
    }

    enableCanvas();
  },
  sizeImage: function (image) {
    // make sure we successfully loaded
    if (!image || !image.width || !image.height) {
      return false;
    }

    // figure out the scale to match 'cover' or 'contain', as defined by settings
    var scale = this.canvas.width / image.width;
    if (this.settings.imageSizing === 'cover' && scale * image.height < this.canvas.height) {
      scale = this.canvas.height / image.height;
    }
    else if (this.settings.imageSizing === 'contain' && scale * image.height > this.canvas.height) {
      scale = this.canvas.height / image.height;
    }
    // save the x,y,width,height of the scaled image so it can be easily drawn without math
    return {
      x: (this.canvas.width - image.width * scale) / 2,
      y: (this.canvas.height - image.height * scale) / 2,
      width: image.width * scale,
      height: image.height * scale
    }
  },
  sizeDotsByImage: function () {
    // first, figure out how to size the image for the canvas
    var dotsImageOffsets = this.sizeImage(this.dotSizeImage);
    if (!dotsImageOffsets) {
      return;
    }

    var tempCan = document.createElement('canvas');
    tempCan.width = this.canvas.width;
    tempCan.height = this.canvas.height;
    var tempCanCtx = tempCan.getContext('2d');
    tempCanCtx.fillStyle = 'white';
    tempCanCtx.fillRect(0, 0, tempCan.width, tempCan.height);
    tempCanCtx.drawImage(this.dotSizeImage, dotsImageOffsets.x, dotsImageOffsets.y, dotsImageOffsets.width, dotsImageOffsets.height);

    for (var i = this.dots.length - 1; i >= 0; i--) {
      var imgData = tempCanCtx.getImageData(this.dots[i].x - this.settings.maxRadius, this.dots[i].y - this.settings.maxRadius, this.settings.maxRadius * 2, this.settings.maxRadius * 2);
      //console.log(this.dots[i].x - this.settings.maxRadius, this.dots[i].y - this.settings.maxRadius, this.settings.maxRadius * 2, this.settings.maxRadius * 2);
      // only getting red, because image should be greyscale anyway
      var averageRed = 0;
      for (var j = 0, jLen = imgData.data.length; j < jLen; j += 4) {
        var opacityAdd = (255 - imgData.data[j]) * ((255 - imgData.data[j + 3]) / 255);
        averageRed += imgData.data[j] + opacityAdd;
        // if (j < 400)
        //   console.log(imgData.data[j], opacityAdd, imgData.data[j] + opacityAdd);
      }
      averageRed /= (imgData.data.length / 4);

      this.dots[i].maxRadius = this.dots[i].maxRadius * ((255 - averageRed) / 255);
      // remove this dot if it will never show
      if (this.dots[i].maxRadius < .5) {
        this.dots.splice(i,1);
      }
    }
  },
  getPercentageFromScroll: function () {
    return (this.scrollController && getBreakpoint() >= BREAKPOINT_FOR_SCROLL_CONTROL) ? this.scrollController.getPercentage() : this.settings.initialDrawPercentage;
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

},{"lib/breakpoints":2,"lib/ease":3,"lib/getWindowSize":6,"lib/loop":7,"lib/scrollController":8,"lib/setTransform":9}],13:[function(require,module,exports){
/**
 *  controls illustrations
 */
// requirements
var Halftone = require('objects/halftone');
var eases = require('lib/ease');

// settings
var ILLUSTRATION_HALFTONE_SETTINGS = {
  fade: 0,
  fixed: true,
  inEaseStart: 0,
  inEaseEnd: .45,
  inEaseFn: eases.linear,
  outEaseStart: .55,
  outEaseEnd: 1,
  imageSizing: 'contain',
  minBreakpoint: 2
};

/**
 *  Illustration object
 *  @param {HTMLElement}
 */
var Illustration = function (element) {
  this.element = element;
  this.image = element.querySelector('.illustration__image');
  this.halftone = new Halftone(this.image, ILLUSTRATION_HALFTONE_SETTINGS);
}

// init
var illustrationEls = document.querySelectorAll('.illustration');
for (var i = 0, len = illustrationEls.length; i < len; i++) {
  new Illustration(illustrationEls[i]);
}

},{"lib/ease":3,"objects/halftone":12}],14:[function(require,module,exports){
/**
 *  The My Titles toy
 */
// requirements
var Halftone = require('objects/halftone');
var eases = require('lib/ease');
var windowSize = require('lib/getWindowSize');

// settings
var HALFTONE_SETTINGS = {
  inEaseFn: eases.easeOut,
  inEaseStart: -.1,
  inEaseEnd: .5,
  outEaseFn: eases.easeIn,
  outEaseStart: .5,
  outEaseEnd: 1.1,
  fade: 1,
  fill: '#011C1F',
  maxRadius: 9,
  control: 'none',
  initialDrawPercentage: 0
}
var ANIM_TIME = 10000;

/**
 *  MyTitles
 *  @param {HTMLElement}
 */
var MyTitles = function (element) {
  this.element = element;

  this.halftones = [];
  this.halftones.push(new Halftone(element, HALFTONE_SETTINGS, '/images/dotsize-musician.jpg'));
  this.halftones.push(new Halftone(element, HALFTONE_SETTINGS, '/images/dotsize-goalie.jpg'));
  this.halftones.push(new Halftone(element, HALFTONE_SETTINGS, '/images/dotsize-geek.jpg'));
  // for (var i = 0, len = this.halftones.length; i < len; i++) {
  //   this.halftones[i].draw(0);
  // }
  var index = -1;
  var _this = this;
  function animNext () {
    index = (index + 1) % _this.halftones.length;
    //console.log(index);
    _this.halftones[index].anim(0,1,ANIM_TIME,eases.linear);
  }
  //this.halftones[0].anim(.5,1,ANIM_TIME / 2,eases.linear);
  animNext();
  window.setInterval(animNext,ANIM_TIME * .8);
}

var myTitlesEls = document.querySelectorAll('.my-titles');
for (var i = 0, len = myTitlesEls.length; i < len; i++) {
  new MyTitles(myTitlesEls[i]);
}

},{"lib/ease":3,"lib/getWindowSize":6,"objects/halftone":12}],15:[function(require,module,exports){
/**
 *  Scrolls the screen to the top of .header-main on load if pageType is defined
 */
// requirements
var getScrollPos = require('lib/getScrollPos');
var animateScrollTo = require('lib/animateScrollTo');

// do it right away
var headerMain = document.querySelector('.header-main');
var pageType = document.body.getAttribute('data-page-type');

if (pageType && pageType !== 'index' && headerMain) {
  window.setTimeout(function () {
    if (getScrollPos() < 50)
      animateScrollTo(headerMain, null, null, 600, 0);
  }, window.sessionStorage.getItem('seenNav') ? 100 : 600);
  window.sessionStorage.setItem('seenNav',true);
}

},{"lib/animateScrollTo":1,"lib/getScrollPos":5}],16:[function(require,module,exports){
/**
 *  scripts.js
 *  This should include objects, which in turn include the lib files they need.
 *  This keeps us using a modular approach to dev while also only including the
 *  parts of the library we need.
 */
// objects
require('objects/scrollOnLoad');
require('objects/article');
require('objects/illustration');
require('objects/footer');
require('objects/myTitles');

},{"objects/article":10,"objects/footer":11,"objects/illustration":13,"objects/myTitles":14,"objects/scrollOnLoad":15}]},{},[16])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYW5pbWF0ZVNjcm9sbFRvLmpzIiwibGliL2JyZWFrcG9pbnRzLmpzIiwibGliL2Vhc2UuanMiLCJsaWIvZ2V0UGFnZU9mZnNldC5qcyIsImxpYi9nZXRTY3JvbGxQb3MuanMiLCJsaWIvZ2V0V2luZG93U2l6ZS5qcyIsImxpYi9sb29wLmpzIiwibGliL3Njcm9sbENvbnRyb2xsZXIuanMiLCJsaWIvc2V0VHJhbnNmb3JtLmpzIiwib2JqZWN0cy9hcnRpY2xlLmpzIiwib2JqZWN0cy9mb290ZXIuanMiLCJvYmplY3RzL2hhbGZ0b25lLmpzIiwib2JqZWN0cy9pbGx1c3RyYXRpb24uanMiLCJvYmplY3RzL215VGl0bGVzLmpzIiwib2JqZWN0cy9zY3JvbGxPbkxvYWQuanMiLCJzY3JpcHRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25kQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiAgQW5pbWF0ZXMgd2luZG93IHNjcm9sbCB0byBhbiBlbGVtZW50IG9yIHNjcm9sbFlcbiAqL1xuXG4vLyByZXF1aXJlbWVudHNcbnZhciBsb29wID0gcmVxdWlyZSgnbGliL2xvb3AnKTtcbnZhciBnZXRQYWdlT2Zmc2V0ID0gcmVxdWlyZSgnbGliL2dldFBhZ2VPZmZzZXQnKTtcbnZhciBnZXRTY3JvbGxQb3MgPSByZXF1aXJlKCdsaWIvZ2V0U2Nyb2xsUG9zJyk7XG52YXIgZWFzZXMgPSByZXF1aXJlKCdsaWIvZWFzZScpO1xuXG4vLyBzZXR0aW5nc1xudmFyIGRlZmF1bHRPZmZzZXRUb3AgPSA0ODtcbnZhciBkZWZhdWx0QW5pbVRpbWUgPSAxMDAwO1xudmFyIGFuaW1UaW1lO1xuXG4vLyBkbyB0aGluZ3MhXG4vKipcbiAqICB0aGUgZnVuY3Rpb24gdGhhdCBnb2VzIGluIHRoZSBsb29wXG4gKi9cbnZhciBzdGFydFRpbWUsIHN0YXJ0UG9zLCBlbmRQb3M7XG52YXIgYW5pbUZuID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIGlmIChub3cgLSBzdGFydFRpbWUgPCBhbmltVGltZSlcbiAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgZWFzZXMuZWFzZUluT3V0KHN0YXJ0UG9zLCBlbmRQb3MgLSBzdGFydFBvcywgKG5vdyAtIHN0YXJ0VGltZSkgLyBhbmltVGltZSkpO1xuICBlbHNlIHtcbiAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgZW5kUG9zKTtcbiAgICBsb29wLnJlbW92ZUZ1bmN0aW9uKGFuaW1Gbik7XG4gIH1cbn1cblxuLyoqXG4gKiAgU2Nyb2xsIHRvIGVsZW1lbnQgb3IgbnVtYmVyXG4gKiAgQHBhcmFtIHtIVE1MRWxlbWVudCBvciBzdHJpbmcoaWQgb2YgZWxlbWVudCkgb3IgbnVtYmVyfVxuICogIFtAcGFyYW0ge251bWJlcn1dIHBvc2l0aW9uIHRvIHN0YXJ0IHNjcm9sbGluZyBmcm9tXG4gKiAgW0BwYXJhbSB7Ym9vbGVhbn1dIHBhc3MgZmFsc2UgdG8gc2tpcCBhbmltYXRpb25cbiAqICBbQHBhcmFtIHtudW1iZXJ9XSB0aW1lIGZvciBhbmltYXRpb25cbiAqICBbQHBhcmFtIHtudW1iZXJ9XSBvZmZzZXQgZnJvbSB0b3BcbiAqL1xudmFyIHNjcm9sbFRvID0gZnVuY3Rpb24gKGRlc3QsIHNjcm9sbFBvcywgYW5pbSwgdGltZSwgb2Zmc2V0KSB7XG4gIGlmICh0eXBlb2YgZGVzdCA9PT0gJ3N0cmluZycpIHtcbiAgICBkZXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVzdC5yZXBsYWNlKCcjJywnJykpO1xuICB9XG4gIGlmICh0eXBlb2YgZGVzdCAhPT0gJ251bWJlcicpIHtcbiAgICB0cnkge1xuICAgICAgZGVzdCA9IGdldFBhZ2VPZmZzZXQoZGVzdCkudG9wIC0gKGlzTmFOKG9mZnNldCkgPyBkZWZhdWx0T2Zmc2V0VG9wIDogb2Zmc2V0KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBsb29wLnJlbW92ZUZ1bmN0aW9uKGFuaW1Gbik7XG4gIGlmIChhbmltICE9PSBmYWxzZSkge1xuICAgIHN0YXJ0UG9zID0gc2Nyb2xsUG9zIHx8IGdldFNjcm9sbFBvcygpO1xuICAgIGVuZFBvcyA9IGRlc3Q7XG4gICAgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgYW5pbVRpbWUgPSB0aW1lIHx8IGRlZmF1bHRBbmltVGltZTtcblxuICAgIGxvb3AuYWRkRnVuY3Rpb24oYW5pbUZuKTtcbiAgfVxuICBlbHNlIHtcbiAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgZGVzdCk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzY3JvbGxUbztcbiIsInZhciBicHMgPSBbNzIwLDk2MCwxMjAwLDE2ODBdO1xuXG52YXIgd2luZG93U2l6ZSA9IHJlcXVpcmUoJ2xpYi9nZXRXaW5kb3dTaXplJyk7XG5cbnZhciBnZXRCcmVha3BvaW50ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc2l6ZSA9IHdpbmRvd1NpemUud2lkdGgoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBicHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYnBzW2ldID4gc2l6ZSlcbiAgICAgIHJldHVybiBpO1xuICB9XG4gIHJldHVybiBicHMubGVuZ3RoO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldEJyZWFrcG9pbnQ7XG4iLCIvLyBhIGJ1bmNoIG9mIGVhc2luZyBmdW5jdGlvbnMgZm9yIG1ha2luZyBhbmltYXRpb25zXG4vLyBhbGwgYWNjZXB0IHN0YXJ0LCBjaGFuZ2UsIGFuZCBwZXJjZW50XG5cbnZhciBlYXNlcyA9IHtcbiAgJ2Vhc2VJbk91dCcgOiBmdW5jdGlvbiAocyxjLHApIHtcbiAgICBpZiAocCA8IC41KSB7XG4gICAgICByZXR1cm4gcyArIGMgKiAoMiAqIHAgKiBwKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gcyArIGMgKiAoLTIgKiAocCAtIDEpICogKHAgLSAxKSArIDEpO1xuICAgIH1cbiAgfSxcbiAgJ2Vhc2VJbicgOiBmdW5jdGlvbiAocyxjLHApIHtcbiAgICByZXR1cm4gcyArIGMgKiBwICogcDtcbiAgfSxcbiAgJ2Vhc2VJbkN1YmljJyA6IGZ1bmN0aW9uIChzLGMscCkge1xuICAgIHJldHVybiBzICsgYyAqIChwICogcCAqIHApO1xuICB9LFxuICAnZWFzZU91dCcgOiBmdW5jdGlvbiAocyxjLHApIHtcbiAgICByZXR1cm4gcyArIGMgKiAoLTEgKiAocCAtIDEpICogKHAgLSAxKSArIDEpO1xuICB9LFxuICAnZWFzZU91dEN1YmljJyA6IGZ1bmN0aW9uIChzLGMscCkge1xuICAgIHJldHVybiBzICsgYyAqICgocCAtIDEpICogKHAgLSAxKSAqIChwIC0gMSkgKyAxKTtcbiAgfSxcbiAgJ2xpbmVhcicgOiBmdW5jdGlvbiAocyxjLHApIHtcbiAgICByZXR1cm4gcyArIGMgKiBwO1xuICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IGVhc2VzO1xuIiwiLyoqXG4gKiAgRnVuY3Rpb246IG9zLmdldFBhZ2VPZmZzZXRcbiAqICBnZXRzIHRoZSBwYWdlIG9mZnNldCB0b3AgYW5kIGxlZnQgb2YgYSBET00gZWxlbWVudFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldFBhZ2VPZmZzZXQgKGVsZW1lbnQpIHtcbiAgaWYgKCFlbGVtZW50KSB7XG4gICAgY29uc29sZS5lcnJvcignZ2V0UGFnZU9mZnNldCBwYXNzZWQgYW4gaW52YWxpZCBlbGVtZW50OicsIGVsZW1lbnQpO1xuICB9XG4gIHZhciBwYWdlT2Zmc2V0WCA9IGVsZW1lbnQub2Zmc2V0TGVmdCxcbiAgcGFnZU9mZnNldFkgPSBlbGVtZW50Lm9mZnNldFRvcDtcblxuICB3aGlsZSAoZWxlbWVudCA9IGVsZW1lbnQub2Zmc2V0UGFyZW50KSB7XG4gICAgcGFnZU9mZnNldFggKz0gZWxlbWVudC5vZmZzZXRMZWZ0O1xuICAgIHBhZ2VPZmZzZXRZICs9IGVsZW1lbnQub2Zmc2V0VG9wO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBsZWZ0IDogcGFnZU9mZnNldFgsXG4gICAgdG9wIDogcGFnZU9mZnNldFlcbiAgfVxufVxuIiwiLyoqXG4gKiAgZ2V0U2Nyb2xsUG9zXG4gKlxuICogIGNyb3NzIGJyb3dzZXIgd2F5IHRvIGdldCBzY3JvbGxUb3BcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKHVuZGVmaW5lZCkge1xuICBpZiAod2luZG93LnNjcm9sbFkgIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0U2Nyb2xsUG9zICgpIHsgcmV0dXJuIHdpbmRvdy5zY3JvbGxZOyB9XG4gIGVsc2VcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0U2Nyb2xsUG9zICgpIHsgcmV0dXJuIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3A7IH1cbn0pKCk7XG4iLCIvKipcbiAqICBnZXQgd2luZG93IHNpemUsIGNyb3NzIGJyb3dzZXIgZnJpZW5kbHlcbiAqICBjYWxsIC53aWR0aCgpIG9yIC5oZWlnaHQoKSB0byBnZXQgdGhlIHJlbGV2YW50IHZhbHVlIGluIHBpeGVsc1xuICovXG52YXIgd2luZG93SGVpZ2h0ID0gZnVuY3Rpb24gd2luZG93SGVpZ2h0ICgpIHtcbiAgcmV0dXJuIHdpbmRvdy5pbm5lckhlaWdodCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xufTtcbnZhciB3aW5kb3dXaWR0aCA9IGZ1bmN0aW9uIHdpbmRvd1dpZHRoICgpIHtcbiAgcmV0dXJuIHdpbmRvdy5pbm5lcldpZHRoIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB3aWR0aDogd2luZG93V2lkdGgsXG4gIGhlaWdodDogd2luZG93SGVpZ2h0XG59XG4iLCIvKipcbiAqICBMb29wXG4gKlxuICogIFRoZSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgTG9vcC4gSXQgaGFuZGxlcyBhbmltYXRpb24gYW5kIHN0YXRlIGNoYW5nZXNcbiAqICByZWxhdGVkIHRvIHNjcm9sbGluZyBvciB3aW5kb3cgc2l6aW5nLiBJdCBjYW4gYWxzbyBiZSB1c2VkIGZvciByZWd1bGFyIGpzXG4gKiAgZHJpdmVuIGFuaW1hdGlvbiBhcyB3ZWxsLlxuICpcbiAqICBUbyB1c2U6XG4gKiAgICBleHBvcnRzLmFkZFNjcm9sbEZ1bmN0aW9uKGZuKSAtIGFkZHMgYSBmdW5jdGlvbiB0byBmaXJlIHdoZW5ldmVyIHNjcm9sbFxuICogICAgICBwb3NpdGlvbiBjaGFuZ2VzXG4gKiAgICBleHBvcnRzLmFkZFJlc2l6ZUZ1bmN0aW9uKGZuKSAtIGFkZHMgYSBmdW5jdGlvbiB0byBmaXJlIHdoZW5ldmVyIHRoZVxuICogICAgICB3aW5kb3cgaXMgcmVzaXplZCwgZGVib3VuY2VkIGJ5IHRoZSB2YWx1ZSBvZiB0aGUgcmVzaXplRGVib3VuY2UgdmFyXG4gKiAgICBleHBvcnRzLmFkZEZ1bmN0aW9uKGZuKSAtIGFkZHMgYSBmdW5jdGlvbiB0byBmaXJlIG9uIGV2ZXJ5IGl0ZXJhdGlvbiBvZlxuICogICAgICB0aGUgbG9vcC4gTGltaXQgdGhlIHVzZSBvZiB0aGlzXG4gKiAgICBleHBvcnRzLnJlbW92ZUZ1bmN0aW9uKGZuKSAtIHJlbW92ZXMgYSBmdW5jdGlvbiBmcm9tIHRoZSBsaXN0IG9mIGZ1bmN0aW9uc1xuICogICAgICB0byBmaXJlXG4gKiAgICBleHBvcnRzLnN0YXJ0KCkgLSBzdGFydHMgdGhlIGxvb3AgKGRvZXNuJ3QgbmVlZCB0byBiZSBjYWxsZWQgdW5sZXNzIHRoZVxuICogICAgICBsb29wIHdhcyBzdG9wcGVkIGF0IHNvbWUgcG9pbnQpXG4gKiAgICBleHBvcnRzLnN0b3AoKSAtIHN0b3BzIHRoZSBsb29wXG4gKiAgICBleHBvcnRzLmZvcmNlKCkgLSBmb3JjZXMgdGhlIG5leHQgaXRlcmF0aW9uIG9mIHRoZSBsb29wIHRvIGZpcmUgc2Nyb2xsIGFuZFxuICogICAgICByZXNpemUgZnVuY3Rpb25zLCByZWdhcmRsZXNzIG9mIHdoZXRoZXIgb3Igbm90IGVpdGhlciB0aGluZ3MgYWN0dWFsbHlcbiAqICAgICAgaGFwcGVuZWRcbiAqL1xuXG4vKipcbiAqIFByb3ZpZGVzIHJlcXVlc3RBbmltYXRpb25GcmFtZSBpbiBhIGNyb3NzIGJyb3dzZXIgd2F5LlxuICogQGF1dGhvciBwYXVsaXJpc2ggLyBodHRwOi8vcGF1bGlyaXNoLmNvbS9cbiAqL1xuaWYgKCAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSApIHtcblx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9ICggZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHR3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG5cdFx0d2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHR3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHRmdW5jdGlvbiggLyogZnVuY3Rpb24gRnJhbWVSZXF1ZXN0Q2FsbGJhY2sgKi8gY2FsbGJhY2sgKSB7XG5cdFx0XHR3aW5kb3cuc2V0VGltZW91dCggY2FsbGJhY2ssIDEwMDAgLyA2MCApO1xuXHRcdH07XG5cdH0gKSgpO1xufVxuXG47KGZ1bmN0aW9uIChkb2N1bWVudCx3aW5kb3csdW5kZWZpbmVkKSB7XG5cbiAgLy8gb3RoZXIgbGliIGhlbHBlcnNcbiAgdmFyIGdldFNjcm9sbFBvcyA9IHJlcXVpcmUoJ2xpYi9nZXRTY3JvbGxQb3MnKTtcblxuICAvLyBwcml2YXRlIHZhcnNcbiAgdmFyIHJ1bm5pbmcgPSB0cnVlLFxuICAgICAgbGFzdEJvZHlXaWR0aCA9IGRvY3VtZW50LmJvZHkub2Zmc2V0V2lkdGgsIC8vIHN0b3JlIHdpZHRoIHRvIGRldGVybWluZSBpZiByZXNpemUgbmVlZGVkXG4gICAgICBsYXN0Qm9keUhlaWdodCA9IGRvY3VtZW50LmJvZHkub2Zmc2V0SGVpZ2h0LCAvLyBzdG9yZSBoZWlnaHQgdG8gZGV0ZXJtaW5lIGlmIHJlc2l6ZSBuZWVkZWRcbiAgICAgIGxhc3RTY3JvbGwgPSAtMSxcbiAgICAgIGxhc3RUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCksIC8vIGxhc3QgdGltZSBzbyB3ZSBrbm93IGhvdyBsb25nIGl0J3MgYmVlblxuICAgICAgcmVzaXplRGVib3VuY2UgPSA1MDBcbiAgICAgIDtcblxuICAvLyBzYXZlIHRoZSBmdW5jdGlvbnMgdGhlIGxvb3Agc2hvdWxkIHJ1blxuICAvLyB3aWxsIGJlIHBhc3NlZCBjdXJyZW50VGltZSwgdGltZUNoYW5nZVxuICB2YXIgbG9vcEZ1bmNzID0ge1xuICAgIHJlc2l6ZSA6IFtdLCAvLyBmdW5jdGlvbnMgdG8gcnVuIG9uIHJlc2l6ZVxuICAgIHNjcm9sbCA6IFtdLCAvLyBmdW5jdGlvbnMgdG8gcnVuIG9uIHNjcm9sbFxuICAgIHRpY2sgOiBbXSAvLyBmdW5jdGlvbnMgdG8gcnVuIGV2ZXJ5IHRpY2tcbiAgfTtcblxuICAvLyBhZGQvcmVtb3ZlIG1ldGhvZHMgZm9yIHRob3NlIGZ1bmN0aW9uc1xuICB2YXIgYWRkTG9vcEZ1bmN0aW9uID0gZnVuY3Rpb24gYWRkTG9vcEZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgIGlmIChsb29wRnVuY3NbdHlwZV0uaW5kZXhPZihmbikgPT09IC0xKSB7IC8vIG1ha2Ugc3VyZSBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QgKG9ubHkgd29ya3Mgd2l0aCBub24tYW5vbnltb3VzIGZ1bmN0aW9ucylcbiAgICAgIGxvb3BGdW5jc1t0eXBlXS5wdXNoKGZuKTtcblx0XHRcdHN0YXJ0KCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciBhZGRTY3JvbGxGdW5jdGlvbiA9IGZ1bmN0aW9uIGFkZFNjcm9sbEZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBhZGRMb29wRnVuY3Rpb24oJ3Njcm9sbCcsZm4pO1xuICB9XG4gIHZhciBhZGRSZXNpemVGdW5jdGlvbiA9IGZ1bmN0aW9uIGFkZFJlc2l6ZUZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBhZGRMb29wRnVuY3Rpb24oJ3Jlc2l6ZScsZm4pO1xuICB9XG4gIHZhciBhZGRGdW5jdGlvbiA9IGZ1bmN0aW9uIGFkZEZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBhZGRMb29wRnVuY3Rpb24oJ3RpY2snLGZuKTtcbiAgfVxuICB2YXIgcmVtb3ZlRnVuY3Rpb24gPSBmdW5jdGlvbiByZW1vdmVGdW5jdGlvbiAoZm4pIHtcbiAgICB2YXIgdHlwZXMgPSBbJ3Jlc2l6ZScsJ3Njcm9sbCcsJ3RpY2snXTtcbiAgICB2YXIgZm91bmQgPSBmYWxzZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR5cGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaW5kZXggPSBsb29wRnVuY3NbdHlwZXNbaV1dLmluZGV4T2YoZm4pO1xuICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICBsb29wRnVuY3NbdHlwZXNbaV1dLnNwbGljZShpbmRleCwxKTtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cdFx0Ly8gY2hlY2sgdGhhdCB3ZSdyZSBzdGlsbCBsaXN0ZW5pbmdcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR5cGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAobG9vcEZ1bmNzW3R5cGVzW2ldXS5sZW5ndGgpXG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZWxzZSBpZiAoaSA9PT0gdHlwZXMubGVuZ3RoIC0gMSlcblx0XHRcdFx0c3RvcCgpO1xuXHRcdH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cblxuICAvLyBkbyBhbGwgZnVuY3Rpb25zIG9mIGEgZ2l2ZW4gdHlwZVxuICB2YXIgZG9Mb29wRnVuY3Rpb25zID0gZnVuY3Rpb24gZG9Mb29wRnVuY3Rpb25zICh0eXBlLGN1cnJlbnRUaW1lKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGxvb3BGdW5jc1t0eXBlXS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGxvb3BGdW5jc1t0eXBlXVtpXSkgLy8gZXh0cmEgY2hlY2sgZm9yIHNhZmV0eVxuICAgICAgXHRsb29wRnVuY3NbdHlwZV1baV0uY2FsbCh3aW5kb3csY3VycmVudFRpbWUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIHN0YXJ0L3N0b3AgY29udHJvbFxuICB2YXIgc3RhcnQgPSBmdW5jdGlvbiBzdGFydExvb3AgKCkge1xuICAgIHJ1bm5pbmcgPSB0cnVlO1xuXHRcdGxvb3BGbigpO1xuICB9XG4gIHZhciBzdG9wID0gZnVuY3Rpb24gc3RvcExvb3AgKCkge1xuICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgfVxuXG4gIC8vIGZvcmNlIGl0IHRvIGZpcmUgbmV4dCB0aW1lIHRocm91Z2ggYnkgc2V0dGluZyBsYXN0U2Nyb2xsIGFuZCBsYXN0Qm9keVdpZHRoXG4gIC8vIHRvIGltcG9zc2libGUgdmFsdWVzXG4gIHZhciBmb3JjZSA9IGZ1bmN0aW9uIGZvcmNlTG9vcCAoKSB7XG4gICAgbGFzdEJvZHlXaWR0aCA9IC0xO1xuICAgIGxhc3RTY3JvbGwgPSAtMTtcbiAgfVxuXG4gIC8vIGhvbGQgYSByZXNpemUgdGltb3V0IHNvIHdlIGNhbiBkZWJvdW5jZSBpdFxuICB2YXIgcmVzaXplVGltZW91dCA9IG51bGw7XG5cbiAgLy8gdGhlIHJlYWwgZGVhbCFcbiAgLy8gaW4gYSBjbG9zdXJlIGZvciBtYXhpbXVtIHNhZmV0eSwgYW5kIHNvIGl0IGF1dG9zdGFydHNcbiAgLy8gbm90ZTogYWZ0ZXIgY2hlY2tpbmcgdXNpbmcganNwZXJmLCByYXRoZXIgdGhhbiBtYWtpbmcgb25lIGJpZyB0b2RvIGFycmF5IG9mXG4gIC8vIGFsbCB0aGUgZnVuY3Rpb25zLCBpdCdzIGZhc3RlciB0byBjYWxsIGVhY2ggYXJyYXkgb2YgZnVuY3Rpb25zIHNlcGFyYXRlbHlcbiAgZnVuY3Rpb24gbG9vcEZuKCkge1xuXG4gICAgLy8gY2hlY2sgdGhhdCB3ZSdyZSBhY3R1YWxseSBydW5uaW5nLi4uXG4gICAgaWYgKHJ1bm5pbmcpIHtcblxuICAgICAgdmFyIGN1cnJlbnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICB2YXIgdGltZUNoYW5nZSA9IGN1cnJlbnRUaW1lIC0gbGFzdFRpbWU7XG4gICAgICB2YXIgY3VycmVudFNjcm9sbCA9IGdldFNjcm9sbFBvcygpO1xuXG4gICAgICAvLyBjaGVjayBpZiByZXNpemVcbiAgICAgIGlmIChkb2N1bWVudC5ib2R5Lm9mZnNldFdpZHRoICE9PSBsYXN0Qm9keVdpZHRoIHx8IGRvY3VtZW50LmJvZHkub2Zmc2V0SGVpZ2h0ICE9PSBsYXN0Qm9keUhlaWdodCkge1xuICAgICAgICAvLyByZXNpemUgaXMgdHJ1ZSwgc2F2ZSBuZXcgc2l6ZXNcbiAgICAgICAgbGFzdEJvZHlXaWR0aCA9IGRvY3VtZW50LmJvZHkub2Zmc2V0V2lkdGg7XG4gICAgICAgIGxhc3RCb2R5SGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5vZmZzZXRIZWlnaHQ7XG5cbiAgICAgICAgaWYgKHJlc2l6ZVRpbWVvdXQpXG4gICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChyZXNpemVUaW1lb3V0KTtcbiAgICAgICAgcmVzaXplVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBkb0xvb3BGdW5jdGlvbnMoJ3Jlc2l6ZScsY3VycmVudFRpbWUpO1xuICAgICAgICB9LCByZXNpemVEZWJvdW5jZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIGNoZWNrIGlmIHNjcm9sbFxuICAgICAgaWYgKGxhc3RTY3JvbGwgIT09IGN1cnJlbnRTY3JvbGwpIHtcbiAgICAgICAgLy8gc2Nyb2xsIGlzIHRydWUsIHNhdmUgbmV3IHBvc2l0aW9uXG4gICAgICAgIGxhc3RTY3JvbGwgPSBjdXJyZW50U2Nyb2xsO1xuXG4gICAgICAgIC8vIGNhbGwgZWFjaCBmdW5jdGlvblxuICAgICAgICBkb0xvb3BGdW5jdGlvbnMoJ3Njcm9sbCcsY3VycmVudFRpbWUpO1xuICAgICAgfVxuXG4gICAgICAvLyBkbyB0aGUgYWx3YXlzIGZ1bmN0aW9uc1xuICAgICAgZG9Mb29wRnVuY3Rpb25zKCd0aWNrJyxjdXJyZW50VGltZSk7XG5cbiAgICAgIC8vIHNhdmUgdGhlIG5ldyB0aW1lXG4gICAgICBsYXN0VGltZSA9IGN1cnJlbnRUaW1lO1xuXG5cdFx0XHQvLyBtYWtlIHN1cmUgd2UgZG8gdGhlIHRpY2sgYWdhaW4gbmV4dCB0aW1lXG5cdCAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcEZuKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gZXhwb3J0IHRoZSB1c2VmdWwgZnVuY3Rpb25zXG4gIG1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFkZFNjcm9sbEZ1bmN0aW9uOiBhZGRTY3JvbGxGdW5jdGlvbixcbiAgICBhZGRSZXNpemVGdW5jdGlvbjogYWRkUmVzaXplRnVuY3Rpb24sXG4gICAgYWRkRnVuY3Rpb246IGFkZEZ1bmN0aW9uLFxuICAgIHJlbW92ZUZ1bmN0aW9uOiByZW1vdmVGdW5jdGlvbixcbiAgICBzdGFydDogc3RhcnQsXG4gICAgc3RvcDogc3RvcCxcbiAgICBmb3JjZTogZm9yY2VcbiAgfVxuXG59KShkb2N1bWVudCx3aW5kb3cpO1xuIiwiLyoqXG4gKiAgVXNlZnVsIGNsYXNzIGZvciBoYW5kbGluZyBwYXJhbGxheGluZyB0aGluZ3NcbiAqICBTdG9yZXMgb2JqZWN0IG1lYXN1cmVtZW50cyBhbmQgcmV0dXJucyBwZXJjZW50YWdlIG9mIHNjcm9sbCB3aGVuIGFza2VkXG4gKi9cblxuLy8gaGVscGVyc1xudmFyIGdldFBhZ2VPZmZzZXQgPSByZXF1aXJlKCdsaWIvZ2V0UGFnZU9mZnNldCcpLFxuICAgIHdpbmRvd1NpemUgPSByZXF1aXJlKCdsaWIvZ2V0V2luZG93U2l6ZScpLFxuICAgIGdldFNjcm9sbFBvcyA9IHJlcXVpcmUoJ2xpYi9nZXRTY3JvbGxQb3MnKSxcbiAgICBsb29wID0gcmVxdWlyZSgnbGliL2xvb3AnKVxuICAgIDtcblxuXG52YXIgUGFyYWxsYXggPSBmdW5jdGlvbiBQYXJhbGxheCAoZWxlbWVudCwgb25TY3JvbGwpIHtcbiAgaWYgKCF0aGlzIGluc3RhbmNlb2YgUGFyYWxsYXgpXG4gICAgcmV0dXJuIG5ldyBQYXJhbGxheChlbGVtZW50KTtcblxuICB2YXIgX3RoaXMgPSB0aGlzO1xuICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG4gIC8vIGdldCBtZWFzdXJlbWVudHMgaW1tZWRpYXRlbHlcbiAgdGhpcy5tZWFzdXJlKCk7XG4gIGlmIChvblNjcm9sbClcbiAgICBvblNjcm9sbChfdGhpcy5nZXRQZXJjZW50YWdlKCkpO1xuXG4gIC8vIGxpc3RlbmVyc1xuICB0aGlzLm9uUmVzaXplID0gZnVuY3Rpb24gbWVhc3VyZVBhcmFsbGF4ICgpIHtcbiAgICBfdGhpcy5tZWFzdXJlKCk7XG4gIH1cbiAgaWYgKG9uU2Nyb2xsKSB7XG4gICAgdGhpcy5vblNjcm9sbCA9IGZ1bmN0aW9uIHNjcm9sbFBhcmFsbGF4ICgpIHtcbiAgICAgIG9uU2Nyb2xsLmFwcGx5KF90aGlzLCBbX3RoaXMuZ2V0UGVyY2VudGFnZSgpXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gc3RhcnQgJ2VyIHVwXG4gIHRoaXMuZW5hYmxlKCk7XG59XG5QYXJhbGxheC5wcm90b3R5cGUgPSB7XG4gIG1lYXN1cmU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcG8gPSBnZXRQYWdlT2Zmc2V0KHRoaXMuZWxlbWVudCk7XG4gICAgdGhpcy50b3AgPSBwby50b3AgLSB3aW5kb3dTaXplLmhlaWdodCgpO1xuICAgIHRoaXMuYm90dG9tID0gcG8udG9wICsgdGhpcy5lbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgICB0aGlzLmhlaWdodCA9IHRoaXMuYm90dG9tIC0gdGhpcy50b3A7XG4gIH0sXG4gIGdldFBlcmNlbnRhZ2U6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2Nyb2xsWSA9IGdldFNjcm9sbFBvcygpO1xuICAgIHZhciBwZXJjID0gKHNjcm9sbFkgLSB0aGlzLnRvcCkgLyAodGhpcy5oZWlnaHQpO1xuICAgIHJldHVybiBwZXJjO1xuICB9LFxuICBkaXNhYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgbG9vcC5yZW1vdmVGdW5jdGlvbih0aGlzLm9uUmVzaXplKTtcbiAgICBpZiAodGhpcy5vblNjcm9sbClcbiAgICAgIGxvb3AucmVtb3ZlRnVuY3Rpb24odGhpcy5vblNjcm9sbCk7XG4gIH0sXG4gIGVuYWJsZTogZnVuY3Rpb24gKCkge1xuICAgIGxvb3AuYWRkUmVzaXplRnVuY3Rpb24odGhpcy5vblJlc2l6ZSk7XG4gICAgaWYgKHRoaXMub25TY3JvbGwpXG4gICAgICBsb29wLmFkZFNjcm9sbEZ1bmN0aW9uKHRoaXMub25TY3JvbGwpO1xuICB9LFxuICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgZGVsZXRlIHRoaXM7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQYXJhbGxheDtcbiIsIi8qKlxuICogIFNldHMgVHJhbnNmb3JtIHN0eWxlcyBjcm9zcyBicm93c2VyXG4gKiAgQHBhcmFtIHtIVE1MRWxlbWVudH1cbiAqICBAcGFyYW0ge3N0cmluZ30gdmFsdWUgb2YgdGhlIHRyYW5zZm9ybSBzdHlsZVxuICovXG5cbnZhciB0cmFuc2Zvcm1BdHRyaWJ1dGVzID0gWyd0cmFuc2Zvcm0nLCd3ZWJraXRUcmFuc2Zvcm0nLCdtb3pUcmFuc2Zvcm0nLCdtc1RyYW5zZm9ybSddO1xudmFyIHNldFRyYW5zZm9ybSA9IGZ1bmN0aW9uIChlbGVtZW50LCB0cmFuc2Zvcm1TdHJpbmcpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRyYW5zZm9ybUF0dHJpYnV0ZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBlbGVtZW50LnN0eWxlW3RyYW5zZm9ybUF0dHJpYnV0ZXNbaV1dID0gdHJhbnNmb3JtU3RyaW5nO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0VHJhbnNmb3JtO1xuIiwiLyoqXHJcbiAqICBGdWxsIEFydGljbGUgY29udHJvbGxlclxyXG4gKi9cclxuXHJcbi8vIHJlcXVpcmVtZW50c1xyXG52YXIgSGFsZnRvbmUgPSByZXF1aXJlKCdvYmplY3RzL2hhbGZ0b25lJyk7XHJcbnZhciBTY3JvbGxDb250cm9sbGVyID0gcmVxdWlyZSgnbGliL3Njcm9sbENvbnRyb2xsZXInKTtcclxudmFyIGdldFNjcm9sbFBvcyA9IHJlcXVpcmUoJ2xpYi9nZXRTY3JvbGxQb3MnKTtcclxudmFyIGdldEJyZWFrcG9pbnQgPSByZXF1aXJlKCdsaWIvYnJlYWtwb2ludHMnKTtcclxudmFyIGVhc2VzID0gcmVxdWlyZSgnbGliL2Vhc2UnKTtcclxuXHJcbi8vIHNldHRpbmdzXHJcbnZhciBIRUFERVJfSEFMRlRPTkVfU0VUVElOR1MgPSB7XHJcbiAgZmFkZTogZ2V0QnJlYWtwb2ludCgpID49IDIgPyAxMiA6IDEsXHJcbiAgaW5FYXNlU3RhcnQ6IC4xXHJcbn1cclxudmFyIElOTkVSX0hBTEZUT05FX1NFVFRJTkdTID0ge1xyXG4gIGZhZGU6IDAsXHJcbiAgaW1hZ2VTaXppbmc6ICdjb250YWluJyxcclxuICBpbkVhc2VTdGFydDogLjEsIC8vIHNjcm9sbCBwZXJjZW50YWdlIHRvIHN0YXJ0IGFuaW1hdGlvbiBpbiBvbiBmaXJzdCBkb3RcclxuICBpbkVhc2VFbmQ6IC41LCAvLyBzY3JvbGwgcGVyY2VudGFnZSB0byBlbmQgYW5pbWF0aW9uIGluIG9uIGxhc3QgZG90XHJcbiAgb3V0RWFzZVN0YXJ0OiAuNzUsXHJcbiAgY29ybmVyaW5nOiA4LFxyXG4gIG1heFJhZGl1czogMTJcclxufVxyXG52YXIgUkVMQVRFRF9IQUxGVE9ORV9TRVRUSU5HUyA9IHtcclxuICBmYWRlOiAwLFxyXG4gIGluRWFzZVN0YXJ0OiAtLjQsXHJcbiAgaW5FYXNlRW5kOiAuOCxcclxuICBpbkVhc2VGbjogZWFzZXMubGluZWFyLFxyXG4gIG91dEVhc2VTdGFydDogLjYsXHJcbiAgb3V0RWFzZUVuZDogMS4yLFxyXG4gIG1heFJhZGl1czogMTJcclxufVxyXG5cclxuLyoqXHJcbiAqICBBcnRpY2xlIGNsYXNzXHJcbiAqICBAcGFyYW0ge0hUTUxFbGVtZW50fSB0aGUgd2hvbGUgZGFtbiBhcnRpY2xlXHJcbiAqL1xyXG52YXIgQXJ0aWNsZSA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XHJcbiAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuXHJcbiAgLy8gaW5pdCBoZWFkZXJcclxuICB2YXIgaGVhZGVyRWwgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hcnRpY2xlX19oZWFkZXInKTtcclxuICBpZiAoaGVhZGVyRWwpIHtcclxuICAgIHRoaXMuaGVhZGVyID0gbmV3IEhhbGZ0b25lKGhlYWRlckVsLCBIRUFERVJfSEFMRlRPTkVfU0VUVElOR1MpO1xyXG4gICAgLy90aGlzLmhlYWRlci5hbmltSW4oMTIwMCk7XHJcbiAgICB3aW5kb3cuaGVhZGVyID0gdGhpcy5oZWFkZXI7XHJcbiAgfVxyXG5cclxuICAvLyBpbml0IG90aGVyIGhhbGZ0b25lc1xyXG4gIHZhciBoYWxmdG9uZUVscyA9IGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmhhbGZ0b25lJyk7XHJcbiAgdGhpcy5oYWxmdG9uZXMgPSBbXTtcclxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gaGFsZnRvbmVFbHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgIHZhciBodCA9IG5ldyBIYWxmdG9uZShoYWxmdG9uZUVsc1tpXSwgSU5ORVJfSEFMRlRPTkVfU0VUVElOR1MpO1xyXG4gICAgLy9odC5hbmltSW4oMTIwMCk7XHJcbiAgICB0aGlzLmhhbGZ0b25lcy5wdXNoKGh0KTtcclxuICB9XHJcblxyXG4gIHZhciByZWxhdGVkc0VsID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmVsYXRlZHMnKTtcclxuICBpZiAocmVsYXRlZHNFbCkge1xyXG4gICAgdGhpcy5oYWxmdG9uZXMucHVzaChuZXcgSGFsZnRvbmUocmVsYXRlZHNFbCwgUkVMQVRFRF9IQUxGVE9ORV9TRVRUSU5HUykpO1xyXG4gIH1cclxuXHJcbiAgLy8gYnV0dG9uc1xyXG4gIC8vIHZhciBidXR0b25FbHMgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5idXR0b24nKTtcclxuICAvLyB0aGlzLmJ1dHRvbnMgPSBbXTtcclxuICAvLyBmb3IgKHZhciBpID0gMCwgbGVuID0gYnV0dG9uRWxzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgLy8gICB2YXIgaHQgPSBuZXcgSGFsZnRvbmUoYnV0dG9uRWxzW2ldLCB7XHJcbiAgLy8gICAgIGZhZGU6IDEsXHJcbiAgLy8gICAgIGluRWFzZVN0YXJ0OiAwLFxyXG4gIC8vICAgICBpbkVhc2VFbmQ6IDEsXHJcbiAgLy8gICAgIG91dEVhc2VTdGFydDogMS4xLFxyXG4gIC8vICAgICBvdXRFYXNlRW5kOiAxLjEsXHJcbiAgLy8gICAgIGNvbnRyb2w6ICdub25lJyxcclxuICAvLyAgICAgZmlsbDogJyMwNDZjNmYnXHJcbiAgLy8gICB9KTtcclxuICAvLyAgIGJ1dHRvbkVsc1tpXS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLGZ1bmN0aW9uICgpIHtcclxuICAvLyAgICAgaHQuYW5pbSguNSwxLDMwMDApO1xyXG4gIC8vICAgfSwgZmFsc2UpO1xyXG4gIC8vICAgYnV0dG9uRWxzW2ldLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0JyxmdW5jdGlvbiAoKSB7XHJcbiAgLy8gICAgIGh0LmFuaW0oMSwuNSwzMDAwKTtcclxuICAvLyAgIH0sIGZhbHNlKTtcclxuICAvLyAgIHRoaXMuaGFsZnRvbmVzLnB1c2goaHQpO1xyXG4gIC8vIH1cclxuXHJcbiAgLy8gbGlzdGVuIGZvciB3aGVuIHRvIGRlc3Ryb3lcclxuICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gIHZhciBvblNjcm9sbCA9IGZ1bmN0aW9uIChzY3JvbGxQZXJjZW50YWdlKSB7XHJcbiAgICBpZiAoZ2V0U2Nyb2xsUG9zKCkgPiB0aGlzLmJvdHRvbSArIDMwMClcclxuICAgICAgX3RoaXMuZGVzdHJveSh0cnVlKTtcclxuICB9XHJcbiAgdGhpcy5zY3JvbGxDb250cm9sbGVyID0gbmV3IFNjcm9sbENvbnRyb2xsZXIodGhpcy5lbGVtZW50KTtcclxufVxyXG5BcnRpY2xlLnByb3RvdHlwZSA9IHtcclxuICBkZXN0cm95OiBmdW5jdGlvbiAoaXNQYXN0KSB7XHJcbiAgICB2YXIgbmV3U2Nyb2xsUG9zID0gZ2V0U2Nyb2xsUG9zKCkgLSB0aGlzLmVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xyXG4gICAgaWYgKHRoaXMuaGVhZGVyKVxyXG4gICAgICB0aGlzLmhlYWRlci5kZXN0cm95KCk7XHJcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5oYWxmdG9uZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspXHJcbiAgICAgIHRoaXMuaGFsZnRvbmVzW2ldLmRlc3Ryb3koKTtcclxuXHJcbiAgICB0aGlzLnNjcm9sbENvbnRyb2xsZXIuZGVzdHJveSgpO1xyXG5cclxuICAgIC8vIGZpeCBzY3JvbGwgcG9zaXRpb25cclxuICAgIGlmIChpc1Bhc3QpIHtcclxuICAgICAgdmFyIHJldHJpZWQgPSBmYWxzZTtcclxuICAgICAgZnVuY3Rpb24gZml4U2Nyb2xsICgpIHtcclxuICAgICAgICB3aW5kb3cuc2Nyb2xsVG8oMCxuZXdTY3JvbGxQb3MpO1xyXG4gICAgICB9XHJcbiAgICAgIGZpeFNjcm9sbCgpO1xyXG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZml4U2Nyb2xsKTtcclxuICAgIH1cclxuICAgIHRoaXMuZWxlbWVudC5yZW1vdmUoKTtcclxuICAgIC8vZGVsZXRlIHRoaXM7XHJcbiAgfVxyXG59XHJcblxyXG4vLyB0ZW1wIGluaXQgYXJ0aWNsZVxyXG52YXIgYXJ0aWNsZUVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFydGljbGUnKTtcclxuaWYgKGFydGljbGVFbClcclxuICBuZXcgQXJ0aWNsZShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYXJ0aWNsZScpKTtcclxuIiwiLy8gcmVxdWlyZW1lbnRzXHJcbnZhciBIYWxmdG9uZSA9IHJlcXVpcmUoJ29iamVjdHMvaGFsZnRvbmUnKTtcclxudmFyIGVhc2VzID0gcmVxdWlyZSgnbGliL2Vhc2UnKTtcclxuXHJcbi8vIHNldHRpbmdzXHJcblxyXG4vLyBpbml0IGZvb3RlciBoYWxmdG9uZVxyXG52YXIgZm9vdGVySGFsZnRvbmVFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5mb290ZXItbWFpbl9faGFsZnRvbmUnKTtcclxuaWYgKGZvb3RlckhhbGZ0b25lRWwpIHtcclxuICB2YXIgZm9vdGVySGFsZnRvbmUgPSBuZXcgSGFsZnRvbmUgKGZvb3RlckhhbGZ0b25lRWwsIHtcclxuICAgIGZhZGU6IDEyLFxyXG4gICAgbWF4UmFkaXVzOiAxNSxcclxuICAgIGluRWFzZVN0YXJ0OiAtLjI1LFxyXG4gICAgaW5FYXNlRW5kOiAuMSxcclxuICAgIGluRWFzZUZuOiBlYXNlcy5saW5lYXIsXHJcbiAgICBvdXRFYXNlU3RhcnQ6IDEsXHJcbiAgICBvdXRFYXNlRW5kOiAxXHJcbiAgfSk7XHJcbn1cclxuIiwiLyoqXHJcbiAqICBDb250cm9scyBjb29sIGhhbGZ0b25lIHRoaW5naWVzXHJcbiAqL1xyXG5cclxuLy8gcmVxdWlyZW1lbnRzXHJcbnZhciBlYXNlcyA9IHJlcXVpcmUoJ2xpYi9lYXNlJyk7XHJcbnZhciBTY3JvbGxDb250cm9sbGVyID0gcmVxdWlyZSgnbGliL3Njcm9sbENvbnRyb2xsZXInKTtcclxudmFyIHNldFRyYW5zZm9ybSA9IHJlcXVpcmUoJ2xpYi9zZXRUcmFuc2Zvcm0nKTtcclxudmFyIHdpbmRvd1NpemUgPSByZXF1aXJlKCdsaWIvZ2V0V2luZG93U2l6ZScpO1xyXG52YXIgZ2V0QnJlYWtwb2ludCA9IHJlcXVpcmUoJ2xpYi9icmVha3BvaW50cycpO1xyXG52YXIgbG9vcCA9IHJlcXVpcmUoJ2xpYi9sb29wJyk7XHJcblxyXG4vLyBzZXR0aW5nc1xyXG52YXIgREVGQVVMVFMgPSB7XHJcbiAgZmFkZTogNCwgLy8gcm93cyB0byBmYWRlIHRvcCBhbmQgYm90dG9tLCBpZiAwIHRoZSBjYW52YXMgaXMgc2l6ZWQgdG8gYmUgY29udGFpbmVkIGluc3RlYWQgb2Ygb3ZlcmZsb3cgb24gdGhlIHNpZGVzXHJcbiAgbWF4UmFkaXVzOiAxNSwgLy8gbWF4aW11bSByYWRpdXMgZm9yIGEgZG90XHJcbiAgaW5FYXNlRm46IGVhc2VzLmVhc2VPdXQsXHJcbiAgaW5FYXNlU3RhcnQ6IC4yLCAvLyBzY3JvbGwgcGVyY2VudGFnZSB0byBzdGFydCBhbmltYXRpb24gaW4gb24gZmlyc3QgZG90XHJcbiAgaW5FYXNlRW5kOiAuOCwgLy8gc2Nyb2xsIHBlcmNlbnRhZ2UgdG8gZW5kIGFuaW1hdGlvbiBpbiBvbiBsYXN0IGRvdFxyXG4gIG91dEVhc2VGbjogZWFzZXMubGluZWFyLFxyXG4gIG91dEVhc2VTdGFydDogLjYsIC8vIHNjcm9sbCBwZXJjZW50YWdlIHRvIHN0YXJ0IGFuaW1hdGlvbiBvdXQgb24gZmlyc3QgZG90XHJcbiAgb3V0RWFzZUVuZDogMS4xLCAvLyBzY3JvbGwgcGVyY2VudGFnZSB0byBlbmQgYW5pbWF0aW9uIG91dCBvbiBsYXN0IGRvdFxyXG4gIGZpeGVkOiBmYWxzZSwgLy8gZml4ZWQgcG9zaXRpb24gYW5kIGZ1bGwgc2NyZWVuP1xyXG4gIGltYWdlU2l6aW5nOiAnY292ZXInLCAvLyAnY292ZXInIG9yICdjb250YWluJ1xyXG4gIGNvcm5lcmluZzogMCwgLy8gZGlhZ25hbCB0b3AgbGVmdCBmYWRlXHJcbiAgY29udHJvbDogJ3Njcm9sbCcsIC8vICdzY3JvbGwnLCAnbW91c2UnIChUT0RPKSwgb3IgJ25vbmUnXHJcbiAgZmlsbDogbnVsbCwgLy8gb3B0aW9uYWxseSBvdmVycmlkZSBmaWxsIGNvbG9yXHJcbiAgaW5pdGlhbERyYXdQZXJjZW50YWdlOiAuNTUsIC8vIHBlcmNlbnRhZ2UgdG8gZHJhdyByaWdodCBhd2F5XHJcbiAgbWluQnJlYWtwb2ludDogMCAvLyBtaW5pbXVtIGJyZWFrcG9pbnQgdGhhdCBjYW52YXMgY2FuIGV4aXN0XHJcbn1cclxudmFyIEJSRUFLUE9JTlRfRk9SX1NDUk9MTF9DT05UUk9MID0gMjtcclxuXHJcbi8qKlxyXG4gKiAgRG90IGNsYXNzXHJcbiAqICBAcGFyYW0ge2ludH0gZ3JpZCBwb3NpdGlvbiBYXHJcbiAqICBAcGFyYW0ge2ludH0gZ3JpZCBwb3NpdGlvbiBZXHJcbiAqICBAcGFyYW0ge051bWJlcn0gbWF4IHJhZGl1c1xyXG4gKiAgQHBhcmFtIHtIYWxmdG9uZX0gcGFyZW50IGhhbGZ0b25lIG9iamVjdFxyXG4gKlxyXG4gKiAgQG1ldGhvZCBkcmF3ICh7Y2FudmFzIGNvbnRleHR9KVxyXG4gKiAgQG1ldGhvZCBzZXRSYWRpdXNCeVBlcmNlbnRhZ2UgKHtwZXJjZW50IG9mIG1heCByYWRpdXN9KVxyXG4gKi9cclxudmFyIERvdCA9IGZ1bmN0aW9uIChncmlkWCwgZ3JpZFksIG1heFJhZGl1cywgcGFyZW50KSB7XHJcbiAgdGhpcy5ncmlkWCA9IGdyaWRYO1xyXG4gIHRoaXMuZ3JpZFkgPSBncmlkWTtcclxuICB0aGlzLm1heFJhZGl1cyA9IG1heFJhZGl1cztcclxuICB0aGlzLnJhZGl1cyA9IG1heFJhZGl1cztcclxuICB0aGlzLnBhcmVudCA9IHBhcmVudDtcclxuICB0aGlzLnBlcmNlbnRhZ2UgPSAodGhpcy5ncmlkWCArIHRoaXMuZ3JpZFkpIC8gKHRoaXMucGFyZW50LmNvbHVtbnMgKyB0aGlzLnBhcmVudC5yb3dzKTtcclxuXHJcbiAgLy8gZGVmaW5lIGxvY2F0aW9uIHdpdGhpbiBjYW52YXMgY29udGV4dFxyXG4gIHRoaXMueCA9IHRoaXMuZ3JpZFggKiB0aGlzLnBhcmVudC5zZXR0aW5ncy5tYXhSYWRpdXM7XHJcbiAgdGhpcy55ID0gdGhpcy5ncmlkWSAqIHRoaXMucGFyZW50LnNldHRpbmdzLm1heFJhZGl1cztcclxuICBpZiAodGhpcy5wYXJlbnQuc2V0dGluZ3MuZmFkZSlcclxuICAgIHRoaXMueSArPSB0aGlzLnBhcmVudC5zZXR0aW5ncy5tYXhSYWRpdXM7XHJcblxyXG4gIC8vIGhhbmRsZSBjb3JuZXJpbmdcclxuICBpZiAodGhpcy5wYXJlbnQuc2V0dGluZ3MuY29ybmVyaW5nICYmIHRoaXMuZ3JpZFggKyB0aGlzLmdyaWRZIDw9IHRoaXMucGFyZW50LnNldHRpbmdzLmNvcm5lcmluZyArIDEpIHtcclxuICAgIHRoaXMubWF4UmFkaXVzID0gZWFzZXMubGluZWFyKC4zMywuNjYsKHRoaXMuZ3JpZFggKyB0aGlzLmdyaWRZKSAvICh0aGlzLnBhcmVudC5zZXR0aW5ncy5jb3JuZXJpbmcgKyAxKSkgKiB0aGlzLm1heFJhZGl1cztcclxuICAgIHRoaXMucmFkaXVzID0gdGhpcy5tYXhSYWRpdXM7XHJcbiAgfVxyXG4gIGVsc2UgaWYgKHRoaXMucGFyZW50LnNldHRpbmdzLmNvcm5lcmluZyAmJiAtMSAqICgodGhpcy5ncmlkWCArIHRoaXMuZ3JpZFkpIC0gKHRoaXMucGFyZW50LmNvbHVtbnMgKyB0aGlzLnBhcmVudC5yb3dzIC0gMikpIDw9IHRoaXMucGFyZW50LnNldHRpbmdzLmNvcm5lcmluZyArIDEpIHtcclxuICAgIHRoaXMubWF4UmFkaXVzID0gZWFzZXMubGluZWFyKC4zMywuNjYsLTEgKiAoKHRoaXMuZ3JpZFggKyB0aGlzLmdyaWRZKSAtICh0aGlzLnBhcmVudC5jb2x1bW5zICsgdGhpcy5wYXJlbnQucm93cyAtIDIpKSAvICh0aGlzLnBhcmVudC5zZXR0aW5ncy5jb3JuZXJpbmcgKyAxKSkgKiB0aGlzLm1heFJhZGl1cztcclxuICAgIHRoaXMucmFkaXVzID0gdGhpcy5tYXhSYWRpdXM7XHJcbiAgfVxyXG59XHJcbkRvdC5wcm90b3R5cGUgPSB7XHJcbiAgZHJhdzogZnVuY3Rpb24gKGN0eCkge1xyXG4gICAgaWYgKHRoaXMucmFkaXVzID4gLjUpIHtcclxuICAgICAgY3R4Lm1vdmVUbyh0aGlzLngsIHRoaXMueSAtIHRoaXMucmFkaXVzKTtcclxuICAgICAgY3R4LmFyYyh0aGlzLngsIHRoaXMueSwgdGhpcy5yYWRpdXMsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgfSxcclxuICBzZXRSYWRpdXNCeVBlcmNlbnRhZ2U6IGZ1bmN0aW9uIChwZXJjZW50KSB7XHJcbiAgICB0aGlzLnJhZGl1cyA9IE1hdGgubWF4KDAsIE1hdGgubWluKHRoaXMubWF4UmFkaXVzLCBwZXJjZW50ICogdGhpcy5tYXhSYWRpdXMpKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiAgSGFsZnRvbmUgY2xhc3NcclxuICogIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQsIG9wdGlvbmFsbHkgd2l0aCBhIGJhY2tncm91bmQgaW1hZ2UsIHRvIHR1cm4gaW50byB0aGUgdG95XHJcbiAqICBAcGFyYW0ge29iamVjdH0gc2V0dGluZ3MgdGhhdCBjYW4gb3ZlcnJpZGUgREVGQVVMVFMgZGVmaW5lZCBhYm92ZVxyXG4gKlxyXG4gKiAgQG1ldGhvZCBkcmF3KHtwZXJjZW50YWdlIG9mIGFuaW1hdGlvbiBwcm9ncmVzc30pXHJcbiAqICBAbWV0aG9kIGNyZWF0ZUNhbnZhcygpXHJcbiAqICBAbWV0aG9kIHNpemVJbWFnZSgpIC0gZm9yIGludGVybmFsIHVzZVxyXG4gKiAgQG1ldGhvZCBnZXRQZXJjZW50YWdlRnJvbVNjcm9sbCgpIC0gcmV0dXJucyBhIHBlcmNlbnRhZ2Ugb2YgcHJvZ3Jlc3MgcGFzdCBlbGVtZW50IGJhc2VkIG9uIHNjcm9sbGluZ1xyXG4gKiAgQG1ldGhvZCBpbml0KClcclxuICogIEBtZXRob2QgZGVzdHJveSgpXHJcbiAqICBAbWV0aG9kIGFuaW1Jbih7YW5pbWF0aW9uIHRpbWUgaW4gbXN9KVxyXG4gKi9cclxudmFyIEhhbGZ0b25lID0gZnVuY3Rpb24gKGVsZW1lbnQsIHNldHRpbmdzLCBkb3RTaXplSW1hZ2UpIHtcclxuICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgdGhpcy5zZXR0aW5ncyA9IHt9O1xyXG4gIHNldHRpbmdzID0gc2V0dGluZ3MgfHwge307XHJcbiAgZm9yICh2YXIgcHJvcCBpbiBERUZBVUxUUykge1xyXG4gICAgdGhpcy5zZXR0aW5nc1twcm9wXSA9IHNldHRpbmdzW3Byb3BdICE9PSB1bmRlZmluZWQgPyBzZXR0aW5nc1twcm9wXSA6IERFRkFVTFRTW3Byb3BdO1xyXG4gIH1cclxuXHJcbiAgaWYgKGRvdFNpemVJbWFnZSkge1xyXG4gICAgdGhpcy5kb3RTaXplSW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuICAgIHRoaXMuZG90U2l6ZUltYWdlLnNyYyA9IGRvdFNpemVJbWFnZTtcclxuICAgIHRoaXMuZG90U2l6ZUltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgX3RoaXMuc2l6ZURvdHNCeUltYWdlKCk7XHJcbiAgICAgIF90aGlzLmxhc3REcmF3blBlcmNlbnRhZ2UgPSBudWxsO1xyXG4gICAgICBfdGhpcy5kcmF3KF90aGlzLmdldFBlcmNlbnRhZ2VGcm9tU2Nyb2xsKCkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLmVsZW1lbnQpO1xyXG4gIC8vIG1ha2Ugc3VyZSBwb3NpdGlvbmluZyBpcyB2YWxpZFxyXG4gIGlmIChjb21wdXRlZFN0eWxlLnBvc2l0aW9uID09PSAnc3RhdGljJykge1xyXG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcclxuICB9XHJcbiAgLy8gc2V0IHVwIGNvbG9yIGFuZCBpbWFnZVxyXG4gIHRoaXMuZmlsbCA9IHRoaXMuc2V0dGluZ3MuZmlsbCB8fCBjb21wdXRlZFN0eWxlLmJhY2tncm91bmRDb2xvcjtcclxuICBpZiAoISFjb21wdXRlZFN0eWxlLmJhY2tncm91bmRJbWFnZSAmJiBjb21wdXRlZFN0eWxlLmJhY2tncm91bmRJbWFnZSAhPT0gJ25vbmUnKSB7XHJcbiAgICB0aGlzLmltYWdlID0gbmV3IEltYWdlKCk7XHJcbiAgICB0aGlzLmltYWdlLnNyYyA9IGNvbXB1dGVkU3R5bGUuYmFja2dyb3VuZEltYWdlLm1hdGNoKC9cXCgoPzonfFwiKT8oLis/KSg/Oid8XCIpP1xcKS8pWzFdO1xyXG4gIH1cclxuICBpZiAoIXRoaXMuc2V0dGluZ3MuZmlsbClcclxuICAgIHRoaXMuZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kID0gJ25vbmUnO1xyXG5cclxuICAvLyBsaXN0ZW5lcnNcclxuICB0aGlzLm9uUmVzaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgX3RoaXMuY3JlYXRlQ2FudmFzKCk7XHJcbiAgfVxyXG4gIHRoaXMub25TY3JvbGwgPSBmdW5jdGlvbiAocGVyY2VudGFnZSkge1xyXG4gICAgX3RoaXMuZHJhdyhwZXJjZW50YWdlKTtcclxuICB9XHJcblxyXG4gIC8vIGF1dG9zdGFydFxyXG4gIHRoaXMuaW5pdCgpO1xyXG59XHJcbkhhbGZ0b25lLnByb3RvdHlwZSA9IHtcclxuICBkcmF3OiBmdW5jdGlvbiAocGVyY2VudGFnZSkge1xyXG4gICAgLy8gcm91bmQgdG8gLjElXHJcbiAgICBwZXJjZW50YWdlID0gTWF0aC5yb3VuZChwZXJjZW50YWdlICogMTAwMCkgLyAxMDAwO1xyXG5cclxuICAgIC8vIHNob3VsZCB3ZSBib3RoZXI/XHJcbiAgICBpZiAoIXRoaXMuY2FudmFzIHx8IHBlcmNlbnRhZ2UgPT0gdGhpcy5sYXN0RHJhd25QZXJjZW50YWdlIHx8IChwZXJjZW50YWdlIDwgdGhpcy5zZXR0aW5ncy5pbkVhc2VTdGFydCB8fCBwZXJjZW50YWdlID4gdGhpcy5zZXR0aW5ncy5vdXRFYXNlRW5kKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgICBjb25zb2xlLmxvZygnZHJhdycpO1xyXG5cclxuICAgIC8vIGNsZWFyIGN1cnJlbnQgY3JhcFxyXG4gICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsMCx0aGlzLmNhbnZhcy53aWR0aCx0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG5cclxuICAgIC8vIGhhdmUgdG8gZG8gdGhlIG1hdGhzXHJcbiAgICB0aGlzLmN0eC5zYXZlKCk7XHJcbiAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgIC8vIGhhbmRsZSBhbmltYXRpb25cclxuICAgIC8vIGluIHZhcnNcclxuICAgIHZhciBlZmZlY3RpdmVJblBlcmMgPSAocGVyY2VudGFnZSAtIHRoaXMuc2V0dGluZ3MuaW5FYXNlU3RhcnQpIC8gKHRoaXMuc2V0dGluZ3MuaW5FYXNlRW5kIC0gdGhpcy5zZXR0aW5ncy5pbkVhc2VTdGFydCk7XHJcbiAgICBlZmZlY3RpdmVJblBlcmMgPSBlZmZlY3RpdmVJblBlcmMgPCAxID8gdGhpcy5zZXR0aW5ncy5pbkVhc2VGbigtMSwzLGVmZmVjdGl2ZUluUGVyYykgOiAyO1xyXG4gICAgLy8gb3V0IHZhcnNcclxuICAgIHZhciBlZmZlY3RpdmVPdXRQZXJjID0gKHBlcmNlbnRhZ2UgLSB0aGlzLnNldHRpbmdzLm91dEVhc2VTdGFydCkgLyAodGhpcy5zZXR0aW5ncy5vdXRFYXNlRW5kIC0gdGhpcy5zZXR0aW5ncy5vdXRFYXNlU3RhcnQpO1xyXG4gICAgZWZmZWN0aXZlT3V0UGVyYyA9IGVmZmVjdGl2ZU91dFBlcmMgPiAwID8gdGhpcy5zZXR0aW5ncy5vdXRFYXNlRm4oMiwtMyxlZmZlY3RpdmVPdXRQZXJjKSA6IDI7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuZG90cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICB2YXIgZG90SW5QZXJjID0gZWZmZWN0aXZlSW5QZXJjIC0gdGhpcy5kb3RzW2ldLnBlcmNlbnRhZ2U7XHJcbiAgICAgIHZhciBkb3RPdXRQZXJjID0gZWZmZWN0aXZlT3V0UGVyYyAtICgxIC0gdGhpcy5kb3RzW2ldLnBlcmNlbnRhZ2UpO1xyXG4gICAgICB0aGlzLmRvdHNbaV0uc2V0UmFkaXVzQnlQZXJjZW50YWdlKE1hdGgubWluKGRvdEluUGVyYyxkb3RPdXRQZXJjKSk7XHJcbiAgICAgIHRoaXMuZG90c1tpXS5kcmF3KHRoaXMuY3R4KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmN0eC5maWxsKCk7XHJcblxyXG4gICAgaWYgKHRoaXMuaW1hZ2UgJiYgdGhpcy5pbWFnZU9mZnNldHMpIHtcclxuICAgICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJzb3VyY2UtYXRvcFwiO1xyXG4gICAgICB0aGlzLmN0eC5kcmF3SW1hZ2UodGhpcy5pbWFnZSwgdGhpcy5pbWFnZU9mZnNldHMueCwgdGhpcy5pbWFnZU9mZnNldHMueSwgdGhpcy5pbWFnZU9mZnNldHMud2lkdGgsIHRoaXMuaW1hZ2VPZmZzZXRzLmhlaWdodCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmN0eC5yZXN0b3JlKCk7XHJcblxyXG4gICAgdGhpcy5sYXN0RHJhd25QZXJjZW50YWdlID0gcGVyY2VudGFnZTtcclxuICB9LFxyXG4gIGNyZWF0ZUNhbnZhczogZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKGdldEJyZWFrcG9pbnQoKSA8IHRoaXMuc2V0dGluZ3MubWluQnJlYWtwb2ludCkge1xyXG4gICAgICBjb25zb2xlLmxvZygndG9vIHNtYWxsIScsIHRoaXMuY2FudmFzKTtcclxuICAgICAgLy8gd2Ugd2FudCBubyBjYW52YXMhXHJcbiAgICAgIGlmICh0aGlzLmNhbnZhcykge1xyXG4gICAgICAgIHRoaXMuY2FudmFzLnJlbW92ZSgpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ29vZCB0byBhY3R1YWxseSBtYWtlIHRoZSB0aGluZ1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIGZ1bmN0aW9uIGFkZENhbnZhcyAoKSB7XHJcbiAgICAgIGlmIChfdGhpcy5lbGVtZW50LmNoaWxkcmVuLmxlbmd0aCkge1xyXG4gICAgICAgIF90aGlzLmVsZW1lbnQuaW5zZXJ0QmVmb3JlKF90aGlzLmNhbnZhcywgX3RoaXMuZWxlbWVudC5jaGlsZHJlblswXSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgX3RoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChfdGhpcy5jYW52YXMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBlbmFibGVDYW52YXMgKCkge1xyXG4gICAgICAvLyBlc3RhYmxpc2ggc2Nyb2xsIGJhc2VkIGNvbnRyb2xzIG9ubHkgaWYgc2NyZWVuIGlzIGxhcmdlIGVub3VnaCBmb3IgdXMgdG8gY2FyZVxyXG4gICAgICBpZiAoZ2V0QnJlYWtwb2ludCgpID49IEJSRUFLUE9JTlRfRk9SX1NDUk9MTF9DT05UUk9MICYmIF90aGlzLnNldHRpbmdzLmNvbnRyb2wgPT09ICdzY3JvbGwnKSB7XHJcbiAgICAgICAgX3RoaXMuc2Nyb2xsQ29udHJvbGxlciA9IG5ldyBTY3JvbGxDb250cm9sbGVyKF90aGlzLmVsZW1lbnQsIF90aGlzLm9uU2Nyb2xsKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBpZiAoX3RoaXMuc2Nyb2xsQ29udHJvbGxlcikge1xyXG4gICAgICAgICAgX3RoaXMuc2Nyb2xsQ29udHJvbGxlci5kZXN0cm95KCk7XHJcbiAgICAgICAgICBfdGhpcy5zY3JvbGxDb250cm9sbGVyID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgX3RoaXMuZHJhdyhfdGhpcy5nZXRQZXJjZW50YWdlRnJvbVNjcm9sbCgpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGtpbGwgZXhpc3RpbmcgY2FudmFzXHJcbiAgICB0aGlzLmxhc3REcmF3blBlcmNlbnRhZ2UgPSBudWxsO1xyXG4gICAgdmFyIGxhc3RDYW52YXM7XHJcbiAgICBpZiAodGhpcy5jYW52YXMpIHtcclxuICAgICAgbGFzdENhbnZhcyA9IHRoaXMuY2FudmFzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNyZWF0ZSBuZXcgY2FudmFzIGFuZCBkb3RzXHJcbiAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgdGhpcy5jYW52YXMuc2V0QXR0cmlidXRlKCdjbGFzcycsJ2NhbnZhcy1oYWxmdG9uZScpO1xyXG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmZpeGVkIHx8IGdldEJyZWFrcG9pbnQoKSA8IEJSRUFLUE9JTlRfRk9SX1NDUk9MTF9DT05UUk9MKSB7XHJcbiAgICAgIC8vIG5vcm1hbCBzaXppbmcgYW5kIHBvc2l0aW9uaW5nXHJcbiAgICAgIHZhciBjb2x1bW5zID0gTWF0aC5mbG9vcih0aGlzLmVsZW1lbnQub2Zmc2V0V2lkdGggLyB0aGlzLnNldHRpbmdzLm1heFJhZGl1cyk7XHJcbiAgICAgIHZhciByb3dzID0gTWF0aC5mbG9vcih0aGlzLmVsZW1lbnQub2Zmc2V0SGVpZ2h0IC8gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMpO1xyXG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5mYWRlKSB7XHJcbiAgICAgICAgY29sdW1ucyArPSAyO1xyXG4gICAgICAgIHJvd3MgKz0gdGhpcy5zZXR0aW5ncy5mYWRlICogMiArIDI7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgaWYgKGNvbHVtbnMgJSAyID09PSAwKVxyXG4gICAgICAgICAgY29sdW1ucyArPSAxO1xyXG4gICAgICAgIGlmIChyb3dzICUgMiA9PT0gMClcclxuICAgICAgICAgIHJvd3MgKz0gMTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIGZpeGVkIHNpemluZyBhbmQgcG9zaXRpb25pbmdcclxuICAgICAgdmFyIGNvbHVtbnMgPSBNYXRoLmZsb29yKHdpbmRvd1NpemUud2lkdGgoKSAvIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzKSArIDI7XHJcbiAgICAgIHZhciByb3dzID0gTWF0aC5mbG9vcih3aW5kb3dTaXplLmhlaWdodCgpIC8gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMpICsgdGhpcy5zZXR0aW5ncy5mYWRlICogMiArIDI7XHJcbiAgICAgIHNldFRyYW5zZm9ybSh0aGlzLmVsZW1lbnQsJ25vbmUnKTtcclxuICAgICAgc2V0VHJhbnNmb3JtKHRoaXMuY2FudmFzLCdub25lJyk7XHJcbiAgICAgIHRoaXMuY2FudmFzLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcclxuICAgICAgdGhpcy5jYW52YXMuc3R5bGUudG9wID0gdGhpcy5zZXR0aW5ncy5mYWRlICogdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMgKiAtMSAtICh0aGlzLnNldHRpbmdzLm1heFJhZGl1cykgKyAncHgnO1xyXG4gICAgICB0aGlzLmNhbnZhcy5zdHlsZS5sZWZ0ID0gMDtcclxuICAgIH1cclxuICAgIHRoaXMuY2FudmFzLndpZHRoID0gKGNvbHVtbnMgLSAxKSAqIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzO1xyXG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gKHRoaXMuc2V0dGluZ3MuZmFkZSA/IHJvd3MgKyAxIDogcm93cyAtIDEpICogdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXM7XHJcblxyXG4gICAgLy8gY2hlY2sgdGhhdCB3ZSBldmVuIG5lZWQgdG8gZG8gdGhpcyBzaGl0XHJcbiAgICBpZiAobGFzdENhbnZhcyAmJiBsYXN0Q2FudmFzLndpZHRoID09PSB0aGlzLmNhbnZhcy53aWR0aCAmJiBsYXN0Q2FudmFzLmhlaWdodCA9PT0gdGhpcy5jYW52YXMuaGVpZ2h0KSB7XHJcbiAgICAgIC8vIHN0b3AgcmVtYWtpbmcsIGl0J3MgdGhlIHNhbWUhXHJcbiAgICAgIHRoaXMuY2FudmFzID0gbGFzdENhbnZhcztcclxuICAgICAgLy9hZGRDYW52YXMoKTtcclxuICAgICAgZW5hYmxlQ2FudmFzKCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGxhc3RDYW52YXMpIHtcclxuICAgICAgbGFzdENhbnZhcy5yZW1vdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBzZXQgdGhlIGNvbnRleHRcclxuICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IHRoaXMuZmlsbDtcclxuICAgIHRoaXMuY29sdW1ucyA9IGNvbHVtbnM7XHJcbiAgICB0aGlzLnJvd3MgPSByb3dzO1xyXG5cclxuICAgIC8vIGRlZmluZSB0aGUgZG90c1xyXG4gICAgdGhpcy5kb3RzID0gW107XHJcbiAgICBmb3IgKHZhciB5ID0gMDsgeSA8IHJvd3M7IHkrKykge1xyXG4gICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IGNvbHVtbnM7IHgrPSAyKSB7XHJcbiAgICAgICAgdmFyIHJhZDtcclxuICAgICAgICBpZiAoeSA8IHRoaXMuc2V0dGluZ3MuZmFkZSkge1xyXG4gICAgICAgICAgcmFkID0gKHkgKyAxKSAvICh0aGlzLnNldHRpbmdzLmZhZGUgKyAxKSAqIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh5ID49IHJvd3MgLSB0aGlzLnNldHRpbmdzLmZhZGUpIHtcclxuICAgICAgICAgIHJhZCA9IC0xICogKHkgKyAxIC0gcm93cykgLyAodGhpcy5zZXR0aW5ncy5mYWRlICsgMSkgKiB0aGlzLnNldHRpbmdzLm1heFJhZGl1cztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMuc2V0dGluZ3MuZmFkZSAmJiB5ID09PSAwICYmIHggPT09IDAgJiYgIXRoaXMuc2V0dGluZ3MuZml4ZWQpIHtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICghdGhpcy5zZXR0aW5ncy5mYWRlICYmIHkgPT09IDAgJiYgeCA9PT0gY29sdW1ucyAtIDEgJiYgIXRoaXMuc2V0dGluZ3MuZml4ZWQpIHtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICghdGhpcy5zZXR0aW5ncy5mYWRlICYmIHkgPT09IHJvd3MgLSAxICYmIHggPT09IDAgJiYgIXRoaXMuc2V0dGluZ3MuZml4ZWQpIHtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICghdGhpcy5zZXR0aW5ncy5mYWRlICYmIHkgPT09IHJvd3MgLSAxICYmIHggPT09IGNvbHVtbnMgLSAxICYmICF0aGlzLnNldHRpbmdzLmZpeGVkKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICByYWQgPSB0aGlzLnNldHRpbmdzLm1heFJhZGl1cztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kb3RzLnB1c2gobmV3IERvdCh5ICUgMiA/IHggKyAxIDogeCwgeSwgcmFkLCB0aGlzKSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5lbGVtZW50LmNoaWxkcmVuLmxlbmd0aCkge1xyXG4gICAgICB0aGlzLmVsZW1lbnQuaW5zZXJ0QmVmb3JlKHRoaXMuY2FudmFzLCB0aGlzLmVsZW1lbnQuY2hpbGRyZW5bMF0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmNhbnZhcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZGV0ZXJtaW5lIGltYWdlIHNpemVcclxuICAgIGlmICh0aGlzLmltYWdlKSB7XHJcbiAgICAgIGlmICh0aGlzLmltYWdlLmNvbXBsZXRlKSB7XHJcbiAgICAgICAgdGhpcy5pbWFnZU9mZnNldHMgPSB0aGlzLnNpemVJbWFnZSh0aGlzLmltYWdlKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgX3RoaXMuaW1hZ2VPZmZzZXRzID0gX3RoaXMuc2l6ZUltYWdlKF90aGlzLmltYWdlKTtcclxuICAgICAgICAgIF90aGlzLmxhc3REcmF3blBlcmNlbnRhZ2UgPSBudWxsO1xyXG4gICAgICAgICAgX3RoaXMuZHJhdyhfdGhpcy5nZXRQZXJjZW50YWdlRnJvbVNjcm9sbCgpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5kb3RTaXplSW1hZ2UgJiYgdGhpcy5kb3RTaXplSW1hZ2UuY29tcGxldGUpIHtcclxuICAgICAgdGhpcy5zaXplRG90c0J5SW1hZ2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBlbmFibGVDYW52YXMoKTtcclxuICB9LFxyXG4gIHNpemVJbWFnZTogZnVuY3Rpb24gKGltYWdlKSB7XHJcbiAgICAvLyBtYWtlIHN1cmUgd2Ugc3VjY2Vzc2Z1bGx5IGxvYWRlZFxyXG4gICAgaWYgKCFpbWFnZSB8fCAhaW1hZ2Uud2lkdGggfHwgIWltYWdlLmhlaWdodCkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZmlndXJlIG91dCB0aGUgc2NhbGUgdG8gbWF0Y2ggJ2NvdmVyJyBvciAnY29udGFpbicsIGFzIGRlZmluZWQgYnkgc2V0dGluZ3NcclxuICAgIHZhciBzY2FsZSA9IHRoaXMuY2FudmFzLndpZHRoIC8gaW1hZ2Uud2lkdGg7XHJcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5pbWFnZVNpemluZyA9PT0gJ2NvdmVyJyAmJiBzY2FsZSAqIGltYWdlLmhlaWdodCA8IHRoaXMuY2FudmFzLmhlaWdodCkge1xyXG4gICAgICBzY2FsZSA9IHRoaXMuY2FudmFzLmhlaWdodCAvIGltYWdlLmhlaWdodDtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHRoaXMuc2V0dGluZ3MuaW1hZ2VTaXppbmcgPT09ICdjb250YWluJyAmJiBzY2FsZSAqIGltYWdlLmhlaWdodCA+IHRoaXMuY2FudmFzLmhlaWdodCkge1xyXG4gICAgICBzY2FsZSA9IHRoaXMuY2FudmFzLmhlaWdodCAvIGltYWdlLmhlaWdodDtcclxuICAgIH1cclxuICAgIC8vIHNhdmUgdGhlIHgseSx3aWR0aCxoZWlnaHQgb2YgdGhlIHNjYWxlZCBpbWFnZSBzbyBpdCBjYW4gYmUgZWFzaWx5IGRyYXduIHdpdGhvdXQgbWF0aFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgeDogKHRoaXMuY2FudmFzLndpZHRoIC0gaW1hZ2Uud2lkdGggKiBzY2FsZSkgLyAyLFxyXG4gICAgICB5OiAodGhpcy5jYW52YXMuaGVpZ2h0IC0gaW1hZ2UuaGVpZ2h0ICogc2NhbGUpIC8gMixcclxuICAgICAgd2lkdGg6IGltYWdlLndpZHRoICogc2NhbGUsXHJcbiAgICAgIGhlaWdodDogaW1hZ2UuaGVpZ2h0ICogc2NhbGVcclxuICAgIH1cclxuICB9LFxyXG4gIHNpemVEb3RzQnlJbWFnZTogZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gZmlyc3QsIGZpZ3VyZSBvdXQgaG93IHRvIHNpemUgdGhlIGltYWdlIGZvciB0aGUgY2FudmFzXHJcbiAgICB2YXIgZG90c0ltYWdlT2Zmc2V0cyA9IHRoaXMuc2l6ZUltYWdlKHRoaXMuZG90U2l6ZUltYWdlKTtcclxuICAgIGlmICghZG90c0ltYWdlT2Zmc2V0cykge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHRlbXBDYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgIHRlbXBDYW4ud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aDtcclxuICAgIHRlbXBDYW4uaGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0O1xyXG4gICAgdmFyIHRlbXBDYW5DdHggPSB0ZW1wQ2FuLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICB0ZW1wQ2FuQ3R4LmZpbGxTdHlsZSA9ICd3aGl0ZSc7XHJcbiAgICB0ZW1wQ2FuQ3R4LmZpbGxSZWN0KDAsIDAsIHRlbXBDYW4ud2lkdGgsIHRlbXBDYW4uaGVpZ2h0KTtcclxuICAgIHRlbXBDYW5DdHguZHJhd0ltYWdlKHRoaXMuZG90U2l6ZUltYWdlLCBkb3RzSW1hZ2VPZmZzZXRzLngsIGRvdHNJbWFnZU9mZnNldHMueSwgZG90c0ltYWdlT2Zmc2V0cy53aWR0aCwgZG90c0ltYWdlT2Zmc2V0cy5oZWlnaHQpO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSB0aGlzLmRvdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgdmFyIGltZ0RhdGEgPSB0ZW1wQ2FuQ3R4LmdldEltYWdlRGF0YSh0aGlzLmRvdHNbaV0ueCAtIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzLCB0aGlzLmRvdHNbaV0ueSAtIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzLCB0aGlzLnNldHRpbmdzLm1heFJhZGl1cyAqIDIsIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzICogMik7XHJcbiAgICAgIC8vY29uc29sZS5sb2codGhpcy5kb3RzW2ldLnggLSB0aGlzLnNldHRpbmdzLm1heFJhZGl1cywgdGhpcy5kb3RzW2ldLnkgLSB0aGlzLnNldHRpbmdzLm1heFJhZGl1cywgdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMgKiAyLCB0aGlzLnNldHRpbmdzLm1heFJhZGl1cyAqIDIpO1xyXG4gICAgICAvLyBvbmx5IGdldHRpbmcgcmVkLCBiZWNhdXNlIGltYWdlIHNob3VsZCBiZSBncmV5c2NhbGUgYW55d2F5XHJcbiAgICAgIHZhciBhdmVyYWdlUmVkID0gMDtcclxuICAgICAgZm9yICh2YXIgaiA9IDAsIGpMZW4gPSBpbWdEYXRhLmRhdGEubGVuZ3RoOyBqIDwgakxlbjsgaiArPSA0KSB7XHJcbiAgICAgICAgdmFyIG9wYWNpdHlBZGQgPSAoMjU1IC0gaW1nRGF0YS5kYXRhW2pdKSAqICgoMjU1IC0gaW1nRGF0YS5kYXRhW2ogKyAzXSkgLyAyNTUpO1xyXG4gICAgICAgIGF2ZXJhZ2VSZWQgKz0gaW1nRGF0YS5kYXRhW2pdICsgb3BhY2l0eUFkZDtcclxuICAgICAgICAvLyBpZiAoaiA8IDQwMClcclxuICAgICAgICAvLyAgIGNvbnNvbGUubG9nKGltZ0RhdGEuZGF0YVtqXSwgb3BhY2l0eUFkZCwgaW1nRGF0YS5kYXRhW2pdICsgb3BhY2l0eUFkZCk7XHJcbiAgICAgIH1cclxuICAgICAgYXZlcmFnZVJlZCAvPSAoaW1nRGF0YS5kYXRhLmxlbmd0aCAvIDQpO1xyXG5cclxuICAgICAgdGhpcy5kb3RzW2ldLm1heFJhZGl1cyA9IHRoaXMuZG90c1tpXS5tYXhSYWRpdXMgKiAoKDI1NSAtIGF2ZXJhZ2VSZWQpIC8gMjU1KTtcclxuICAgICAgLy8gcmVtb3ZlIHRoaXMgZG90IGlmIGl0IHdpbGwgbmV2ZXIgc2hvd1xyXG4gICAgICBpZiAodGhpcy5kb3RzW2ldLm1heFJhZGl1cyA8IC41KSB7XHJcbiAgICAgICAgdGhpcy5kb3RzLnNwbGljZShpLDEpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICBnZXRQZXJjZW50YWdlRnJvbVNjcm9sbDogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnNjcm9sbENvbnRyb2xsZXIgJiYgZ2V0QnJlYWtwb2ludCgpID49IEJSRUFLUE9JTlRfRk9SX1NDUk9MTF9DT05UUk9MKSA/IHRoaXMuc2Nyb2xsQ29udHJvbGxlci5nZXRQZXJjZW50YWdlKCkgOiB0aGlzLnNldHRpbmdzLmluaXRpYWxEcmF3UGVyY2VudGFnZTtcclxuICB9LFxyXG4gIGluaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIG1ha2UgdGhlIGNhbnZhc1xyXG4gICAgdGhpcy5jcmVhdGVDYW52YXMoKTtcclxuXHJcbiAgICAvLyBzY3JvbGwgbGlzdGVuZXIgYWRkZWQgaW4gY3JlYXRlQ2FudmFzIGZuXHJcblxyXG4gICAgLy8gbGlzdGVuIGZvciByZXNpemVcclxuICAgIGxvb3AuYWRkUmVzaXplRnVuY3Rpb24odGhpcy5vblJlc2l6ZSk7XHJcbiAgfSxcclxuICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAodGhpcy5zY3JvbGxDb250cm9sbGVyKVxyXG4gICAgICB0aGlzLnNjcm9sbENvbnRyb2xsZXIuZGVzdHJveSgpO1xyXG4gICAgbG9vcC5yZW1vdmVGdW5jdGlvbih0aGlzLm9uUmVzaXplKTtcclxuICAgIHRoaXMuY2FudmFzLnJlbW92ZSgpO1xyXG4gICAgZGVsZXRlIHRoaXM7XHJcbiAgfSxcclxuICBhbmltOiBmdW5jdGlvbiAoc3RhcnRQZXJjLCBlbmRQZXJjLCB0aW1lLCBlYXNlLCBjYikge1xyXG4gICAgLy8gZmlyc3QsIHR1cm4gb2ZmIHNjcm9sbCBsaXN0ZW5pbmdcclxuICAgIGlmICh0aGlzLnNjcm9sbENvbnRyb2xsZXIpXHJcbiAgICAgIHRoaXMuc2Nyb2xsQ29udHJvbGxlci5kaXNhYmxlKCk7XHJcbiAgICAvLyBlc3RhYmxpc2ggZGVmYXVsdHNcclxuICAgIHN0YXJ0UGVyYyA9IHN0YXJ0UGVyYyB8fCAwO1xyXG4gICAgZW5kUGVyYyA9ICFpc05hTihlbmRQZXJjKSA/IGVuZFBlcmMgOiAxO1xyXG4gICAgdGltZSA9IHRpbWUgfHwgMTAwMDtcclxuICAgIGVhc2UgPSBlYXNlIHx8IGVhc2VzLmVhc2VJbk91dDtcclxuICAgIC8vIGdldCBzb21lIGJhc2UgdmFyc1xyXG4gICAgdmFyIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgdmFyIGRlbHRhUGVyYyA9IGVuZFBlcmMgLSBzdGFydFBlcmM7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgdmFyIHJ1bm5pbmcgPSB0cnVlO1xyXG4gICAgLy8gdGhpcyBnb2VzIGluIHRoZSBsb29wXHJcbiAgICB2YXIgYW5pbWF0aW9uRm4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGlmIChydW5uaW5nKSB7XHJcbiAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgIHZhciBkZWx0YVRpbWUgPSAobm93IC0gc3RhcnRUaW1lKSAvIHRpbWU7XHJcbiAgICAgICAgaWYgKGRlbHRhVGltZSA8IDEpXHJcbiAgICAgICAgICBfdGhpcy5kcmF3KGVhc2Uoc3RhcnRQZXJjLGRlbHRhUGVyYyxkZWx0YVRpbWUpKTtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcclxuICAgICAgICAgIF90aGlzLmRyYXcoZW5kUGVyYyk7XHJcbiAgICAgICAgICBpZiAoX3RoaXMuc2Nyb2xsQ29udHJvbGxlcilcclxuICAgICAgICAgICAgX3RoaXMuc2Nyb2xsQ29udHJvbGxlci5lbmFibGUoKTtcclxuICAgICAgICAgIC8vIGdldCBiYWNrIG91dCBvZiB0aGUgbG9vcFxyXG4gICAgICAgICAgbG9vcC5yZW1vdmVGdW5jdGlvbihhbmltYXRpb25Gbik7XHJcbiAgICAgICAgICBpZiAoY2IpXHJcbiAgICAgICAgICAgIGNiKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBsb29wLmFkZEZ1bmN0aW9uKGFuaW1hdGlvbkZuKTtcclxuICB9LFxyXG4gIGFuaW1JbjogZnVuY3Rpb24gKHRpbWUsIGNiKSB7XHJcbiAgICAvLyBhbmltYXRlIHRoZSBjYW52YXMgZnJvbSBpbkVhc2VTdGFydCB0byBjdXJyZW50IHNjcm9sbCBwb3NcclxuICAgIC8vIGNoZWNrIGlmIHdlIGV2ZW4gbmVlZCB0b1xyXG4gICAgdmFyIGVuZFBlcmMgPSB0aGlzLmdldFBlcmNlbnRhZ2VGcm9tU2Nyb2xsKCk7XHJcbiAgICBpZiAoZW5kUGVyYyA8IHRoaXMuc2V0dGluZ3MuaW5FYXNlU3RhcnQpXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICB0aGlzLmFuaW0odGhpcy5zZXR0aW5ncy5pbkVhc2VTdGFydCwgZW5kUGVyYywgdGltZSwgZWFzZXMuZWFzZU91dCwgY2IpO1xyXG4gIH0sXHJcbiAgYW5pbU91dDogZnVuY3Rpb24gKHRpbWUsIGNiKSB7XHJcbiAgICAvLyBhbmltYXRlIHRoZSBjYW52YXMgZnJvbSBpbkVhc2VTdGFydCB0byBjdXJyZW50IHNjcm9sbCBwb3NcclxuICAgIC8vIGNoZWNrIGlmIHdlIGV2ZW4gbmVlZCB0b1xyXG4gICAgdmFyIHN0YXJ0UGVyYyA9IHRoaXMuZ2V0UGVyY2VudGFnZUZyb21TY3JvbGwoKTtcclxuICAgIGlmIChzdGFydFBlcmMgPCB0aGlzLnNldHRpbmdzLmluRWFzZVN0YXJ0KVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgdGhpcy5hbmltKHN0YXJ0UGVyYywgdGhpcy5zZXR0aW5ncy5pbkVhc2VTdGFydCwgdGltZSwgZWFzZXMuZWFzZUluLCBjYik7XHJcbiAgfVxyXG59XHJcblxyXG4vLyB0ZW1wIGF1dG8gaW5pdFxyXG4vLyB2YXIgaHRyRWxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmhhbGZ0b25lJyk7XHJcbi8vIHZhciBodHJzID0gW107XHJcbi8vIGZvciAodmFyIGkgPSAwLCBsZW4gPSBodHJFbHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuLy8gICBodHJzLnB1c2gobmV3IEhhbGZ0b25lKGh0ckVsc1tpXSwgeyBmYWRlOiAxMiwgZml4ZWQ6IGZhbHNlIH0pKTtcclxuLy8gfVxyXG4vLyB3aW5kb3cuaHRycyA9IGh0cnM7XHJcbm1vZHVsZS5leHBvcnRzID0gSGFsZnRvbmU7XHJcbiIsIi8qKlxyXG4gKiAgY29udHJvbHMgaWxsdXN0cmF0aW9uc1xyXG4gKi9cclxuLy8gcmVxdWlyZW1lbnRzXHJcbnZhciBIYWxmdG9uZSA9IHJlcXVpcmUoJ29iamVjdHMvaGFsZnRvbmUnKTtcclxudmFyIGVhc2VzID0gcmVxdWlyZSgnbGliL2Vhc2UnKTtcclxuXHJcbi8vIHNldHRpbmdzXHJcbnZhciBJTExVU1RSQVRJT05fSEFMRlRPTkVfU0VUVElOR1MgPSB7XHJcbiAgZmFkZTogMCxcclxuICBmaXhlZDogdHJ1ZSxcclxuICBpbkVhc2VTdGFydDogMCxcclxuICBpbkVhc2VFbmQ6IC40NSxcclxuICBpbkVhc2VGbjogZWFzZXMubGluZWFyLFxyXG4gIG91dEVhc2VTdGFydDogLjU1LFxyXG4gIG91dEVhc2VFbmQ6IDEsXHJcbiAgaW1hZ2VTaXppbmc6ICdjb250YWluJyxcclxuICBtaW5CcmVha3BvaW50OiAyXHJcbn07XHJcblxyXG4vKipcclxuICogIElsbHVzdHJhdGlvbiBvYmplY3RcclxuICogIEBwYXJhbSB7SFRNTEVsZW1lbnR9XHJcbiAqL1xyXG52YXIgSWxsdXN0cmF0aW9uID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcclxuICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xyXG4gIHRoaXMuaW1hZ2UgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5pbGx1c3RyYXRpb25fX2ltYWdlJyk7XHJcbiAgdGhpcy5oYWxmdG9uZSA9IG5ldyBIYWxmdG9uZSh0aGlzLmltYWdlLCBJTExVU1RSQVRJT05fSEFMRlRPTkVfU0VUVElOR1MpO1xyXG59XHJcblxyXG4vLyBpbml0XHJcbnZhciBpbGx1c3RyYXRpb25FbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuaWxsdXN0cmF0aW9uJyk7XHJcbmZvciAodmFyIGkgPSAwLCBsZW4gPSBpbGx1c3RyYXRpb25FbHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICBuZXcgSWxsdXN0cmF0aW9uKGlsbHVzdHJhdGlvbkVsc1tpXSk7XHJcbn1cclxuIiwiLyoqXHJcbiAqICBUaGUgTXkgVGl0bGVzIHRveVxyXG4gKi9cclxuLy8gcmVxdWlyZW1lbnRzXHJcbnZhciBIYWxmdG9uZSA9IHJlcXVpcmUoJ29iamVjdHMvaGFsZnRvbmUnKTtcclxudmFyIGVhc2VzID0gcmVxdWlyZSgnbGliL2Vhc2UnKTtcclxudmFyIHdpbmRvd1NpemUgPSByZXF1aXJlKCdsaWIvZ2V0V2luZG93U2l6ZScpO1xyXG5cclxuLy8gc2V0dGluZ3NcclxudmFyIEhBTEZUT05FX1NFVFRJTkdTID0ge1xyXG4gIGluRWFzZUZuOiBlYXNlcy5lYXNlT3V0LFxyXG4gIGluRWFzZVN0YXJ0OiAtLjEsXHJcbiAgaW5FYXNlRW5kOiAuNSxcclxuICBvdXRFYXNlRm46IGVhc2VzLmVhc2VJbixcclxuICBvdXRFYXNlU3RhcnQ6IC41LFxyXG4gIG91dEVhc2VFbmQ6IDEuMSxcclxuICBmYWRlOiAxLFxyXG4gIGZpbGw6ICcjMDExQzFGJyxcclxuICBtYXhSYWRpdXM6IDksXHJcbiAgY29udHJvbDogJ25vbmUnLFxyXG4gIGluaXRpYWxEcmF3UGVyY2VudGFnZTogMFxyXG59XHJcbnZhciBBTklNX1RJTUUgPSAxMDAwMDtcclxuXHJcbi8qKlxyXG4gKiAgTXlUaXRsZXNcclxuICogIEBwYXJhbSB7SFRNTEVsZW1lbnR9XHJcbiAqL1xyXG52YXIgTXlUaXRsZXMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xyXG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XHJcblxyXG4gIHRoaXMuaGFsZnRvbmVzID0gW107XHJcbiAgdGhpcy5oYWxmdG9uZXMucHVzaChuZXcgSGFsZnRvbmUoZWxlbWVudCwgSEFMRlRPTkVfU0VUVElOR1MsICcvaW1hZ2VzL2RvdHNpemUtbXVzaWNpYW4uanBnJykpO1xyXG4gIHRoaXMuaGFsZnRvbmVzLnB1c2gobmV3IEhhbGZ0b25lKGVsZW1lbnQsIEhBTEZUT05FX1NFVFRJTkdTLCAnL2ltYWdlcy9kb3RzaXplLWdvYWxpZS5qcGcnKSk7XHJcbiAgdGhpcy5oYWxmdG9uZXMucHVzaChuZXcgSGFsZnRvbmUoZWxlbWVudCwgSEFMRlRPTkVfU0VUVElOR1MsICcvaW1hZ2VzL2RvdHNpemUtZ2Vlay5qcGcnKSk7XHJcbiAgLy8gZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuaGFsZnRvbmVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgLy8gICB0aGlzLmhhbGZ0b25lc1tpXS5kcmF3KDApO1xyXG4gIC8vIH1cclxuICB2YXIgaW5kZXggPSAtMTtcclxuICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gIGZ1bmN0aW9uIGFuaW1OZXh0ICgpIHtcclxuICAgIGluZGV4ID0gKGluZGV4ICsgMSkgJSBfdGhpcy5oYWxmdG9uZXMubGVuZ3RoO1xyXG4gICAgLy9jb25zb2xlLmxvZyhpbmRleCk7XHJcbiAgICBfdGhpcy5oYWxmdG9uZXNbaW5kZXhdLmFuaW0oMCwxLEFOSU1fVElNRSxlYXNlcy5saW5lYXIpO1xyXG4gIH1cclxuICAvL3RoaXMuaGFsZnRvbmVzWzBdLmFuaW0oLjUsMSxBTklNX1RJTUUgLyAyLGVhc2VzLmxpbmVhcik7XHJcbiAgYW5pbU5leHQoKTtcclxuICB3aW5kb3cuc2V0SW50ZXJ2YWwoYW5pbU5leHQsQU5JTV9USU1FICogLjgpO1xyXG59XHJcblxyXG52YXIgbXlUaXRsZXNFbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubXktdGl0bGVzJyk7XHJcbmZvciAodmFyIGkgPSAwLCBsZW4gPSBteVRpdGxlc0Vscy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gIG5ldyBNeVRpdGxlcyhteVRpdGxlc0Vsc1tpXSk7XHJcbn1cclxuIiwiLyoqXHJcbiAqICBTY3JvbGxzIHRoZSBzY3JlZW4gdG8gdGhlIHRvcCBvZiAuaGVhZGVyLW1haW4gb24gbG9hZCBpZiBwYWdlVHlwZSBpcyBkZWZpbmVkXHJcbiAqL1xyXG4vLyByZXF1aXJlbWVudHNcclxudmFyIGdldFNjcm9sbFBvcyA9IHJlcXVpcmUoJ2xpYi9nZXRTY3JvbGxQb3MnKTtcclxudmFyIGFuaW1hdGVTY3JvbGxUbyA9IHJlcXVpcmUoJ2xpYi9hbmltYXRlU2Nyb2xsVG8nKTtcclxuXHJcbi8vIGRvIGl0IHJpZ2h0IGF3YXlcclxudmFyIGhlYWRlck1haW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuaGVhZGVyLW1haW4nKTtcclxudmFyIHBhZ2VUeXBlID0gZG9jdW1lbnQuYm9keS5nZXRBdHRyaWJ1dGUoJ2RhdGEtcGFnZS10eXBlJyk7XHJcblxyXG5pZiAocGFnZVR5cGUgJiYgcGFnZVR5cGUgIT09ICdpbmRleCcgJiYgaGVhZGVyTWFpbikge1xyXG4gIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgIGlmIChnZXRTY3JvbGxQb3MoKSA8IDUwKVxyXG4gICAgICBhbmltYXRlU2Nyb2xsVG8oaGVhZGVyTWFpbiwgbnVsbCwgbnVsbCwgNjAwLCAwKTtcclxuICB9LCB3aW5kb3cuc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbSgnc2Vlbk5hdicpID8gMTAwIDogNjAwKTtcclxuICB3aW5kb3cuc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgnc2Vlbk5hdicsdHJ1ZSk7XHJcbn1cclxuIiwiLyoqXG4gKiAgc2NyaXB0cy5qc1xuICogIFRoaXMgc2hvdWxkIGluY2x1ZGUgb2JqZWN0cywgd2hpY2ggaW4gdHVybiBpbmNsdWRlIHRoZSBsaWIgZmlsZXMgdGhleSBuZWVkLlxuICogIFRoaXMga2VlcHMgdXMgdXNpbmcgYSBtb2R1bGFyIGFwcHJvYWNoIHRvIGRldiB3aGlsZSBhbHNvIG9ubHkgaW5jbHVkaW5nIHRoZVxuICogIHBhcnRzIG9mIHRoZSBsaWJyYXJ5IHdlIG5lZWQuXG4gKi9cbi8vIG9iamVjdHNcbnJlcXVpcmUoJ29iamVjdHMvc2Nyb2xsT25Mb2FkJyk7XG5yZXF1aXJlKCdvYmplY3RzL2FydGljbGUnKTtcbnJlcXVpcmUoJ29iamVjdHMvaWxsdXN0cmF0aW9uJyk7XG5yZXF1aXJlKCdvYmplY3RzL2Zvb3RlcicpO1xucmVxdWlyZSgnb2JqZWN0cy9teVRpdGxlcycpO1xuIl19
