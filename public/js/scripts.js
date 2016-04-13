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
    if (!this.canvas || percentage == this.lastDrawnPercentage) {
      return false;
    }
    else if (percentage < this.settings.inEaseStart || percentage > this.settings.outEaseEnd) {
      // fix for chrome rendering error from stacking canvases
      if (this.settings.fixed) {
        this.canvas.style.display = 'none';
      }
      return false;
    }

    this.canvas.style.display = 'block';

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
      this.canvas.style.top = this.settings.fade * this.settings.maxRadius * -1 - (this.settings.maxRadius / 2) + 'px';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYW5pbWF0ZVNjcm9sbFRvLmpzIiwibGliL2JyZWFrcG9pbnRzLmpzIiwibGliL2Vhc2UuanMiLCJsaWIvZ2V0UGFnZU9mZnNldC5qcyIsImxpYi9nZXRTY3JvbGxQb3MuanMiLCJsaWIvZ2V0V2luZG93U2l6ZS5qcyIsImxpYi9sb29wLmpzIiwibGliL3Njcm9sbENvbnRyb2xsZXIuanMiLCJsaWIvc2V0VHJhbnNmb3JtLmpzIiwib2JqZWN0cy9hcnRpY2xlLmpzIiwib2JqZWN0cy9mb290ZXIuanMiLCJvYmplY3RzL2hhbGZ0b25lLmpzIiwib2JqZWN0cy9pbGx1c3RyYXRpb24uanMiLCJvYmplY3RzL215VGl0bGVzLmpzIiwib2JqZWN0cy9zY3JvbGxPbkxvYWQuanMiLCJzY3JpcHRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMWRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqICBBbmltYXRlcyB3aW5kb3cgc2Nyb2xsIHRvIGFuIGVsZW1lbnQgb3Igc2Nyb2xsWVxuICovXG5cbi8vIHJlcXVpcmVtZW50c1xudmFyIGxvb3AgPSByZXF1aXJlKCdsaWIvbG9vcCcpO1xudmFyIGdldFBhZ2VPZmZzZXQgPSByZXF1aXJlKCdsaWIvZ2V0UGFnZU9mZnNldCcpO1xudmFyIGdldFNjcm9sbFBvcyA9IHJlcXVpcmUoJ2xpYi9nZXRTY3JvbGxQb3MnKTtcbnZhciBlYXNlcyA9IHJlcXVpcmUoJ2xpYi9lYXNlJyk7XG5cbi8vIHNldHRpbmdzXG52YXIgZGVmYXVsdE9mZnNldFRvcCA9IDQ4O1xudmFyIGRlZmF1bHRBbmltVGltZSA9IDEwMDA7XG52YXIgYW5pbVRpbWU7XG5cbi8vIGRvIHRoaW5ncyFcbi8qKlxuICogIHRoZSBmdW5jdGlvbiB0aGF0IGdvZXMgaW4gdGhlIGxvb3BcbiAqL1xudmFyIHN0YXJ0VGltZSwgc3RhcnRQb3MsIGVuZFBvcztcbnZhciBhbmltRm4gPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgaWYgKG5vdyAtIHN0YXJ0VGltZSA8IGFuaW1UaW1lKVxuICAgIHdpbmRvdy5zY3JvbGxUbygwLCBlYXNlcy5lYXNlSW5PdXQoc3RhcnRQb3MsIGVuZFBvcyAtIHN0YXJ0UG9zLCAobm93IC0gc3RhcnRUaW1lKSAvIGFuaW1UaW1lKSk7XG4gIGVsc2Uge1xuICAgIHdpbmRvdy5zY3JvbGxUbygwLCBlbmRQb3MpO1xuICAgIGxvb3AucmVtb3ZlRnVuY3Rpb24oYW5pbUZuKTtcbiAgfVxufVxuXG4vKipcbiAqICBTY3JvbGwgdG8gZWxlbWVudCBvciBudW1iZXJcbiAqICBAcGFyYW0ge0hUTUxFbGVtZW50IG9yIHN0cmluZyhpZCBvZiBlbGVtZW50KSBvciBudW1iZXJ9XG4gKiAgW0BwYXJhbSB7bnVtYmVyfV0gcG9zaXRpb24gdG8gc3RhcnQgc2Nyb2xsaW5nIGZyb21cbiAqICBbQHBhcmFtIHtib29sZWFufV0gcGFzcyBmYWxzZSB0byBza2lwIGFuaW1hdGlvblxuICogIFtAcGFyYW0ge251bWJlcn1dIHRpbWUgZm9yIGFuaW1hdGlvblxuICogIFtAcGFyYW0ge251bWJlcn1dIG9mZnNldCBmcm9tIHRvcFxuICovXG52YXIgc2Nyb2xsVG8gPSBmdW5jdGlvbiAoZGVzdCwgc2Nyb2xsUG9zLCBhbmltLCB0aW1lLCBvZmZzZXQpIHtcbiAgaWYgKHR5cGVvZiBkZXN0ID09PSAnc3RyaW5nJykge1xuICAgIGRlc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZXN0LnJlcGxhY2UoJyMnLCcnKSk7XG4gIH1cbiAgaWYgKHR5cGVvZiBkZXN0ICE9PSAnbnVtYmVyJykge1xuICAgIHRyeSB7XG4gICAgICBkZXN0ID0gZ2V0UGFnZU9mZnNldChkZXN0KS50b3AgLSAoaXNOYU4ob2Zmc2V0KSA/IGRlZmF1bHRPZmZzZXRUb3AgOiBvZmZzZXQpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGxvb3AucmVtb3ZlRnVuY3Rpb24oYW5pbUZuKTtcbiAgaWYgKGFuaW0gIT09IGZhbHNlKSB7XG4gICAgc3RhcnRQb3MgPSBzY3JvbGxQb3MgfHwgZ2V0U2Nyb2xsUG9zKCk7XG4gICAgZW5kUG9zID0gZGVzdDtcbiAgICBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICBhbmltVGltZSA9IHRpbWUgfHwgZGVmYXVsdEFuaW1UaW1lO1xuXG4gICAgbG9vcC5hZGRGdW5jdGlvbihhbmltRm4pO1xuICB9XG4gIGVsc2Uge1xuICAgIHdpbmRvdy5zY3JvbGxUbygwLCBkZXN0KTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNjcm9sbFRvO1xuIiwidmFyIGJwcyA9IFs3MjAsOTYwLDEyMDAsMTY4MF07XG5cbnZhciB3aW5kb3dTaXplID0gcmVxdWlyZSgnbGliL2dldFdpbmRvd1NpemUnKTtcblxudmFyIGdldEJyZWFrcG9pbnQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzaXplID0gd2luZG93U2l6ZS53aWR0aCgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJwcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChicHNbaV0gPiBzaXplKVxuICAgICAgcmV0dXJuIGk7XG4gIH1cbiAgcmV0dXJuIGJwcy5sZW5ndGg7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0QnJlYWtwb2ludDtcbiIsIi8vIGEgYnVuY2ggb2YgZWFzaW5nIGZ1bmN0aW9ucyBmb3IgbWFraW5nIGFuaW1hdGlvbnNcbi8vIGFsbCBhY2NlcHQgc3RhcnQsIGNoYW5nZSwgYW5kIHBlcmNlbnRcblxudmFyIGVhc2VzID0ge1xuICAnZWFzZUluT3V0JyA6IGZ1bmN0aW9uIChzLGMscCkge1xuICAgIGlmIChwIDwgLjUpIHtcbiAgICAgIHJldHVybiBzICsgYyAqICgyICogcCAqIHApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBzICsgYyAqICgtMiAqIChwIC0gMSkgKiAocCAtIDEpICsgMSk7XG4gICAgfVxuICB9LFxuICAnZWFzZUluJyA6IGZ1bmN0aW9uIChzLGMscCkge1xuICAgIHJldHVybiBzICsgYyAqIHAgKiBwO1xuICB9LFxuICAnZWFzZUluQ3ViaWMnIDogZnVuY3Rpb24gKHMsYyxwKSB7XG4gICAgcmV0dXJuIHMgKyBjICogKHAgKiBwICogcCk7XG4gIH0sXG4gICdlYXNlT3V0JyA6IGZ1bmN0aW9uIChzLGMscCkge1xuICAgIHJldHVybiBzICsgYyAqICgtMSAqIChwIC0gMSkgKiAocCAtIDEpICsgMSk7XG4gIH0sXG4gICdlYXNlT3V0Q3ViaWMnIDogZnVuY3Rpb24gKHMsYyxwKSB7XG4gICAgcmV0dXJuIHMgKyBjICogKChwIC0gMSkgKiAocCAtIDEpICogKHAgLSAxKSArIDEpO1xuICB9LFxuICAnbGluZWFyJyA6IGZ1bmN0aW9uIChzLGMscCkge1xuICAgIHJldHVybiBzICsgYyAqIHA7XG4gIH1cbn1cbm1vZHVsZS5leHBvcnRzID0gZWFzZXM7XG4iLCIvKipcbiAqICBGdW5jdGlvbjogb3MuZ2V0UGFnZU9mZnNldFxuICogIGdldHMgdGhlIHBhZ2Ugb2Zmc2V0IHRvcCBhbmQgbGVmdCBvZiBhIERPTSBlbGVtZW50XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0UGFnZU9mZnNldCAoZWxlbWVudCkge1xuICBpZiAoIWVsZW1lbnQpIHtcbiAgICBjb25zb2xlLmVycm9yKCdnZXRQYWdlT2Zmc2V0IHBhc3NlZCBhbiBpbnZhbGlkIGVsZW1lbnQ6JywgZWxlbWVudCk7XG4gIH1cbiAgdmFyIHBhZ2VPZmZzZXRYID0gZWxlbWVudC5vZmZzZXRMZWZ0LFxuICBwYWdlT2Zmc2V0WSA9IGVsZW1lbnQub2Zmc2V0VG9wO1xuXG4gIHdoaWxlIChlbGVtZW50ID0gZWxlbWVudC5vZmZzZXRQYXJlbnQpIHtcbiAgICBwYWdlT2Zmc2V0WCArPSBlbGVtZW50Lm9mZnNldExlZnQ7XG4gICAgcGFnZU9mZnNldFkgKz0gZWxlbWVudC5vZmZzZXRUb3A7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGxlZnQgOiBwYWdlT2Zmc2V0WCxcbiAgICB0b3AgOiBwYWdlT2Zmc2V0WVxuICB9XG59XG4iLCIvKipcbiAqICBnZXRTY3JvbGxQb3NcbiAqXG4gKiAgY3Jvc3MgYnJvd3NlciB3YXkgdG8gZ2V0IHNjcm9sbFRvcFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAodW5kZWZpbmVkKSB7XG4gIGlmICh3aW5kb3cuc2Nyb2xsWSAhPT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBmdW5jdGlvbiBnZXRTY3JvbGxQb3MgKCkgeyByZXR1cm4gd2luZG93LnNjcm9sbFk7IH1cbiAgZWxzZVxuICAgIHJldHVybiBmdW5jdGlvbiBnZXRTY3JvbGxQb3MgKCkgeyByZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcDsgfVxufSkoKTtcbiIsIi8qKlxuICogIGdldCB3aW5kb3cgc2l6ZSwgY3Jvc3MgYnJvd3NlciBmcmllbmRseVxuICogIGNhbGwgLndpZHRoKCkgb3IgLmhlaWdodCgpIHRvIGdldCB0aGUgcmVsZXZhbnQgdmFsdWUgaW4gcGl4ZWxzXG4gKi9cbnZhciB3aW5kb3dIZWlnaHQgPSBmdW5jdGlvbiB3aW5kb3dIZWlnaHQgKCkge1xuICByZXR1cm4gd2luZG93LmlubmVySGVpZ2h0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XG59O1xudmFyIHdpbmRvd1dpZHRoID0gZnVuY3Rpb24gd2luZG93V2lkdGggKCkge1xuICByZXR1cm4gd2luZG93LmlubmVyV2lkdGggfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHdpZHRoOiB3aW5kb3dXaWR0aCxcbiAgaGVpZ2h0OiB3aW5kb3dIZWlnaHRcbn1cbiIsIi8qKlxuICogIExvb3BcbiAqXG4gKiAgVGhlIHJlcXVlc3RBbmltYXRpb25GcmFtZSBMb29wLiBJdCBoYW5kbGVzIGFuaW1hdGlvbiBhbmQgc3RhdGUgY2hhbmdlc1xuICogIHJlbGF0ZWQgdG8gc2Nyb2xsaW5nIG9yIHdpbmRvdyBzaXppbmcuIEl0IGNhbiBhbHNvIGJlIHVzZWQgZm9yIHJlZ3VsYXIganNcbiAqICBkcml2ZW4gYW5pbWF0aW9uIGFzIHdlbGwuXG4gKlxuICogIFRvIHVzZTpcbiAqICAgIGV4cG9ydHMuYWRkU2Nyb2xsRnVuY3Rpb24oZm4pIC0gYWRkcyBhIGZ1bmN0aW9uIHRvIGZpcmUgd2hlbmV2ZXIgc2Nyb2xsXG4gKiAgICAgIHBvc2l0aW9uIGNoYW5nZXNcbiAqICAgIGV4cG9ydHMuYWRkUmVzaXplRnVuY3Rpb24oZm4pIC0gYWRkcyBhIGZ1bmN0aW9uIHRvIGZpcmUgd2hlbmV2ZXIgdGhlXG4gKiAgICAgIHdpbmRvdyBpcyByZXNpemVkLCBkZWJvdW5jZWQgYnkgdGhlIHZhbHVlIG9mIHRoZSByZXNpemVEZWJvdW5jZSB2YXJcbiAqICAgIGV4cG9ydHMuYWRkRnVuY3Rpb24oZm4pIC0gYWRkcyBhIGZ1bmN0aW9uIHRvIGZpcmUgb24gZXZlcnkgaXRlcmF0aW9uIG9mXG4gKiAgICAgIHRoZSBsb29wLiBMaW1pdCB0aGUgdXNlIG9mIHRoaXNcbiAqICAgIGV4cG9ydHMucmVtb3ZlRnVuY3Rpb24oZm4pIC0gcmVtb3ZlcyBhIGZ1bmN0aW9uIGZyb20gdGhlIGxpc3Qgb2YgZnVuY3Rpb25zXG4gKiAgICAgIHRvIGZpcmVcbiAqICAgIGV4cG9ydHMuc3RhcnQoKSAtIHN0YXJ0cyB0aGUgbG9vcCAoZG9lc24ndCBuZWVkIHRvIGJlIGNhbGxlZCB1bmxlc3MgdGhlXG4gKiAgICAgIGxvb3Agd2FzIHN0b3BwZWQgYXQgc29tZSBwb2ludClcbiAqICAgIGV4cG9ydHMuc3RvcCgpIC0gc3RvcHMgdGhlIGxvb3BcbiAqICAgIGV4cG9ydHMuZm9yY2UoKSAtIGZvcmNlcyB0aGUgbmV4dCBpdGVyYXRpb24gb2YgdGhlIGxvb3AgdG8gZmlyZSBzY3JvbGwgYW5kXG4gKiAgICAgIHJlc2l6ZSBmdW5jdGlvbnMsIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciBvciBub3QgZWl0aGVyIHRoaW5ncyBhY3R1YWxseVxuICogICAgICBoYXBwZW5lZFxuICovXG5cbi8qKlxuICogUHJvdmlkZXMgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIGluIGEgY3Jvc3MgYnJvd3NlciB3YXkuXG4gKiBAYXV0aG9yIHBhdWxpcmlzaCAvIGh0dHA6Ly9wYXVsaXJpc2guY29tL1xuICovXG5pZiAoICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICkge1xuXHR3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gKCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuXHRcdHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHR3aW5kb3cub1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuXHRcdHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuXHRcdGZ1bmN0aW9uKCAvKiBmdW5jdGlvbiBGcmFtZVJlcXVlc3RDYWxsYmFjayAqLyBjYWxsYmFjayApIHtcblx0XHRcdHdpbmRvdy5zZXRUaW1lb3V0KCBjYWxsYmFjaywgMTAwMCAvIDYwICk7XG5cdFx0fTtcblx0fSApKCk7XG59XG5cbjsoZnVuY3Rpb24gKGRvY3VtZW50LHdpbmRvdyx1bmRlZmluZWQpIHtcblxuICAvLyBvdGhlciBsaWIgaGVscGVyc1xuICB2YXIgZ2V0U2Nyb2xsUG9zID0gcmVxdWlyZSgnbGliL2dldFNjcm9sbFBvcycpO1xuXG4gIC8vIHByaXZhdGUgdmFyc1xuICB2YXIgcnVubmluZyA9IHRydWUsXG4gICAgICBsYXN0Qm9keVdpZHRoID0gZG9jdW1lbnQuYm9keS5vZmZzZXRXaWR0aCwgLy8gc3RvcmUgd2lkdGggdG8gZGV0ZXJtaW5lIGlmIHJlc2l6ZSBuZWVkZWRcbiAgICAgIGxhc3RCb2R5SGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5vZmZzZXRIZWlnaHQsIC8vIHN0b3JlIGhlaWdodCB0byBkZXRlcm1pbmUgaWYgcmVzaXplIG5lZWRlZFxuICAgICAgbGFzdFNjcm9sbCA9IC0xLFxuICAgICAgbGFzdFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSwgLy8gbGFzdCB0aW1lIHNvIHdlIGtub3cgaG93IGxvbmcgaXQncyBiZWVuXG4gICAgICByZXNpemVEZWJvdW5jZSA9IDUwMFxuICAgICAgO1xuXG4gIC8vIHNhdmUgdGhlIGZ1bmN0aW9ucyB0aGUgbG9vcCBzaG91bGQgcnVuXG4gIC8vIHdpbGwgYmUgcGFzc2VkIGN1cnJlbnRUaW1lLCB0aW1lQ2hhbmdlXG4gIHZhciBsb29wRnVuY3MgPSB7XG4gICAgcmVzaXplIDogW10sIC8vIGZ1bmN0aW9ucyB0byBydW4gb24gcmVzaXplXG4gICAgc2Nyb2xsIDogW10sIC8vIGZ1bmN0aW9ucyB0byBydW4gb24gc2Nyb2xsXG4gICAgdGljayA6IFtdIC8vIGZ1bmN0aW9ucyB0byBydW4gZXZlcnkgdGlja1xuICB9O1xuXG4gIC8vIGFkZC9yZW1vdmUgbWV0aG9kcyBmb3IgdGhvc2UgZnVuY3Rpb25zXG4gIHZhciBhZGRMb29wRnVuY3Rpb24gPSBmdW5jdGlvbiBhZGRMb29wRnVuY3Rpb24gKHR5cGUsIGZuKSB7XG4gICAgaWYgKGxvb3BGdW5jc1t0eXBlXS5pbmRleE9mKGZuKSA9PT0gLTEpIHsgLy8gbWFrZSBzdXJlIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdCAob25seSB3b3JrcyB3aXRoIG5vbi1hbm9ueW1vdXMgZnVuY3Rpb25zKVxuICAgICAgbG9vcEZ1bmNzW3R5cGVdLnB1c2goZm4pO1xuXHRcdFx0c3RhcnQoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIGFkZFNjcm9sbEZ1bmN0aW9uID0gZnVuY3Rpb24gYWRkU2Nyb2xsRnVuY3Rpb24gKGZuKSB7XG4gICAgcmV0dXJuIGFkZExvb3BGdW5jdGlvbignc2Nyb2xsJyxmbik7XG4gIH1cbiAgdmFyIGFkZFJlc2l6ZUZ1bmN0aW9uID0gZnVuY3Rpb24gYWRkUmVzaXplRnVuY3Rpb24gKGZuKSB7XG4gICAgcmV0dXJuIGFkZExvb3BGdW5jdGlvbigncmVzaXplJyxmbik7XG4gIH1cbiAgdmFyIGFkZEZ1bmN0aW9uID0gZnVuY3Rpb24gYWRkRnVuY3Rpb24gKGZuKSB7XG4gICAgcmV0dXJuIGFkZExvb3BGdW5jdGlvbigndGljaycsZm4pO1xuICB9XG4gIHZhciByZW1vdmVGdW5jdGlvbiA9IGZ1bmN0aW9uIHJlbW92ZUZ1bmN0aW9uIChmbikge1xuICAgIHZhciB0eXBlcyA9IFsncmVzaXplJywnc2Nyb2xsJywndGljayddO1xuICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBpbmRleCA9IGxvb3BGdW5jc1t0eXBlc1tpXV0uaW5kZXhPZihmbik7XG4gICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgIGxvb3BGdW5jc1t0eXBlc1tpXV0uc3BsaWNlKGluZGV4LDEpO1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblx0XHQvLyBjaGVjayB0aGF0IHdlJ3JlIHN0aWxsIGxpc3RlbmluZ1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChsb29wRnVuY3NbdHlwZXNbaV1dLmxlbmd0aClcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRlbHNlIGlmIChpID09PSB0eXBlcy5sZW5ndGggLSAxKVxuXHRcdFx0XHRzdG9wKCk7XG5cdFx0fVxuICAgIHJldHVybiBmb3VuZDtcbiAgfVxuXG4gIC8vIGRvIGFsbCBmdW5jdGlvbnMgb2YgYSBnaXZlbiB0eXBlXG4gIHZhciBkb0xvb3BGdW5jdGlvbnMgPSBmdW5jdGlvbiBkb0xvb3BGdW5jdGlvbnMgKHR5cGUsY3VycmVudFRpbWUpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gbG9vcEZ1bmNzW3R5cGVdLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAobG9vcEZ1bmNzW3R5cGVdW2ldKSAvLyBleHRyYSBjaGVjayBmb3Igc2FmZXR5XG4gICAgICBcdGxvb3BGdW5jc1t0eXBlXVtpXS5jYWxsKHdpbmRvdyxjdXJyZW50VGltZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gc3RhcnQvc3RvcCBjb250cm9sXG4gIHZhciBzdGFydCA9IGZ1bmN0aW9uIHN0YXJ0TG9vcCAoKSB7XG4gICAgcnVubmluZyA9IHRydWU7XG5cdFx0bG9vcEZuKCk7XG4gIH1cbiAgdmFyIHN0b3AgPSBmdW5jdGlvbiBzdG9wTG9vcCAoKSB7XG4gICAgcnVubmluZyA9IGZhbHNlO1xuICB9XG5cbiAgLy8gZm9yY2UgaXQgdG8gZmlyZSBuZXh0IHRpbWUgdGhyb3VnaCBieSBzZXR0aW5nIGxhc3RTY3JvbGwgYW5kIGxhc3RCb2R5V2lkdGhcbiAgLy8gdG8gaW1wb3NzaWJsZSB2YWx1ZXNcbiAgdmFyIGZvcmNlID0gZnVuY3Rpb24gZm9yY2VMb29wICgpIHtcbiAgICBsYXN0Qm9keVdpZHRoID0gLTE7XG4gICAgbGFzdFNjcm9sbCA9IC0xO1xuICB9XG5cbiAgLy8gaG9sZCBhIHJlc2l6ZSB0aW1vdXQgc28gd2UgY2FuIGRlYm91bmNlIGl0XG4gIHZhciByZXNpemVUaW1lb3V0ID0gbnVsbDtcblxuICAvLyB0aGUgcmVhbCBkZWFsIVxuICAvLyBpbiBhIGNsb3N1cmUgZm9yIG1heGltdW0gc2FmZXR5LCBhbmQgc28gaXQgYXV0b3N0YXJ0c1xuICAvLyBub3RlOiBhZnRlciBjaGVja2luZyB1c2luZyBqc3BlcmYsIHJhdGhlciB0aGFuIG1ha2luZyBvbmUgYmlnIHRvZG8gYXJyYXkgb2ZcbiAgLy8gYWxsIHRoZSBmdW5jdGlvbnMsIGl0J3MgZmFzdGVyIHRvIGNhbGwgZWFjaCBhcnJheSBvZiBmdW5jdGlvbnMgc2VwYXJhdGVseVxuICBmdW5jdGlvbiBsb29wRm4oKSB7XG5cbiAgICAvLyBjaGVjayB0aGF0IHdlJ3JlIGFjdHVhbGx5IHJ1bm5pbmcuLi5cbiAgICBpZiAocnVubmluZykge1xuXG4gICAgICB2YXIgY3VycmVudFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgIHZhciB0aW1lQ2hhbmdlID0gY3VycmVudFRpbWUgLSBsYXN0VGltZTtcbiAgICAgIHZhciBjdXJyZW50U2Nyb2xsID0gZ2V0U2Nyb2xsUG9zKCk7XG5cbiAgICAgIC8vIGNoZWNrIGlmIHJlc2l6ZVxuICAgICAgaWYgKGRvY3VtZW50LmJvZHkub2Zmc2V0V2lkdGggIT09IGxhc3RCb2R5V2lkdGggfHwgZG9jdW1lbnQuYm9keS5vZmZzZXRIZWlnaHQgIT09IGxhc3RCb2R5SGVpZ2h0KSB7XG4gICAgICAgIC8vIHJlc2l6ZSBpcyB0cnVlLCBzYXZlIG5ldyBzaXplc1xuICAgICAgICBsYXN0Qm9keVdpZHRoID0gZG9jdW1lbnQuYm9keS5vZmZzZXRXaWR0aDtcbiAgICAgICAgbGFzdEJvZHlIZWlnaHQgPSBkb2N1bWVudC5ib2R5Lm9mZnNldEhlaWdodDtcblxuICAgICAgICBpZiAocmVzaXplVGltZW91dClcbiAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHJlc2l6ZVRpbWVvdXQpO1xuICAgICAgICByZXNpemVUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGRvTG9vcEZ1bmN0aW9ucygncmVzaXplJyxjdXJyZW50VGltZSk7XG4gICAgICAgIH0sIHJlc2l6ZURlYm91bmNlKTtcbiAgICAgIH1cblxuICAgICAgLy8gY2hlY2sgaWYgc2Nyb2xsXG4gICAgICBpZiAobGFzdFNjcm9sbCAhPT0gY3VycmVudFNjcm9sbCkge1xuICAgICAgICAvLyBzY3JvbGwgaXMgdHJ1ZSwgc2F2ZSBuZXcgcG9zaXRpb25cbiAgICAgICAgbGFzdFNjcm9sbCA9IGN1cnJlbnRTY3JvbGw7XG5cbiAgICAgICAgLy8gY2FsbCBlYWNoIGZ1bmN0aW9uXG4gICAgICAgIGRvTG9vcEZ1bmN0aW9ucygnc2Nyb2xsJyxjdXJyZW50VGltZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIGRvIHRoZSBhbHdheXMgZnVuY3Rpb25zXG4gICAgICBkb0xvb3BGdW5jdGlvbnMoJ3RpY2snLGN1cnJlbnRUaW1lKTtcblxuICAgICAgLy8gc2F2ZSB0aGUgbmV3IHRpbWVcbiAgICAgIGxhc3RUaW1lID0gY3VycmVudFRpbWU7XG5cblx0XHRcdC8vIG1ha2Ugc3VyZSB3ZSBkbyB0aGUgdGljayBhZ2FpbiBuZXh0IHRpbWVcblx0ICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wRm4pO1xuICAgIH1cbiAgfTtcblxuICAvLyBleHBvcnQgdGhlIHVzZWZ1bCBmdW5jdGlvbnNcbiAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWRkU2Nyb2xsRnVuY3Rpb246IGFkZFNjcm9sbEZ1bmN0aW9uLFxuICAgIGFkZFJlc2l6ZUZ1bmN0aW9uOiBhZGRSZXNpemVGdW5jdGlvbixcbiAgICBhZGRGdW5jdGlvbjogYWRkRnVuY3Rpb24sXG4gICAgcmVtb3ZlRnVuY3Rpb246IHJlbW92ZUZ1bmN0aW9uLFxuICAgIHN0YXJ0OiBzdGFydCxcbiAgICBzdG9wOiBzdG9wLFxuICAgIGZvcmNlOiBmb3JjZVxuICB9XG5cbn0pKGRvY3VtZW50LHdpbmRvdyk7XG4iLCIvKipcbiAqICBVc2VmdWwgY2xhc3MgZm9yIGhhbmRsaW5nIHBhcmFsbGF4aW5nIHRoaW5nc1xuICogIFN0b3JlcyBvYmplY3QgbWVhc3VyZW1lbnRzIGFuZCByZXR1cm5zIHBlcmNlbnRhZ2Ugb2Ygc2Nyb2xsIHdoZW4gYXNrZWRcbiAqL1xuXG4vLyBoZWxwZXJzXG52YXIgZ2V0UGFnZU9mZnNldCA9IHJlcXVpcmUoJ2xpYi9nZXRQYWdlT2Zmc2V0JyksXG4gICAgd2luZG93U2l6ZSA9IHJlcXVpcmUoJ2xpYi9nZXRXaW5kb3dTaXplJyksXG4gICAgZ2V0U2Nyb2xsUG9zID0gcmVxdWlyZSgnbGliL2dldFNjcm9sbFBvcycpLFxuICAgIGxvb3AgPSByZXF1aXJlKCdsaWIvbG9vcCcpXG4gICAgO1xuXG5cbnZhciBQYXJhbGxheCA9IGZ1bmN0aW9uIFBhcmFsbGF4IChlbGVtZW50LCBvblNjcm9sbCkge1xuICBpZiAoIXRoaXMgaW5zdGFuY2VvZiBQYXJhbGxheClcbiAgICByZXR1cm4gbmV3IFBhcmFsbGF4KGVsZW1lbnQpO1xuXG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cbiAgLy8gZ2V0IG1lYXN1cmVtZW50cyBpbW1lZGlhdGVseVxuICB0aGlzLm1lYXN1cmUoKTtcbiAgaWYgKG9uU2Nyb2xsKVxuICAgIG9uU2Nyb2xsKF90aGlzLmdldFBlcmNlbnRhZ2UoKSk7XG5cbiAgLy8gbGlzdGVuZXJzXG4gIHRoaXMub25SZXNpemUgPSBmdW5jdGlvbiBtZWFzdXJlUGFyYWxsYXggKCkge1xuICAgIF90aGlzLm1lYXN1cmUoKTtcbiAgfVxuICBpZiAob25TY3JvbGwpIHtcbiAgICB0aGlzLm9uU2Nyb2xsID0gZnVuY3Rpb24gc2Nyb2xsUGFyYWxsYXggKCkge1xuICAgICAgb25TY3JvbGwuYXBwbHkoX3RoaXMsIFtfdGhpcy5nZXRQZXJjZW50YWdlKCldKTtcbiAgICB9XG4gIH1cblxuICAvLyBzdGFydCAnZXIgdXBcbiAgdGhpcy5lbmFibGUoKTtcbn1cblBhcmFsbGF4LnByb3RvdHlwZSA9IHtcbiAgbWVhc3VyZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBwbyA9IGdldFBhZ2VPZmZzZXQodGhpcy5lbGVtZW50KTtcbiAgICB0aGlzLnRvcCA9IHBvLnRvcCAtIHdpbmRvd1NpemUuaGVpZ2h0KCk7XG4gICAgdGhpcy5ib3R0b20gPSBwby50b3AgKyB0aGlzLmVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xuICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5ib3R0b20gLSB0aGlzLnRvcDtcbiAgfSxcbiAgZ2V0UGVyY2VudGFnZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzY3JvbGxZID0gZ2V0U2Nyb2xsUG9zKCk7XG4gICAgdmFyIHBlcmMgPSAoc2Nyb2xsWSAtIHRoaXMudG9wKSAvICh0aGlzLmhlaWdodCk7XG4gICAgcmV0dXJuIHBlcmM7XG4gIH0sXG4gIGRpc2FibGU6IGZ1bmN0aW9uICgpIHtcbiAgICBsb29wLnJlbW92ZUZ1bmN0aW9uKHRoaXMub25SZXNpemUpO1xuICAgIGlmICh0aGlzLm9uU2Nyb2xsKVxuICAgICAgbG9vcC5yZW1vdmVGdW5jdGlvbih0aGlzLm9uU2Nyb2xsKTtcbiAgfSxcbiAgZW5hYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgbG9vcC5hZGRSZXNpemVGdW5jdGlvbih0aGlzLm9uUmVzaXplKTtcbiAgICBpZiAodGhpcy5vblNjcm9sbClcbiAgICAgIGxvb3AuYWRkU2Nyb2xsRnVuY3Rpb24odGhpcy5vblNjcm9sbCk7XG4gIH0sXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmRpc2FibGUoKTtcbiAgICBkZWxldGUgdGhpcztcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhcmFsbGF4O1xuIiwiLyoqXG4gKiAgU2V0cyBUcmFuc2Zvcm0gc3R5bGVzIGNyb3NzIGJyb3dzZXJcbiAqICBAcGFyYW0ge0hUTUxFbGVtZW50fVxuICogIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBvZiB0aGUgdHJhbnNmb3JtIHN0eWxlXG4gKi9cblxudmFyIHRyYW5zZm9ybUF0dHJpYnV0ZXMgPSBbJ3RyYW5zZm9ybScsJ3dlYmtpdFRyYW5zZm9ybScsJ21velRyYW5zZm9ybScsJ21zVHJhbnNmb3JtJ107XG52YXIgc2V0VHJhbnNmb3JtID0gZnVuY3Rpb24gKGVsZW1lbnQsIHRyYW5zZm9ybVN0cmluZykge1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gdHJhbnNmb3JtQXR0cmlidXRlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGVsZW1lbnQuc3R5bGVbdHJhbnNmb3JtQXR0cmlidXRlc1tpXV0gPSB0cmFuc2Zvcm1TdHJpbmc7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXRUcmFuc2Zvcm07XG4iLCIvKipcclxuICogIEZ1bGwgQXJ0aWNsZSBjb250cm9sbGVyXHJcbiAqL1xyXG5cclxuLy8gcmVxdWlyZW1lbnRzXHJcbnZhciBIYWxmdG9uZSA9IHJlcXVpcmUoJ29iamVjdHMvaGFsZnRvbmUnKTtcclxudmFyIFNjcm9sbENvbnRyb2xsZXIgPSByZXF1aXJlKCdsaWIvc2Nyb2xsQ29udHJvbGxlcicpO1xyXG52YXIgZ2V0U2Nyb2xsUG9zID0gcmVxdWlyZSgnbGliL2dldFNjcm9sbFBvcycpO1xyXG52YXIgZ2V0QnJlYWtwb2ludCA9IHJlcXVpcmUoJ2xpYi9icmVha3BvaW50cycpO1xyXG52YXIgZWFzZXMgPSByZXF1aXJlKCdsaWIvZWFzZScpO1xyXG5cclxuLy8gc2V0dGluZ3NcclxudmFyIEhFQURFUl9IQUxGVE9ORV9TRVRUSU5HUyA9IHtcclxuICBmYWRlOiBnZXRCcmVha3BvaW50KCkgPj0gMiA/IDEyIDogMSxcclxuICBpbkVhc2VTdGFydDogLjFcclxufVxyXG52YXIgSU5ORVJfSEFMRlRPTkVfU0VUVElOR1MgPSB7XHJcbiAgZmFkZTogMCxcclxuICBpbWFnZVNpemluZzogJ2NvbnRhaW4nLFxyXG4gIGluRWFzZVN0YXJ0OiAuMSwgLy8gc2Nyb2xsIHBlcmNlbnRhZ2UgdG8gc3RhcnQgYW5pbWF0aW9uIGluIG9uIGZpcnN0IGRvdFxyXG4gIGluRWFzZUVuZDogLjUsIC8vIHNjcm9sbCBwZXJjZW50YWdlIHRvIGVuZCBhbmltYXRpb24gaW4gb24gbGFzdCBkb3RcclxuICBvdXRFYXNlU3RhcnQ6IC43NSxcclxuICBjb3JuZXJpbmc6IDgsXHJcbiAgbWF4UmFkaXVzOiAxMlxyXG59XHJcbnZhciBSRUxBVEVEX0hBTEZUT05FX1NFVFRJTkdTID0ge1xyXG4gIGZhZGU6IDAsXHJcbiAgaW5FYXNlU3RhcnQ6IC0uNCxcclxuICBpbkVhc2VFbmQ6IC44LFxyXG4gIGluRWFzZUZuOiBlYXNlcy5saW5lYXIsXHJcbiAgb3V0RWFzZVN0YXJ0OiAuNixcclxuICBvdXRFYXNlRW5kOiAxLjIsXHJcbiAgbWF4UmFkaXVzOiAxMlxyXG59XHJcblxyXG4vKipcclxuICogIEFydGljbGUgY2xhc3NcclxuICogIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRoZSB3aG9sZSBkYW1uIGFydGljbGVcclxuICovXHJcbnZhciBBcnRpY2xlID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcclxuICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xyXG5cclxuICAvLyBpbml0IGhlYWRlclxyXG4gIHZhciBoZWFkZXJFbCA9IGVsZW1lbnQucXVlcnlTZWxlY3RvcignLmFydGljbGVfX2hlYWRlcicpO1xyXG4gIGlmIChoZWFkZXJFbCkge1xyXG4gICAgdGhpcy5oZWFkZXIgPSBuZXcgSGFsZnRvbmUoaGVhZGVyRWwsIEhFQURFUl9IQUxGVE9ORV9TRVRUSU5HUyk7XHJcbiAgICAvL3RoaXMuaGVhZGVyLmFuaW1JbigxMjAwKTtcclxuICAgIHdpbmRvdy5oZWFkZXIgPSB0aGlzLmhlYWRlcjtcclxuICB9XHJcblxyXG4gIC8vIGluaXQgb3RoZXIgaGFsZnRvbmVzXHJcbiAgdmFyIGhhbGZ0b25lRWxzID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuaGFsZnRvbmUnKTtcclxuICB0aGlzLmhhbGZ0b25lcyA9IFtdO1xyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBoYWxmdG9uZUVscy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgdmFyIGh0ID0gbmV3IEhhbGZ0b25lKGhhbGZ0b25lRWxzW2ldLCBJTk5FUl9IQUxGVE9ORV9TRVRUSU5HUyk7XHJcbiAgICAvL2h0LmFuaW1JbigxMjAwKTtcclxuICAgIHRoaXMuaGFsZnRvbmVzLnB1c2goaHQpO1xyXG4gIH1cclxuXHJcbiAgdmFyIHJlbGF0ZWRzRWwgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yZWxhdGVkcycpO1xyXG4gIGlmIChyZWxhdGVkc0VsKSB7XHJcbiAgICB0aGlzLmhhbGZ0b25lcy5wdXNoKG5ldyBIYWxmdG9uZShyZWxhdGVkc0VsLCBSRUxBVEVEX0hBTEZUT05FX1NFVFRJTkdTKSk7XHJcbiAgfVxyXG5cclxuICAvLyBidXR0b25zXHJcbiAgLy8gdmFyIGJ1dHRvbkVscyA9IGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmJ1dHRvbicpO1xyXG4gIC8vIHRoaXMuYnV0dG9ucyA9IFtdO1xyXG4gIC8vIGZvciAodmFyIGkgPSAwLCBsZW4gPSBidXR0b25FbHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAvLyAgIHZhciBodCA9IG5ldyBIYWxmdG9uZShidXR0b25FbHNbaV0sIHtcclxuICAvLyAgICAgZmFkZTogMSxcclxuICAvLyAgICAgaW5FYXNlU3RhcnQ6IDAsXHJcbiAgLy8gICAgIGluRWFzZUVuZDogMSxcclxuICAvLyAgICAgb3V0RWFzZVN0YXJ0OiAxLjEsXHJcbiAgLy8gICAgIG91dEVhc2VFbmQ6IDEuMSxcclxuICAvLyAgICAgY29udHJvbDogJ25vbmUnLFxyXG4gIC8vICAgICBmaWxsOiAnIzA0NmM2ZidcclxuICAvLyAgIH0pO1xyXG4gIC8vICAgYnV0dG9uRWxzW2ldLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsZnVuY3Rpb24gKCkge1xyXG4gIC8vICAgICBodC5hbmltKC41LDEsMzAwMCk7XHJcbiAgLy8gICB9LCBmYWxzZSk7XHJcbiAgLy8gICBidXR0b25FbHNbaV0uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLGZ1bmN0aW9uICgpIHtcclxuICAvLyAgICAgaHQuYW5pbSgxLC41LDMwMDApO1xyXG4gIC8vICAgfSwgZmFsc2UpO1xyXG4gIC8vICAgdGhpcy5oYWxmdG9uZXMucHVzaChodCk7XHJcbiAgLy8gfVxyXG5cclxuICAvLyBsaXN0ZW4gZm9yIHdoZW4gdG8gZGVzdHJveVxyXG4gIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgdmFyIG9uU2Nyb2xsID0gZnVuY3Rpb24gKHNjcm9sbFBlcmNlbnRhZ2UpIHtcclxuICAgIGlmIChnZXRTY3JvbGxQb3MoKSA+IHRoaXMuYm90dG9tICsgMzAwKVxyXG4gICAgICBfdGhpcy5kZXN0cm95KHRydWUpO1xyXG4gIH1cclxuICB0aGlzLnNjcm9sbENvbnRyb2xsZXIgPSBuZXcgU2Nyb2xsQ29udHJvbGxlcih0aGlzLmVsZW1lbnQpO1xyXG59XHJcbkFydGljbGUucHJvdG90eXBlID0ge1xyXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uIChpc1Bhc3QpIHtcclxuICAgIHZhciBuZXdTY3JvbGxQb3MgPSBnZXRTY3JvbGxQb3MoKSAtIHRoaXMuZWxlbWVudC5vZmZzZXRIZWlnaHQ7XHJcbiAgICBpZiAodGhpcy5oZWFkZXIpXHJcbiAgICAgIHRoaXMuaGVhZGVyLmRlc3Ryb3koKTtcclxuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmhhbGZ0b25lcy5sZW5ndGg7IGkgPCBsZW47IGkrKylcclxuICAgICAgdGhpcy5oYWxmdG9uZXNbaV0uZGVzdHJveSgpO1xyXG5cclxuICAgIHRoaXMuc2Nyb2xsQ29udHJvbGxlci5kZXN0cm95KCk7XHJcblxyXG4gICAgLy8gZml4IHNjcm9sbCBwb3NpdGlvblxyXG4gICAgaWYgKGlzUGFzdCkge1xyXG4gICAgICB2YXIgcmV0cmllZCA9IGZhbHNlO1xyXG4gICAgICBmdW5jdGlvbiBmaXhTY3JvbGwgKCkge1xyXG4gICAgICAgIHdpbmRvdy5zY3JvbGxUbygwLG5ld1Njcm9sbFBvcyk7XHJcbiAgICAgIH1cclxuICAgICAgZml4U2Nyb2xsKCk7XHJcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShmaXhTY3JvbGwpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5lbGVtZW50LnJlbW92ZSgpO1xyXG4gICAgLy9kZWxldGUgdGhpcztcclxuICB9XHJcbn1cclxuXHJcbi8vIHRlbXAgaW5pdCBhcnRpY2xlXHJcbnZhciBhcnRpY2xlRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYXJ0aWNsZScpO1xyXG5pZiAoYXJ0aWNsZUVsKVxyXG4gIG5ldyBBcnRpY2xlKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hcnRpY2xlJykpO1xyXG4iLCIvLyByZXF1aXJlbWVudHNcclxudmFyIEhhbGZ0b25lID0gcmVxdWlyZSgnb2JqZWN0cy9oYWxmdG9uZScpO1xyXG52YXIgZWFzZXMgPSByZXF1aXJlKCdsaWIvZWFzZScpO1xyXG5cclxuLy8gc2V0dGluZ3NcclxuXHJcbi8vIGluaXQgZm9vdGVyIGhhbGZ0b25lXHJcbnZhciBmb290ZXJIYWxmdG9uZUVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmZvb3Rlci1tYWluX19oYWxmdG9uZScpO1xyXG5pZiAoZm9vdGVySGFsZnRvbmVFbCkge1xyXG4gIHZhciBmb290ZXJIYWxmdG9uZSA9IG5ldyBIYWxmdG9uZSAoZm9vdGVySGFsZnRvbmVFbCwge1xyXG4gICAgZmFkZTogMTIsXHJcbiAgICBtYXhSYWRpdXM6IDE1LFxyXG4gICAgaW5FYXNlU3RhcnQ6IC0uMjUsXHJcbiAgICBpbkVhc2VFbmQ6IC4xLFxyXG4gICAgaW5FYXNlRm46IGVhc2VzLmxpbmVhcixcclxuICAgIG91dEVhc2VTdGFydDogMSxcclxuICAgIG91dEVhc2VFbmQ6IDFcclxuICB9KTtcclxufVxyXG4iLCIvKipcclxuICogIENvbnRyb2xzIGNvb2wgaGFsZnRvbmUgdGhpbmdpZXNcclxuICovXHJcblxyXG4vLyByZXF1aXJlbWVudHNcclxudmFyIGVhc2VzID0gcmVxdWlyZSgnbGliL2Vhc2UnKTtcclxudmFyIFNjcm9sbENvbnRyb2xsZXIgPSByZXF1aXJlKCdsaWIvc2Nyb2xsQ29udHJvbGxlcicpO1xyXG52YXIgc2V0VHJhbnNmb3JtID0gcmVxdWlyZSgnbGliL3NldFRyYW5zZm9ybScpO1xyXG52YXIgd2luZG93U2l6ZSA9IHJlcXVpcmUoJ2xpYi9nZXRXaW5kb3dTaXplJyk7XHJcbnZhciBnZXRCcmVha3BvaW50ID0gcmVxdWlyZSgnbGliL2JyZWFrcG9pbnRzJyk7XHJcbnZhciBsb29wID0gcmVxdWlyZSgnbGliL2xvb3AnKTtcclxuXHJcbi8vIHNldHRpbmdzXHJcbnZhciBERUZBVUxUUyA9IHtcclxuICBmYWRlOiA0LCAvLyByb3dzIHRvIGZhZGUgdG9wIGFuZCBib3R0b20sIGlmIDAgdGhlIGNhbnZhcyBpcyBzaXplZCB0byBiZSBjb250YWluZWQgaW5zdGVhZCBvZiBvdmVyZmxvdyBvbiB0aGUgc2lkZXNcclxuICBtYXhSYWRpdXM6IDE1LCAvLyBtYXhpbXVtIHJhZGl1cyBmb3IgYSBkb3RcclxuICBpbkVhc2VGbjogZWFzZXMuZWFzZU91dCxcclxuICBpbkVhc2VTdGFydDogLjIsIC8vIHNjcm9sbCBwZXJjZW50YWdlIHRvIHN0YXJ0IGFuaW1hdGlvbiBpbiBvbiBmaXJzdCBkb3RcclxuICBpbkVhc2VFbmQ6IC44LCAvLyBzY3JvbGwgcGVyY2VudGFnZSB0byBlbmQgYW5pbWF0aW9uIGluIG9uIGxhc3QgZG90XHJcbiAgb3V0RWFzZUZuOiBlYXNlcy5saW5lYXIsXHJcbiAgb3V0RWFzZVN0YXJ0OiAuNiwgLy8gc2Nyb2xsIHBlcmNlbnRhZ2UgdG8gc3RhcnQgYW5pbWF0aW9uIG91dCBvbiBmaXJzdCBkb3RcclxuICBvdXRFYXNlRW5kOiAxLjEsIC8vIHNjcm9sbCBwZXJjZW50YWdlIHRvIGVuZCBhbmltYXRpb24gb3V0IG9uIGxhc3QgZG90XHJcbiAgZml4ZWQ6IGZhbHNlLCAvLyBmaXhlZCBwb3NpdGlvbiBhbmQgZnVsbCBzY3JlZW4/XHJcbiAgaW1hZ2VTaXppbmc6ICdjb3ZlcicsIC8vICdjb3Zlcicgb3IgJ2NvbnRhaW4nXHJcbiAgY29ybmVyaW5nOiAwLCAvLyBkaWFnbmFsIHRvcCBsZWZ0IGZhZGVcclxuICBjb250cm9sOiAnc2Nyb2xsJywgLy8gJ3Njcm9sbCcsICdtb3VzZScgKFRPRE8pLCBvciAnbm9uZSdcclxuICBmaWxsOiBudWxsLCAvLyBvcHRpb25hbGx5IG92ZXJyaWRlIGZpbGwgY29sb3JcclxuICBpbml0aWFsRHJhd1BlcmNlbnRhZ2U6IC41NSwgLy8gcGVyY2VudGFnZSB0byBkcmF3IHJpZ2h0IGF3YXlcclxuICBtaW5CcmVha3BvaW50OiAwIC8vIG1pbmltdW0gYnJlYWtwb2ludCB0aGF0IGNhbnZhcyBjYW4gZXhpc3RcclxufVxyXG52YXIgQlJFQUtQT0lOVF9GT1JfU0NST0xMX0NPTlRST0wgPSAyO1xyXG5cclxuLyoqXHJcbiAqICBEb3QgY2xhc3NcclxuICogIEBwYXJhbSB7aW50fSBncmlkIHBvc2l0aW9uIFhcclxuICogIEBwYXJhbSB7aW50fSBncmlkIHBvc2l0aW9uIFlcclxuICogIEBwYXJhbSB7TnVtYmVyfSBtYXggcmFkaXVzXHJcbiAqICBAcGFyYW0ge0hhbGZ0b25lfSBwYXJlbnQgaGFsZnRvbmUgb2JqZWN0XHJcbiAqXHJcbiAqICBAbWV0aG9kIGRyYXcgKHtjYW52YXMgY29udGV4dH0pXHJcbiAqICBAbWV0aG9kIHNldFJhZGl1c0J5UGVyY2VudGFnZSAoe3BlcmNlbnQgb2YgbWF4IHJhZGl1c30pXHJcbiAqL1xyXG52YXIgRG90ID0gZnVuY3Rpb24gKGdyaWRYLCBncmlkWSwgbWF4UmFkaXVzLCBwYXJlbnQpIHtcclxuICB0aGlzLmdyaWRYID0gZ3JpZFg7XHJcbiAgdGhpcy5ncmlkWSA9IGdyaWRZO1xyXG4gIHRoaXMubWF4UmFkaXVzID0gbWF4UmFkaXVzO1xyXG4gIHRoaXMucmFkaXVzID0gbWF4UmFkaXVzO1xyXG4gIHRoaXMucGFyZW50ID0gcGFyZW50O1xyXG4gIHRoaXMucGVyY2VudGFnZSA9ICh0aGlzLmdyaWRYICsgdGhpcy5ncmlkWSkgLyAodGhpcy5wYXJlbnQuY29sdW1ucyArIHRoaXMucGFyZW50LnJvd3MpO1xyXG5cclxuICAvLyBkZWZpbmUgbG9jYXRpb24gd2l0aGluIGNhbnZhcyBjb250ZXh0XHJcbiAgdGhpcy54ID0gdGhpcy5ncmlkWCAqIHRoaXMucGFyZW50LnNldHRpbmdzLm1heFJhZGl1cztcclxuICB0aGlzLnkgPSB0aGlzLmdyaWRZICogdGhpcy5wYXJlbnQuc2V0dGluZ3MubWF4UmFkaXVzO1xyXG4gIGlmICh0aGlzLnBhcmVudC5zZXR0aW5ncy5mYWRlKVxyXG4gICAgdGhpcy55ICs9IHRoaXMucGFyZW50LnNldHRpbmdzLm1heFJhZGl1cztcclxuXHJcbiAgLy8gaGFuZGxlIGNvcm5lcmluZ1xyXG4gIGlmICh0aGlzLnBhcmVudC5zZXR0aW5ncy5jb3JuZXJpbmcgJiYgdGhpcy5ncmlkWCArIHRoaXMuZ3JpZFkgPD0gdGhpcy5wYXJlbnQuc2V0dGluZ3MuY29ybmVyaW5nICsgMSkge1xyXG4gICAgdGhpcy5tYXhSYWRpdXMgPSBlYXNlcy5saW5lYXIoLjMzLC42NiwodGhpcy5ncmlkWCArIHRoaXMuZ3JpZFkpIC8gKHRoaXMucGFyZW50LnNldHRpbmdzLmNvcm5lcmluZyArIDEpKSAqIHRoaXMubWF4UmFkaXVzO1xyXG4gICAgdGhpcy5yYWRpdXMgPSB0aGlzLm1heFJhZGl1cztcclxuICB9XHJcbiAgZWxzZSBpZiAodGhpcy5wYXJlbnQuc2V0dGluZ3MuY29ybmVyaW5nICYmIC0xICogKCh0aGlzLmdyaWRYICsgdGhpcy5ncmlkWSkgLSAodGhpcy5wYXJlbnQuY29sdW1ucyArIHRoaXMucGFyZW50LnJvd3MgLSAyKSkgPD0gdGhpcy5wYXJlbnQuc2V0dGluZ3MuY29ybmVyaW5nICsgMSkge1xyXG4gICAgdGhpcy5tYXhSYWRpdXMgPSBlYXNlcy5saW5lYXIoLjMzLC42NiwtMSAqICgodGhpcy5ncmlkWCArIHRoaXMuZ3JpZFkpIC0gKHRoaXMucGFyZW50LmNvbHVtbnMgKyB0aGlzLnBhcmVudC5yb3dzIC0gMikpIC8gKHRoaXMucGFyZW50LnNldHRpbmdzLmNvcm5lcmluZyArIDEpKSAqIHRoaXMubWF4UmFkaXVzO1xyXG4gICAgdGhpcy5yYWRpdXMgPSB0aGlzLm1heFJhZGl1cztcclxuICB9XHJcbn1cclxuRG90LnByb3RvdHlwZSA9IHtcclxuICBkcmF3OiBmdW5jdGlvbiAoY3R4KSB7XHJcbiAgICBpZiAodGhpcy5yYWRpdXMgPiAuNSkge1xyXG4gICAgICBjdHgubW92ZVRvKHRoaXMueCwgdGhpcy55IC0gdGhpcy5yYWRpdXMpO1xyXG4gICAgICBjdHguYXJjKHRoaXMueCwgdGhpcy55LCB0aGlzLnJhZGl1cywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcclxuICAgIH1cclxuICB9LFxyXG4gIHNldFJhZGl1c0J5UGVyY2VudGFnZTogZnVuY3Rpb24gKHBlcmNlbnQpIHtcclxuICAgIHRoaXMucmFkaXVzID0gTWF0aC5tYXgoMCwgTWF0aC5taW4odGhpcy5tYXhSYWRpdXMsIHBlcmNlbnQgKiB0aGlzLm1heFJhZGl1cykpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqICBIYWxmdG9uZSBjbGFzc1xyXG4gKiAgQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCwgb3B0aW9uYWxseSB3aXRoIGEgYmFja2dyb3VuZCBpbWFnZSwgdG8gdHVybiBpbnRvIHRoZSB0b3lcclxuICogIEBwYXJhbSB7b2JqZWN0fSBzZXR0aW5ncyB0aGF0IGNhbiBvdmVycmlkZSBERUZBVUxUUyBkZWZpbmVkIGFib3ZlXHJcbiAqXHJcbiAqICBAbWV0aG9kIGRyYXcoe3BlcmNlbnRhZ2Ugb2YgYW5pbWF0aW9uIHByb2dyZXNzfSlcclxuICogIEBtZXRob2QgY3JlYXRlQ2FudmFzKClcclxuICogIEBtZXRob2Qgc2l6ZUltYWdlKCkgLSBmb3IgaW50ZXJuYWwgdXNlXHJcbiAqICBAbWV0aG9kIGdldFBlcmNlbnRhZ2VGcm9tU2Nyb2xsKCkgLSByZXR1cm5zIGEgcGVyY2VudGFnZSBvZiBwcm9ncmVzcyBwYXN0IGVsZW1lbnQgYmFzZWQgb24gc2Nyb2xsaW5nXHJcbiAqICBAbWV0aG9kIGluaXQoKVxyXG4gKiAgQG1ldGhvZCBkZXN0cm95KClcclxuICogIEBtZXRob2QgYW5pbUluKHthbmltYXRpb24gdGltZSBpbiBtc30pXHJcbiAqL1xyXG52YXIgSGFsZnRvbmUgPSBmdW5jdGlvbiAoZWxlbWVudCwgc2V0dGluZ3MsIGRvdFNpemVJbWFnZSkge1xyXG4gIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuICB0aGlzLnNldHRpbmdzID0ge307XHJcbiAgc2V0dGluZ3MgPSBzZXR0aW5ncyB8fCB7fTtcclxuICBmb3IgKHZhciBwcm9wIGluIERFRkFVTFRTKSB7XHJcbiAgICB0aGlzLnNldHRpbmdzW3Byb3BdID0gc2V0dGluZ3NbcHJvcF0gIT09IHVuZGVmaW5lZCA/IHNldHRpbmdzW3Byb3BdIDogREVGQVVMVFNbcHJvcF07XHJcbiAgfVxyXG5cclxuICBpZiAoZG90U2l6ZUltYWdlKSB7XHJcbiAgICB0aGlzLmRvdFNpemVJbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgdGhpcy5kb3RTaXplSW1hZ2Uuc3JjID0gZG90U2l6ZUltYWdlO1xyXG4gICAgdGhpcy5kb3RTaXplSW1hZ2Uub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICBfdGhpcy5zaXplRG90c0J5SW1hZ2UoKTtcclxuICAgICAgX3RoaXMubGFzdERyYXduUGVyY2VudGFnZSA9IG51bGw7XHJcbiAgICAgIF90aGlzLmRyYXcoX3RoaXMuZ2V0UGVyY2VudGFnZUZyb21TY3JvbGwoKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHRoaXMuZWxlbWVudCk7XHJcbiAgLy8gbWFrZSBzdXJlIHBvc2l0aW9uaW5nIGlzIHZhbGlkXHJcbiAgaWYgKGNvbXB1dGVkU3R5bGUucG9zaXRpb24gPT09ICdzdGF0aWMnKSB7XHJcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xyXG4gIH1cclxuICAvLyBzZXQgdXAgY29sb3IgYW5kIGltYWdlXHJcbiAgdGhpcy5maWxsID0gdGhpcy5zZXR0aW5ncy5maWxsIHx8IGNvbXB1dGVkU3R5bGUuYmFja2dyb3VuZENvbG9yO1xyXG4gIGlmICghIWNvbXB1dGVkU3R5bGUuYmFja2dyb3VuZEltYWdlICYmIGNvbXB1dGVkU3R5bGUuYmFja2dyb3VuZEltYWdlICE9PSAnbm9uZScpIHtcclxuICAgIHRoaXMuaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuICAgIHRoaXMuaW1hZ2Uuc3JjID0gY29tcHV0ZWRTdHlsZS5iYWNrZ3JvdW5kSW1hZ2UubWF0Y2goL1xcKCg/Oid8XCIpPyguKz8pKD86J3xcIik/XFwpLylbMV07XHJcbiAgfVxyXG4gIGlmICghdGhpcy5zZXR0aW5ncy5maWxsKVxyXG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLmJhY2tncm91bmQgPSAnbm9uZSc7XHJcblxyXG4gIC8vIGxpc3RlbmVyc1xyXG4gIHRoaXMub25SZXNpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBfdGhpcy5jcmVhdGVDYW52YXMoKTtcclxuICB9XHJcbiAgdGhpcy5vblNjcm9sbCA9IGZ1bmN0aW9uIChwZXJjZW50YWdlKSB7XHJcbiAgICBfdGhpcy5kcmF3KHBlcmNlbnRhZ2UpO1xyXG4gIH1cclxuXHJcbiAgLy8gYXV0b3N0YXJ0XHJcbiAgdGhpcy5pbml0KCk7XHJcbn1cclxuSGFsZnRvbmUucHJvdG90eXBlID0ge1xyXG4gIGRyYXc6IGZ1bmN0aW9uIChwZXJjZW50YWdlKSB7XHJcbiAgICAvLyByb3VuZCB0byAuMSVcclxuICAgIHBlcmNlbnRhZ2UgPSBNYXRoLnJvdW5kKHBlcmNlbnRhZ2UgKiAxMDAwKSAvIDEwMDA7XHJcblxyXG4gICAgLy8gc2hvdWxkIHdlIGJvdGhlcj9cclxuICAgIGlmICghdGhpcy5jYW52YXMgfHwgcGVyY2VudGFnZSA9PSB0aGlzLmxhc3REcmF3blBlcmNlbnRhZ2UpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAocGVyY2VudGFnZSA8IHRoaXMuc2V0dGluZ3MuaW5FYXNlU3RhcnQgfHwgcGVyY2VudGFnZSA+IHRoaXMuc2V0dGluZ3Mub3V0RWFzZUVuZCkge1xyXG4gICAgICAvLyBmaXggZm9yIGNocm9tZSByZW5kZXJpbmcgZXJyb3IgZnJvbSBzdGFja2luZyBjYW52YXNlc1xyXG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5maXhlZCkge1xyXG4gICAgICAgIHRoaXMuY2FudmFzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY2FudmFzLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG5cclxuICAgIC8vIGNsZWFyIGN1cnJlbnQgY3JhcFxyXG4gICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsMCx0aGlzLmNhbnZhcy53aWR0aCx0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG5cclxuICAgIC8vIGhhdmUgdG8gZG8gdGhlIG1hdGhzXHJcbiAgICB0aGlzLmN0eC5zYXZlKCk7XHJcbiAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgIC8vIGhhbmRsZSBhbmltYXRpb25cclxuICAgIC8vIGluIHZhcnNcclxuICAgIHZhciBlZmZlY3RpdmVJblBlcmMgPSAocGVyY2VudGFnZSAtIHRoaXMuc2V0dGluZ3MuaW5FYXNlU3RhcnQpIC8gKHRoaXMuc2V0dGluZ3MuaW5FYXNlRW5kIC0gdGhpcy5zZXR0aW5ncy5pbkVhc2VTdGFydCk7XHJcbiAgICBlZmZlY3RpdmVJblBlcmMgPSBlZmZlY3RpdmVJblBlcmMgPCAxID8gdGhpcy5zZXR0aW5ncy5pbkVhc2VGbigtMSwzLGVmZmVjdGl2ZUluUGVyYykgOiAyO1xyXG4gICAgLy8gb3V0IHZhcnNcclxuICAgIHZhciBlZmZlY3RpdmVPdXRQZXJjID0gKHBlcmNlbnRhZ2UgLSB0aGlzLnNldHRpbmdzLm91dEVhc2VTdGFydCkgLyAodGhpcy5zZXR0aW5ncy5vdXRFYXNlRW5kIC0gdGhpcy5zZXR0aW5ncy5vdXRFYXNlU3RhcnQpO1xyXG4gICAgZWZmZWN0aXZlT3V0UGVyYyA9IGVmZmVjdGl2ZU91dFBlcmMgPiAwID8gdGhpcy5zZXR0aW5ncy5vdXRFYXNlRm4oMiwtMyxlZmZlY3RpdmVPdXRQZXJjKSA6IDI7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuZG90cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICB2YXIgZG90SW5QZXJjID0gZWZmZWN0aXZlSW5QZXJjIC0gdGhpcy5kb3RzW2ldLnBlcmNlbnRhZ2U7XHJcbiAgICAgIHZhciBkb3RPdXRQZXJjID0gZWZmZWN0aXZlT3V0UGVyYyAtICgxIC0gdGhpcy5kb3RzW2ldLnBlcmNlbnRhZ2UpO1xyXG4gICAgICB0aGlzLmRvdHNbaV0uc2V0UmFkaXVzQnlQZXJjZW50YWdlKE1hdGgubWluKGRvdEluUGVyYyxkb3RPdXRQZXJjKSk7XHJcbiAgICAgIHRoaXMuZG90c1tpXS5kcmF3KHRoaXMuY3R4KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmN0eC5maWxsKCk7XHJcblxyXG4gICAgaWYgKHRoaXMuaW1hZ2UgJiYgdGhpcy5pbWFnZU9mZnNldHMpIHtcclxuICAgICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJzb3VyY2UtYXRvcFwiO1xyXG4gICAgICB0aGlzLmN0eC5kcmF3SW1hZ2UodGhpcy5pbWFnZSwgdGhpcy5pbWFnZU9mZnNldHMueCwgdGhpcy5pbWFnZU9mZnNldHMueSwgdGhpcy5pbWFnZU9mZnNldHMud2lkdGgsIHRoaXMuaW1hZ2VPZmZzZXRzLmhlaWdodCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmN0eC5yZXN0b3JlKCk7XHJcblxyXG4gICAgdGhpcy5sYXN0RHJhd25QZXJjZW50YWdlID0gcGVyY2VudGFnZTtcclxuICB9LFxyXG4gIGNyZWF0ZUNhbnZhczogZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKGdldEJyZWFrcG9pbnQoKSA8IHRoaXMuc2V0dGluZ3MubWluQnJlYWtwb2ludCkge1xyXG4gICAgICBjb25zb2xlLmxvZygndG9vIHNtYWxsIScsIHRoaXMuY2FudmFzKTtcclxuICAgICAgLy8gd2Ugd2FudCBubyBjYW52YXMhXHJcbiAgICAgIGlmICh0aGlzLmNhbnZhcykge1xyXG4gICAgICAgIHRoaXMuY2FudmFzLnJlbW92ZSgpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ29vZCB0byBhY3R1YWxseSBtYWtlIHRoZSB0aGluZ1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIGZ1bmN0aW9uIGFkZENhbnZhcyAoKSB7XHJcbiAgICAgIGlmIChfdGhpcy5lbGVtZW50LmNoaWxkcmVuLmxlbmd0aCkge1xyXG4gICAgICAgIF90aGlzLmVsZW1lbnQuaW5zZXJ0QmVmb3JlKF90aGlzLmNhbnZhcywgX3RoaXMuZWxlbWVudC5jaGlsZHJlblswXSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgX3RoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChfdGhpcy5jYW52YXMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBlbmFibGVDYW52YXMgKCkge1xyXG4gICAgICAvLyBlc3RhYmxpc2ggc2Nyb2xsIGJhc2VkIGNvbnRyb2xzIG9ubHkgaWYgc2NyZWVuIGlzIGxhcmdlIGVub3VnaCBmb3IgdXMgdG8gY2FyZVxyXG4gICAgICBpZiAoZ2V0QnJlYWtwb2ludCgpID49IEJSRUFLUE9JTlRfRk9SX1NDUk9MTF9DT05UUk9MICYmIF90aGlzLnNldHRpbmdzLmNvbnRyb2wgPT09ICdzY3JvbGwnKSB7XHJcbiAgICAgICAgX3RoaXMuc2Nyb2xsQ29udHJvbGxlciA9IG5ldyBTY3JvbGxDb250cm9sbGVyKF90aGlzLmVsZW1lbnQsIF90aGlzLm9uU2Nyb2xsKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBpZiAoX3RoaXMuc2Nyb2xsQ29udHJvbGxlcikge1xyXG4gICAgICAgICAgX3RoaXMuc2Nyb2xsQ29udHJvbGxlci5kZXN0cm95KCk7XHJcbiAgICAgICAgICBfdGhpcy5zY3JvbGxDb250cm9sbGVyID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgX3RoaXMuZHJhdyhfdGhpcy5nZXRQZXJjZW50YWdlRnJvbVNjcm9sbCgpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGtpbGwgZXhpc3RpbmcgY2FudmFzXHJcbiAgICB0aGlzLmxhc3REcmF3blBlcmNlbnRhZ2UgPSBudWxsO1xyXG4gICAgdmFyIGxhc3RDYW52YXM7XHJcbiAgICBpZiAodGhpcy5jYW52YXMpIHtcclxuICAgICAgbGFzdENhbnZhcyA9IHRoaXMuY2FudmFzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGNyZWF0ZSBuZXcgY2FudmFzIGFuZCBkb3RzXHJcbiAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgdGhpcy5jYW52YXMuc2V0QXR0cmlidXRlKCdjbGFzcycsJ2NhbnZhcy1oYWxmdG9uZScpO1xyXG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmZpeGVkIHx8IGdldEJyZWFrcG9pbnQoKSA8IEJSRUFLUE9JTlRfRk9SX1NDUk9MTF9DT05UUk9MKSB7XHJcbiAgICAgIC8vIG5vcm1hbCBzaXppbmcgYW5kIHBvc2l0aW9uaW5nXHJcbiAgICAgIHZhciBjb2x1bW5zID0gTWF0aC5mbG9vcih0aGlzLmVsZW1lbnQub2Zmc2V0V2lkdGggLyB0aGlzLnNldHRpbmdzLm1heFJhZGl1cyk7XHJcbiAgICAgIHZhciByb3dzID0gTWF0aC5mbG9vcih0aGlzLmVsZW1lbnQub2Zmc2V0SGVpZ2h0IC8gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMpO1xyXG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5mYWRlKSB7XHJcbiAgICAgICAgY29sdW1ucyArPSAyO1xyXG4gICAgICAgIHJvd3MgKz0gdGhpcy5zZXR0aW5ncy5mYWRlICogMiArIDI7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgaWYgKGNvbHVtbnMgJSAyID09PSAwKVxyXG4gICAgICAgICAgY29sdW1ucyArPSAxO1xyXG4gICAgICAgIGlmIChyb3dzICUgMiA9PT0gMClcclxuICAgICAgICAgIHJvd3MgKz0gMTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIGZpeGVkIHNpemluZyBhbmQgcG9zaXRpb25pbmdcclxuICAgICAgdmFyIGNvbHVtbnMgPSBNYXRoLmZsb29yKHdpbmRvd1NpemUud2lkdGgoKSAvIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzKSArIDI7XHJcbiAgICAgIHZhciByb3dzID0gTWF0aC5mbG9vcih3aW5kb3dTaXplLmhlaWdodCgpIC8gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMpICsgdGhpcy5zZXR0aW5ncy5mYWRlICogMiArIDI7XHJcbiAgICAgIHNldFRyYW5zZm9ybSh0aGlzLmVsZW1lbnQsJ25vbmUnKTtcclxuICAgICAgc2V0VHJhbnNmb3JtKHRoaXMuY2FudmFzLCdub25lJyk7XHJcbiAgICAgIHRoaXMuY2FudmFzLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcclxuICAgICAgdGhpcy5jYW52YXMuc3R5bGUudG9wID0gdGhpcy5zZXR0aW5ncy5mYWRlICogdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMgKiAtMSAtICh0aGlzLnNldHRpbmdzLm1heFJhZGl1cyAvIDIpICsgJ3B4JztcclxuICAgICAgdGhpcy5jYW52YXMuc3R5bGUubGVmdCA9IDA7XHJcbiAgICB9XHJcbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IChjb2x1bW5zIC0gMSkgKiB0aGlzLnNldHRpbmdzLm1heFJhZGl1cztcclxuICAgIHRoaXMuY2FudmFzLmhlaWdodCA9ICh0aGlzLnNldHRpbmdzLmZhZGUgPyByb3dzICsgMSA6IHJvd3MgLSAxKSAqIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzO1xyXG5cclxuICAgIC8vIGNoZWNrIHRoYXQgd2UgZXZlbiBuZWVkIHRvIGRvIHRoaXMgc2hpdFxyXG4gICAgaWYgKGxhc3RDYW52YXMgJiYgbGFzdENhbnZhcy53aWR0aCA9PT0gdGhpcy5jYW52YXMud2lkdGggJiYgbGFzdENhbnZhcy5oZWlnaHQgPT09IHRoaXMuY2FudmFzLmhlaWdodCkge1xyXG4gICAgICAvLyBzdG9wIHJlbWFraW5nLCBpdCdzIHRoZSBzYW1lIVxyXG4gICAgICB0aGlzLmNhbnZhcyA9IGxhc3RDYW52YXM7XHJcbiAgICAgIC8vYWRkQ2FudmFzKCk7XHJcbiAgICAgIGVuYWJsZUNhbnZhcygpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChsYXN0Q2FudmFzKSB7XHJcbiAgICAgIGxhc3RDYW52YXMucmVtb3ZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2V0IHRoZSBjb250ZXh0XHJcbiAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLmZpbGw7XHJcbiAgICB0aGlzLmNvbHVtbnMgPSBjb2x1bW5zO1xyXG4gICAgdGhpcy5yb3dzID0gcm93cztcclxuXHJcbiAgICAvLyBkZWZpbmUgdGhlIGRvdHNcclxuICAgIHRoaXMuZG90cyA9IFtdO1xyXG4gICAgZm9yICh2YXIgeSA9IDA7IHkgPCByb3dzOyB5KyspIHtcclxuICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCBjb2x1bW5zOyB4Kz0gMikge1xyXG4gICAgICAgIHZhciByYWQ7XHJcbiAgICAgICAgaWYgKHkgPCB0aGlzLnNldHRpbmdzLmZhZGUpIHtcclxuICAgICAgICAgIHJhZCA9ICh5ICsgMSkgLyAodGhpcy5zZXR0aW5ncy5mYWRlICsgMSkgKiB0aGlzLnNldHRpbmdzLm1heFJhZGl1cztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoeSA+PSByb3dzIC0gdGhpcy5zZXR0aW5ncy5mYWRlKSB7XHJcbiAgICAgICAgICByYWQgPSAtMSAqICh5ICsgMSAtIHJvd3MpIC8gKHRoaXMuc2V0dGluZ3MuZmFkZSArIDEpICogdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCF0aGlzLnNldHRpbmdzLmZhZGUgJiYgeSA9PT0gMCAmJiB4ID09PSAwICYmICF0aGlzLnNldHRpbmdzLmZpeGVkKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMuc2V0dGluZ3MuZmFkZSAmJiB5ID09PSAwICYmIHggPT09IGNvbHVtbnMgLSAxICYmICF0aGlzLnNldHRpbmdzLmZpeGVkKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMuc2V0dGluZ3MuZmFkZSAmJiB5ID09PSByb3dzIC0gMSAmJiB4ID09PSAwICYmICF0aGlzLnNldHRpbmdzLmZpeGVkKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMuc2V0dGluZ3MuZmFkZSAmJiB5ID09PSByb3dzIC0gMSAmJiB4ID09PSBjb2x1bW5zIC0gMSAmJiAhdGhpcy5zZXR0aW5ncy5maXhlZCkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgcmFkID0gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZG90cy5wdXNoKG5ldyBEb3QoeSAlIDIgPyB4ICsgMSA6IHgsIHksIHJhZCwgdGhpcykpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuZWxlbWVudC5jaGlsZHJlbi5sZW5ndGgpIHtcclxuICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZSh0aGlzLmNhbnZhcywgdGhpcy5lbGVtZW50LmNoaWxkcmVuWzBdKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRldGVybWluZSBpbWFnZSBzaXplXHJcbiAgICBpZiAodGhpcy5pbWFnZSkge1xyXG4gICAgICBpZiAodGhpcy5pbWFnZS5jb21wbGV0ZSkge1xyXG4gICAgICAgIHRoaXMuaW1hZ2VPZmZzZXRzID0gdGhpcy5zaXplSW1hZ2UodGhpcy5pbWFnZSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICB0aGlzLmltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIF90aGlzLmltYWdlT2Zmc2V0cyA9IF90aGlzLnNpemVJbWFnZShfdGhpcy5pbWFnZSk7XHJcbiAgICAgICAgICBfdGhpcy5sYXN0RHJhd25QZXJjZW50YWdlID0gbnVsbDtcclxuICAgICAgICAgIF90aGlzLmRyYXcoX3RoaXMuZ2V0UGVyY2VudGFnZUZyb21TY3JvbGwoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuZG90U2l6ZUltYWdlICYmIHRoaXMuZG90U2l6ZUltYWdlLmNvbXBsZXRlKSB7XHJcbiAgICAgIHRoaXMuc2l6ZURvdHNCeUltYWdlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZW5hYmxlQ2FudmFzKCk7XHJcbiAgfSxcclxuICBzaXplSW1hZ2U6IGZ1bmN0aW9uIChpbWFnZSkge1xyXG4gICAgLy8gbWFrZSBzdXJlIHdlIHN1Y2Nlc3NmdWxseSBsb2FkZWRcclxuICAgIGlmICghaW1hZ2UgfHwgIWltYWdlLndpZHRoIHx8ICFpbWFnZS5oZWlnaHQpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGZpZ3VyZSBvdXQgdGhlIHNjYWxlIHRvIG1hdGNoICdjb3Zlcicgb3IgJ2NvbnRhaW4nLCBhcyBkZWZpbmVkIGJ5IHNldHRpbmdzXHJcbiAgICB2YXIgc2NhbGUgPSB0aGlzLmNhbnZhcy53aWR0aCAvIGltYWdlLndpZHRoO1xyXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuaW1hZ2VTaXppbmcgPT09ICdjb3ZlcicgJiYgc2NhbGUgKiBpbWFnZS5oZWlnaHQgPCB0aGlzLmNhbnZhcy5oZWlnaHQpIHtcclxuICAgICAgc2NhbGUgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyBpbWFnZS5oZWlnaHQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0aGlzLnNldHRpbmdzLmltYWdlU2l6aW5nID09PSAnY29udGFpbicgJiYgc2NhbGUgKiBpbWFnZS5oZWlnaHQgPiB0aGlzLmNhbnZhcy5oZWlnaHQpIHtcclxuICAgICAgc2NhbGUgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyBpbWFnZS5oZWlnaHQ7XHJcbiAgICB9XHJcbiAgICAvLyBzYXZlIHRoZSB4LHksd2lkdGgsaGVpZ2h0IG9mIHRoZSBzY2FsZWQgaW1hZ2Ugc28gaXQgY2FuIGJlIGVhc2lseSBkcmF3biB3aXRob3V0IG1hdGhcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHg6ICh0aGlzLmNhbnZhcy53aWR0aCAtIGltYWdlLndpZHRoICogc2NhbGUpIC8gMixcclxuICAgICAgeTogKHRoaXMuY2FudmFzLmhlaWdodCAtIGltYWdlLmhlaWdodCAqIHNjYWxlKSAvIDIsXHJcbiAgICAgIHdpZHRoOiBpbWFnZS53aWR0aCAqIHNjYWxlLFxyXG4gICAgICBoZWlnaHQ6IGltYWdlLmhlaWdodCAqIHNjYWxlXHJcbiAgICB9XHJcbiAgfSxcclxuICBzaXplRG90c0J5SW1hZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIGZpcnN0LCBmaWd1cmUgb3V0IGhvdyB0byBzaXplIHRoZSBpbWFnZSBmb3IgdGhlIGNhbnZhc1xyXG4gICAgdmFyIGRvdHNJbWFnZU9mZnNldHMgPSB0aGlzLnNpemVJbWFnZSh0aGlzLmRvdFNpemVJbWFnZSk7XHJcbiAgICBpZiAoIWRvdHNJbWFnZU9mZnNldHMpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB0ZW1wQ2FuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICB0ZW1wQ2FuLndpZHRoID0gdGhpcy5jYW52YXMud2lkdGg7XHJcbiAgICB0ZW1wQ2FuLmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodDtcclxuICAgIHZhciB0ZW1wQ2FuQ3R4ID0gdGVtcENhbi5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgdGVtcENhbkN0eC5maWxsU3R5bGUgPSAnd2hpdGUnO1xyXG4gICAgdGVtcENhbkN0eC5maWxsUmVjdCgwLCAwLCB0ZW1wQ2FuLndpZHRoLCB0ZW1wQ2FuLmhlaWdodCk7XHJcbiAgICB0ZW1wQ2FuQ3R4LmRyYXdJbWFnZSh0aGlzLmRvdFNpemVJbWFnZSwgZG90c0ltYWdlT2Zmc2V0cy54LCBkb3RzSW1hZ2VPZmZzZXRzLnksIGRvdHNJbWFnZU9mZnNldHMud2lkdGgsIGRvdHNJbWFnZU9mZnNldHMuaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gdGhpcy5kb3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgIHZhciBpbWdEYXRhID0gdGVtcENhbkN0eC5nZXRJbWFnZURhdGEodGhpcy5kb3RzW2ldLnggLSB0aGlzLnNldHRpbmdzLm1heFJhZGl1cywgdGhpcy5kb3RzW2ldLnkgLSB0aGlzLnNldHRpbmdzLm1heFJhZGl1cywgdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMgKiAyLCB0aGlzLnNldHRpbmdzLm1heFJhZGl1cyAqIDIpO1xyXG4gICAgICAvL2NvbnNvbGUubG9nKHRoaXMuZG90c1tpXS54IC0gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMsIHRoaXMuZG90c1tpXS55IC0gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMsIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzICogMiwgdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMgKiAyKTtcclxuICAgICAgLy8gb25seSBnZXR0aW5nIHJlZCwgYmVjYXVzZSBpbWFnZSBzaG91bGQgYmUgZ3JleXNjYWxlIGFueXdheVxyXG4gICAgICB2YXIgYXZlcmFnZVJlZCA9IDA7XHJcbiAgICAgIGZvciAodmFyIGogPSAwLCBqTGVuID0gaW1nRGF0YS5kYXRhLmxlbmd0aDsgaiA8IGpMZW47IGogKz0gNCkge1xyXG4gICAgICAgIHZhciBvcGFjaXR5QWRkID0gKDI1NSAtIGltZ0RhdGEuZGF0YVtqXSkgKiAoKDI1NSAtIGltZ0RhdGEuZGF0YVtqICsgM10pIC8gMjU1KTtcclxuICAgICAgICBhdmVyYWdlUmVkICs9IGltZ0RhdGEuZGF0YVtqXSArIG9wYWNpdHlBZGQ7XHJcbiAgICAgICAgLy8gaWYgKGogPCA0MDApXHJcbiAgICAgICAgLy8gICBjb25zb2xlLmxvZyhpbWdEYXRhLmRhdGFbal0sIG9wYWNpdHlBZGQsIGltZ0RhdGEuZGF0YVtqXSArIG9wYWNpdHlBZGQpO1xyXG4gICAgICB9XHJcbiAgICAgIGF2ZXJhZ2VSZWQgLz0gKGltZ0RhdGEuZGF0YS5sZW5ndGggLyA0KTtcclxuXHJcbiAgICAgIHRoaXMuZG90c1tpXS5tYXhSYWRpdXMgPSB0aGlzLmRvdHNbaV0ubWF4UmFkaXVzICogKCgyNTUgLSBhdmVyYWdlUmVkKSAvIDI1NSk7XHJcbiAgICAgIC8vIHJlbW92ZSB0aGlzIGRvdCBpZiBpdCB3aWxsIG5ldmVyIHNob3dcclxuICAgICAgaWYgKHRoaXMuZG90c1tpXS5tYXhSYWRpdXMgPCAuNSkge1xyXG4gICAgICAgIHRoaXMuZG90cy5zcGxpY2UoaSwxKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgZ2V0UGVyY2VudGFnZUZyb21TY3JvbGw6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiAodGhpcy5zY3JvbGxDb250cm9sbGVyICYmIGdldEJyZWFrcG9pbnQoKSA+PSBCUkVBS1BPSU5UX0ZPUl9TQ1JPTExfQ09OVFJPTCkgPyB0aGlzLnNjcm9sbENvbnRyb2xsZXIuZ2V0UGVyY2VudGFnZSgpIDogdGhpcy5zZXR0aW5ncy5pbml0aWFsRHJhd1BlcmNlbnRhZ2U7XHJcbiAgfSxcclxuICBpbml0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBtYWtlIHRoZSBjYW52YXNcclxuICAgIHRoaXMuY3JlYXRlQ2FudmFzKCk7XHJcblxyXG4gICAgLy8gc2Nyb2xsIGxpc3RlbmVyIGFkZGVkIGluIGNyZWF0ZUNhbnZhcyBmblxyXG5cclxuICAgIC8vIGxpc3RlbiBmb3IgcmVzaXplXHJcbiAgICBsb29wLmFkZFJlc2l6ZUZ1bmN0aW9uKHRoaXMub25SZXNpemUpO1xyXG4gIH0sXHJcbiAgZGVzdHJveTogZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMuc2Nyb2xsQ29udHJvbGxlcilcclxuICAgICAgdGhpcy5zY3JvbGxDb250cm9sbGVyLmRlc3Ryb3koKTtcclxuICAgIGxvb3AucmVtb3ZlRnVuY3Rpb24odGhpcy5vblJlc2l6ZSk7XHJcbiAgICB0aGlzLmNhbnZhcy5yZW1vdmUoKTtcclxuICAgIGRlbGV0ZSB0aGlzO1xyXG4gIH0sXHJcbiAgYW5pbTogZnVuY3Rpb24gKHN0YXJ0UGVyYywgZW5kUGVyYywgdGltZSwgZWFzZSwgY2IpIHtcclxuICAgIC8vIGZpcnN0LCB0dXJuIG9mZiBzY3JvbGwgbGlzdGVuaW5nXHJcbiAgICBpZiAodGhpcy5zY3JvbGxDb250cm9sbGVyKVxyXG4gICAgICB0aGlzLnNjcm9sbENvbnRyb2xsZXIuZGlzYWJsZSgpO1xyXG4gICAgLy8gZXN0YWJsaXNoIGRlZmF1bHRzXHJcbiAgICBzdGFydFBlcmMgPSBzdGFydFBlcmMgfHwgMDtcclxuICAgIGVuZFBlcmMgPSAhaXNOYU4oZW5kUGVyYykgPyBlbmRQZXJjIDogMTtcclxuICAgIHRpbWUgPSB0aW1lIHx8IDEwMDA7XHJcbiAgICBlYXNlID0gZWFzZSB8fCBlYXNlcy5lYXNlSW5PdXQ7XHJcbiAgICAvLyBnZXQgc29tZSBiYXNlIHZhcnNcclxuICAgIHZhciBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgIHZhciBkZWx0YVBlcmMgPSBlbmRQZXJjIC0gc3RhcnRQZXJjO1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHZhciBydW5uaW5nID0gdHJ1ZTtcclxuICAgIC8vIHRoaXMgZ29lcyBpbiB0aGUgbG9vcFxyXG4gICAgdmFyIGFuaW1hdGlvbkZuID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICBpZiAocnVubmluZykge1xyXG4gICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICB2YXIgZGVsdGFUaW1lID0gKG5vdyAtIHN0YXJ0VGltZSkgLyB0aW1lO1xyXG4gICAgICAgIGlmIChkZWx0YVRpbWUgPCAxKVxyXG4gICAgICAgICAgX3RoaXMuZHJhdyhlYXNlKHN0YXJ0UGVyYyxkZWx0YVBlcmMsZGVsdGFUaW1lKSk7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICBfdGhpcy5kcmF3KGVuZFBlcmMpO1xyXG4gICAgICAgICAgaWYgKF90aGlzLnNjcm9sbENvbnRyb2xsZXIpXHJcbiAgICAgICAgICAgIF90aGlzLnNjcm9sbENvbnRyb2xsZXIuZW5hYmxlKCk7XHJcbiAgICAgICAgICAvLyBnZXQgYmFjayBvdXQgb2YgdGhlIGxvb3BcclxuICAgICAgICAgIGxvb3AucmVtb3ZlRnVuY3Rpb24oYW5pbWF0aW9uRm4pO1xyXG4gICAgICAgICAgaWYgKGNiKVxyXG4gICAgICAgICAgICBjYigpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgbG9vcC5hZGRGdW5jdGlvbihhbmltYXRpb25Gbik7XHJcbiAgfSxcclxuICBhbmltSW46IGZ1bmN0aW9uICh0aW1lLCBjYikge1xyXG4gICAgLy8gYW5pbWF0ZSB0aGUgY2FudmFzIGZyb20gaW5FYXNlU3RhcnQgdG8gY3VycmVudCBzY3JvbGwgcG9zXHJcbiAgICAvLyBjaGVjayBpZiB3ZSBldmVuIG5lZWQgdG9cclxuICAgIHZhciBlbmRQZXJjID0gdGhpcy5nZXRQZXJjZW50YWdlRnJvbVNjcm9sbCgpO1xyXG4gICAgaWYgKGVuZFBlcmMgPCB0aGlzLnNldHRpbmdzLmluRWFzZVN0YXJ0KVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgdGhpcy5hbmltKHRoaXMuc2V0dGluZ3MuaW5FYXNlU3RhcnQsIGVuZFBlcmMsIHRpbWUsIGVhc2VzLmVhc2VPdXQsIGNiKTtcclxuICB9LFxyXG4gIGFuaW1PdXQ6IGZ1bmN0aW9uICh0aW1lLCBjYikge1xyXG4gICAgLy8gYW5pbWF0ZSB0aGUgY2FudmFzIGZyb20gaW5FYXNlU3RhcnQgdG8gY3VycmVudCBzY3JvbGwgcG9zXHJcbiAgICAvLyBjaGVjayBpZiB3ZSBldmVuIG5lZWQgdG9cclxuICAgIHZhciBzdGFydFBlcmMgPSB0aGlzLmdldFBlcmNlbnRhZ2VGcm9tU2Nyb2xsKCk7XHJcbiAgICBpZiAoc3RhcnRQZXJjIDwgdGhpcy5zZXR0aW5ncy5pbkVhc2VTdGFydClcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgIHRoaXMuYW5pbShzdGFydFBlcmMsIHRoaXMuc2V0dGluZ3MuaW5FYXNlU3RhcnQsIHRpbWUsIGVhc2VzLmVhc2VJbiwgY2IpO1xyXG4gIH1cclxufVxyXG5cclxuLy8gdGVtcCBhdXRvIGluaXRcclxuLy8gdmFyIGh0ckVscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5oYWxmdG9uZScpO1xyXG4vLyB2YXIgaHRycyA9IFtdO1xyXG4vLyBmb3IgKHZhciBpID0gMCwgbGVuID0gaHRyRWxzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbi8vICAgaHRycy5wdXNoKG5ldyBIYWxmdG9uZShodHJFbHNbaV0sIHsgZmFkZTogMTIsIGZpeGVkOiBmYWxzZSB9KSk7XHJcbi8vIH1cclxuLy8gd2luZG93Lmh0cnMgPSBodHJzO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEhhbGZ0b25lO1xyXG4iLCIvKipcclxuICogIGNvbnRyb2xzIGlsbHVzdHJhdGlvbnNcclxuICovXHJcbi8vIHJlcXVpcmVtZW50c1xyXG52YXIgSGFsZnRvbmUgPSByZXF1aXJlKCdvYmplY3RzL2hhbGZ0b25lJyk7XHJcbnZhciBlYXNlcyA9IHJlcXVpcmUoJ2xpYi9lYXNlJyk7XHJcblxyXG4vLyBzZXR0aW5nc1xyXG52YXIgSUxMVVNUUkFUSU9OX0hBTEZUT05FX1NFVFRJTkdTID0ge1xyXG4gIGZhZGU6IDAsXHJcbiAgZml4ZWQ6IHRydWUsXHJcbiAgaW5FYXNlU3RhcnQ6IDAsXHJcbiAgaW5FYXNlRW5kOiAuNDUsXHJcbiAgaW5FYXNlRm46IGVhc2VzLmxpbmVhcixcclxuICBvdXRFYXNlU3RhcnQ6IC41NSxcclxuICBvdXRFYXNlRW5kOiAxLFxyXG4gIGltYWdlU2l6aW5nOiAnY29udGFpbicsXHJcbiAgbWluQnJlYWtwb2ludDogMlxyXG59O1xyXG5cclxuLyoqXHJcbiAqICBJbGx1c3RyYXRpb24gb2JqZWN0XHJcbiAqICBAcGFyYW0ge0hUTUxFbGVtZW50fVxyXG4gKi9cclxudmFyIElsbHVzdHJhdGlvbiA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XHJcbiAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuICB0aGlzLmltYWdlID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcuaWxsdXN0cmF0aW9uX19pbWFnZScpO1xyXG4gIHRoaXMuaGFsZnRvbmUgPSBuZXcgSGFsZnRvbmUodGhpcy5pbWFnZSwgSUxMVVNUUkFUSU9OX0hBTEZUT05FX1NFVFRJTkdTKTtcclxufVxyXG5cclxuLy8gaW5pdFxyXG52YXIgaWxsdXN0cmF0aW9uRWxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmlsbHVzdHJhdGlvbicpO1xyXG5mb3IgKHZhciBpID0gMCwgbGVuID0gaWxsdXN0cmF0aW9uRWxzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgbmV3IElsbHVzdHJhdGlvbihpbGx1c3RyYXRpb25FbHNbaV0pO1xyXG59XHJcbiIsIi8qKlxyXG4gKiAgVGhlIE15IFRpdGxlcyB0b3lcclxuICovXHJcbi8vIHJlcXVpcmVtZW50c1xyXG52YXIgSGFsZnRvbmUgPSByZXF1aXJlKCdvYmplY3RzL2hhbGZ0b25lJyk7XHJcbnZhciBlYXNlcyA9IHJlcXVpcmUoJ2xpYi9lYXNlJyk7XHJcbnZhciB3aW5kb3dTaXplID0gcmVxdWlyZSgnbGliL2dldFdpbmRvd1NpemUnKTtcclxuXHJcbi8vIHNldHRpbmdzXHJcbnZhciBIQUxGVE9ORV9TRVRUSU5HUyA9IHtcclxuICBpbkVhc2VGbjogZWFzZXMuZWFzZU91dCxcclxuICBpbkVhc2VTdGFydDogLS4xLFxyXG4gIGluRWFzZUVuZDogLjUsXHJcbiAgb3V0RWFzZUZuOiBlYXNlcy5lYXNlSW4sXHJcbiAgb3V0RWFzZVN0YXJ0OiAuNSxcclxuICBvdXRFYXNlRW5kOiAxLjEsXHJcbiAgZmFkZTogMSxcclxuICBmaWxsOiAnIzAxMUMxRicsXHJcbiAgbWF4UmFkaXVzOiA5LFxyXG4gIGNvbnRyb2w6ICdub25lJyxcclxuICBpbml0aWFsRHJhd1BlcmNlbnRhZ2U6IDBcclxufVxyXG52YXIgQU5JTV9USU1FID0gMTAwMDA7XHJcblxyXG4vKipcclxuICogIE15VGl0bGVzXHJcbiAqICBAcGFyYW0ge0hUTUxFbGVtZW50fVxyXG4gKi9cclxudmFyIE15VGl0bGVzID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcclxuICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xyXG5cclxuICB0aGlzLmhhbGZ0b25lcyA9IFtdO1xyXG4gIHRoaXMuaGFsZnRvbmVzLnB1c2gobmV3IEhhbGZ0b25lKGVsZW1lbnQsIEhBTEZUT05FX1NFVFRJTkdTLCAnL2ltYWdlcy9kb3RzaXplLW11c2ljaWFuLmpwZycpKTtcclxuICB0aGlzLmhhbGZ0b25lcy5wdXNoKG5ldyBIYWxmdG9uZShlbGVtZW50LCBIQUxGVE9ORV9TRVRUSU5HUywgJy9pbWFnZXMvZG90c2l6ZS1nb2FsaWUuanBnJykpO1xyXG4gIHRoaXMuaGFsZnRvbmVzLnB1c2gobmV3IEhhbGZ0b25lKGVsZW1lbnQsIEhBTEZUT05FX1NFVFRJTkdTLCAnL2ltYWdlcy9kb3RzaXplLWdlZWsuanBnJykpO1xyXG4gIC8vIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmhhbGZ0b25lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gIC8vICAgdGhpcy5oYWxmdG9uZXNbaV0uZHJhdygwKTtcclxuICAvLyB9XHJcbiAgdmFyIGluZGV4ID0gLTE7XHJcbiAgdmFyIF90aGlzID0gdGhpcztcclxuICBmdW5jdGlvbiBhbmltTmV4dCAoKSB7XHJcbiAgICBpbmRleCA9IChpbmRleCArIDEpICUgX3RoaXMuaGFsZnRvbmVzLmxlbmd0aDtcclxuICAgIC8vY29uc29sZS5sb2coaW5kZXgpO1xyXG4gICAgX3RoaXMuaGFsZnRvbmVzW2luZGV4XS5hbmltKDAsMSxBTklNX1RJTUUsZWFzZXMubGluZWFyKTtcclxuICB9XHJcbiAgLy90aGlzLmhhbGZ0b25lc1swXS5hbmltKC41LDEsQU5JTV9USU1FIC8gMixlYXNlcy5saW5lYXIpO1xyXG4gIGFuaW1OZXh0KCk7XHJcbiAgd2luZG93LnNldEludGVydmFsKGFuaW1OZXh0LEFOSU1fVElNRSAqIC44KTtcclxufVxyXG5cclxudmFyIG15VGl0bGVzRWxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm15LXRpdGxlcycpO1xyXG5mb3IgKHZhciBpID0gMCwgbGVuID0gbXlUaXRsZXNFbHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICBuZXcgTXlUaXRsZXMobXlUaXRsZXNFbHNbaV0pO1xyXG59XHJcbiIsIi8qKlxyXG4gKiAgU2Nyb2xscyB0aGUgc2NyZWVuIHRvIHRoZSB0b3Agb2YgLmhlYWRlci1tYWluIG9uIGxvYWQgaWYgcGFnZVR5cGUgaXMgZGVmaW5lZFxyXG4gKi9cclxuLy8gcmVxdWlyZW1lbnRzXHJcbnZhciBnZXRTY3JvbGxQb3MgPSByZXF1aXJlKCdsaWIvZ2V0U2Nyb2xsUG9zJyk7XHJcbnZhciBhbmltYXRlU2Nyb2xsVG8gPSByZXF1aXJlKCdsaWIvYW5pbWF0ZVNjcm9sbFRvJyk7XHJcblxyXG4vLyBkbyBpdCByaWdodCBhd2F5XHJcbnZhciBoZWFkZXJNYWluID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmhlYWRlci1tYWluJyk7XHJcbnZhciBwYWdlVHlwZSA9IGRvY3VtZW50LmJvZHkuZ2V0QXR0cmlidXRlKCdkYXRhLXBhZ2UtdHlwZScpO1xyXG5cclxuaWYgKHBhZ2VUeXBlICYmIHBhZ2VUeXBlICE9PSAnaW5kZXgnICYmIGhlYWRlck1haW4pIHtcclxuICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoZ2V0U2Nyb2xsUG9zKCkgPCA1MClcclxuICAgICAgYW5pbWF0ZVNjcm9sbFRvKGhlYWRlck1haW4sIG51bGwsIG51bGwsIDYwMCwgMCk7XHJcbiAgfSwgd2luZG93LnNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ3NlZW5OYXYnKSA/IDEwMCA6IDYwMCk7XHJcbiAgd2luZG93LnNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ3NlZW5OYXYnLHRydWUpO1xyXG59XHJcbiIsIi8qKlxuICogIHNjcmlwdHMuanNcbiAqICBUaGlzIHNob3VsZCBpbmNsdWRlIG9iamVjdHMsIHdoaWNoIGluIHR1cm4gaW5jbHVkZSB0aGUgbGliIGZpbGVzIHRoZXkgbmVlZC5cbiAqICBUaGlzIGtlZXBzIHVzIHVzaW5nIGEgbW9kdWxhciBhcHByb2FjaCB0byBkZXYgd2hpbGUgYWxzbyBvbmx5IGluY2x1ZGluZyB0aGVcbiAqICBwYXJ0cyBvZiB0aGUgbGlicmFyeSB3ZSBuZWVkLlxuICovXG4vLyBvYmplY3RzXG5yZXF1aXJlKCdvYmplY3RzL3Njcm9sbE9uTG9hZCcpO1xucmVxdWlyZSgnb2JqZWN0cy9hcnRpY2xlJyk7XG5yZXF1aXJlKCdvYmplY3RzL2lsbHVzdHJhdGlvbicpO1xucmVxdWlyZSgnb2JqZWN0cy9mb290ZXInKTtcbnJlcXVpcmUoJ29iamVjdHMvbXlUaXRsZXMnKTtcbiJdfQ==
