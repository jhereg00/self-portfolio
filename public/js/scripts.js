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
var eases = require('lib/ease');

// settings
var HEADER_HALFTONE_SETTINGS = {
  fade: 12,
  maxRadius: 20
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
    //this.header.animIn(1200);
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

},{"lib/ease":3,"lib/getScrollPos":5,"lib/scrollController":8,"objects/halftone":12}],11:[function(require,module,exports){
// requirements
var Halftone = require('objects/halftone');
var eases = require('lib/ease');

// settings

// init footer halftone
var footerHalftoneEl = document.querySelector('.footer-main__halftone');
if (footerHalftoneEl) {
  var footerHalftone = new Halftone (footerHalftoneEl, {
    fade: 12,
    maxRadius: 20,
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
  maxRadius: 12, // maximum radius for a dot
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
  initialDrawPercentage: .55 // percentage to draw right away
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
    if (percentage == this.lastDrawnPercentage)
      return;

    if (!this.canvas || (percentage < this.settings.inEaseStart || percentage > this.settings.outEaseEnd)) {
      return false;
    }
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
      if (this.dots[i].maxRadius > .5) {
        var dotInPerc = effectiveInPerc - this.dots[i].percentage;
        var dotOutPerc = effectiveOutPerc - (1 - this.dots[i].percentage);
        this.dots[i].setRadiusByPercentage(Math.min(dotInPerc,dotOutPerc));
        this.dots[i].draw(this.ctx);
      }
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
    // kill existing canvas
    if (this.canvas) {
      this.canvas.remove();
    }
    this.rendered = {};
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
    // if (!this.settings.fixed || getBreakpoint < BREAKPOINT_FOR_SCROLL_CONTROL) {
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
          _this.imageOffsets = _this.sizeImage(_this.image);
          _this.lastDrawnPercentage = null;
          _this.draw(_this.getPercentageFromScroll());
        }
      }
    }

    if (this.dotSizeImage && this.dotSizeImage.complete) {
      this.sizeDotsByImage();
    }

    // establish scroll based controls only if screen is large enough for us to care
    if (getBreakpoint() >= BREAKPOINT_FOR_SCROLL_CONTROL && this.settings.control === 'scroll') {
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
    return this.scrollController ? this.scrollController.getPercentage() : this.settings.initialDrawPercentage;
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
  this.halftones.push(new Halftone(element, HALFTONE_SETTINGS, '/images/dotSizeImageTest.jpg'));
  this.halftones.push(new Halftone(element, HALFTONE_SETTINGS, '/images/dotSizeImageTest2.jpg'));
  this.halftones.push(new Halftone(element, HALFTONE_SETTINGS, '/images/dotSizeImageTest3.jpg'));
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

},{"lib/ease":3,"lib/getWindowSize":6,"objects/halftone":12}],14:[function(require,module,exports){
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

},{"lib/animateScrollTo":1,"lib/getScrollPos":5}],15:[function(require,module,exports){
/**
 *  scripts.js
 *  This should include objects, which in turn include the lib files they need.
 *  This keeps us using a modular approach to dev while also only including the
 *  parts of the library we need.
 */
// objects
require('objects/scrollOnLoad');
require('objects/article');
require('objects/footer');
require('objects/myTitles');

},{"objects/article":10,"objects/footer":11,"objects/myTitles":13,"objects/scrollOnLoad":14}]},{},[15])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYW5pbWF0ZVNjcm9sbFRvLmpzIiwibGliL2JyZWFrcG9pbnRzLmpzIiwibGliL2Vhc2UuanMiLCJsaWIvZ2V0UGFnZU9mZnNldC5qcyIsImxpYi9nZXRTY3JvbGxQb3MuanMiLCJsaWIvZ2V0V2luZG93U2l6ZS5qcyIsImxpYi9sb29wLmpzIiwibGliL3Njcm9sbENvbnRyb2xsZXIuanMiLCJsaWIvc2V0VHJhbnNmb3JtLmpzIiwib2JqZWN0cy9hcnRpY2xlLmpzIiwib2JqZWN0cy9mb290ZXIuanMiLCJvYmplY3RzL2hhbGZ0b25lLmpzIiwib2JqZWN0cy9teVRpdGxlcy5qcyIsIm9iamVjdHMvc2Nyb2xsT25Mb2FkLmpzIiwic2NyaXB0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiAgQW5pbWF0ZXMgd2luZG93IHNjcm9sbCB0byBhbiBlbGVtZW50IG9yIHNjcm9sbFlcbiAqL1xuXG4vLyByZXF1aXJlbWVudHNcbnZhciBsb29wID0gcmVxdWlyZSgnbGliL2xvb3AnKTtcbnZhciBnZXRQYWdlT2Zmc2V0ID0gcmVxdWlyZSgnbGliL2dldFBhZ2VPZmZzZXQnKTtcbnZhciBnZXRTY3JvbGxQb3MgPSByZXF1aXJlKCdsaWIvZ2V0U2Nyb2xsUG9zJyk7XG52YXIgZWFzZXMgPSByZXF1aXJlKCdsaWIvZWFzZScpO1xuXG4vLyBzZXR0aW5nc1xudmFyIGRlZmF1bHRPZmZzZXRUb3AgPSA0ODtcbnZhciBkZWZhdWx0QW5pbVRpbWUgPSAxMDAwO1xudmFyIGFuaW1UaW1lO1xuXG4vLyBkbyB0aGluZ3MhXG4vKipcbiAqICB0aGUgZnVuY3Rpb24gdGhhdCBnb2VzIGluIHRoZSBsb29wXG4gKi9cbnZhciBzdGFydFRpbWUsIHN0YXJ0UG9zLCBlbmRQb3M7XG52YXIgYW5pbUZuID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIGlmIChub3cgLSBzdGFydFRpbWUgPCBhbmltVGltZSlcbiAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgZWFzZXMuZWFzZUluT3V0KHN0YXJ0UG9zLCBlbmRQb3MgLSBzdGFydFBvcywgKG5vdyAtIHN0YXJ0VGltZSkgLyBhbmltVGltZSkpO1xuICBlbHNlIHtcbiAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgZW5kUG9zKTtcbiAgICBsb29wLnJlbW92ZUZ1bmN0aW9uKGFuaW1Gbik7XG4gIH1cbn1cblxuLyoqXG4gKiAgU2Nyb2xsIHRvIGVsZW1lbnQgb3IgbnVtYmVyXG4gKiAgQHBhcmFtIHtIVE1MRWxlbWVudCBvciBzdHJpbmcoaWQgb2YgZWxlbWVudCkgb3IgbnVtYmVyfVxuICogIFtAcGFyYW0ge251bWJlcn1dIHBvc2l0aW9uIHRvIHN0YXJ0IHNjcm9sbGluZyBmcm9tXG4gKiAgW0BwYXJhbSB7Ym9vbGVhbn1dIHBhc3MgZmFsc2UgdG8gc2tpcCBhbmltYXRpb25cbiAqICBbQHBhcmFtIHtudW1iZXJ9XSB0aW1lIGZvciBhbmltYXRpb25cbiAqICBbQHBhcmFtIHtudW1iZXJ9XSBvZmZzZXQgZnJvbSB0b3BcbiAqL1xudmFyIHNjcm9sbFRvID0gZnVuY3Rpb24gKGRlc3QsIHNjcm9sbFBvcywgYW5pbSwgdGltZSwgb2Zmc2V0KSB7XG4gIGlmICh0eXBlb2YgZGVzdCA9PT0gJ3N0cmluZycpIHtcbiAgICBkZXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVzdC5yZXBsYWNlKCcjJywnJykpO1xuICB9XG4gIGlmICh0eXBlb2YgZGVzdCAhPT0gJ251bWJlcicpIHtcbiAgICB0cnkge1xuICAgICAgZGVzdCA9IGdldFBhZ2VPZmZzZXQoZGVzdCkudG9wIC0gKGlzTmFOKG9mZnNldCkgPyBkZWZhdWx0T2Zmc2V0VG9wIDogb2Zmc2V0KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBsb29wLnJlbW92ZUZ1bmN0aW9uKGFuaW1Gbik7XG4gIGlmIChhbmltICE9PSBmYWxzZSkge1xuICAgIHN0YXJ0UG9zID0gc2Nyb2xsUG9zIHx8IGdldFNjcm9sbFBvcygpO1xuICAgIGVuZFBvcyA9IGRlc3Q7XG4gICAgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgYW5pbVRpbWUgPSB0aW1lIHx8IGRlZmF1bHRBbmltVGltZTtcblxuICAgIGxvb3AuYWRkRnVuY3Rpb24oYW5pbUZuKTtcbiAgfVxuICBlbHNlIHtcbiAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgZGVzdCk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzY3JvbGxUbztcbiIsInZhciBicHMgPSBbNzIwLDk2MCwxMjAwLDE2ODBdO1xuXG52YXIgd2luZG93U2l6ZSA9IHJlcXVpcmUoJ2xpYi9nZXRXaW5kb3dTaXplJyk7XG5cbnZhciBnZXRCcmVha3BvaW50ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc2l6ZSA9IHdpbmRvd1NpemUud2lkdGgoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBicHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYnBzW2ldID4gc2l6ZSlcbiAgICAgIHJldHVybiBpO1xuICB9XG4gIHJldHVybiBicHMubGVuZ3RoO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldEJyZWFrcG9pbnQ7XG4iLCIvLyBhIGJ1bmNoIG9mIGVhc2luZyBmdW5jdGlvbnMgZm9yIG1ha2luZyBhbmltYXRpb25zXG4vLyBhbGwgYWNjZXB0IHN0YXJ0LCBjaGFuZ2UsIGFuZCBwZXJjZW50XG5cbnZhciBlYXNlcyA9IHtcbiAgJ2Vhc2VJbk91dCcgOiBmdW5jdGlvbiAocyxjLHApIHtcbiAgICBpZiAocCA8IC41KSB7XG4gICAgICByZXR1cm4gcyArIGMgKiAoMiAqIHAgKiBwKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gcyArIGMgKiAoLTIgKiAocCAtIDEpICogKHAgLSAxKSArIDEpO1xuICAgIH1cbiAgfSxcbiAgJ2Vhc2VJbicgOiBmdW5jdGlvbiAocyxjLHApIHtcbiAgICByZXR1cm4gcyArIGMgKiBwICogcDtcbiAgfSxcbiAgJ2Vhc2VJbkN1YmljJyA6IGZ1bmN0aW9uIChzLGMscCkge1xuICAgIHJldHVybiBzICsgYyAqIChwICogcCAqIHApO1xuICB9LFxuICAnZWFzZU91dCcgOiBmdW5jdGlvbiAocyxjLHApIHtcbiAgICByZXR1cm4gcyArIGMgKiAoLTEgKiAocCAtIDEpICogKHAgLSAxKSArIDEpO1xuICB9LFxuICAnZWFzZU91dEN1YmljJyA6IGZ1bmN0aW9uIChzLGMscCkge1xuICAgIHJldHVybiBzICsgYyAqICgocCAtIDEpICogKHAgLSAxKSAqIChwIC0gMSkgKyAxKTtcbiAgfSxcbiAgJ2xpbmVhcicgOiBmdW5jdGlvbiAocyxjLHApIHtcbiAgICByZXR1cm4gcyArIGMgKiBwO1xuICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IGVhc2VzO1xuIiwiLyoqXG4gKiAgRnVuY3Rpb246IG9zLmdldFBhZ2VPZmZzZXRcbiAqICBnZXRzIHRoZSBwYWdlIG9mZnNldCB0b3AgYW5kIGxlZnQgb2YgYSBET00gZWxlbWVudFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldFBhZ2VPZmZzZXQgKGVsZW1lbnQpIHtcbiAgaWYgKCFlbGVtZW50KSB7XG4gICAgY29uc29sZS5lcnJvcignZ2V0UGFnZU9mZnNldCBwYXNzZWQgYW4gaW52YWxpZCBlbGVtZW50OicsIGVsZW1lbnQpO1xuICB9XG4gIHZhciBwYWdlT2Zmc2V0WCA9IGVsZW1lbnQub2Zmc2V0TGVmdCxcbiAgcGFnZU9mZnNldFkgPSBlbGVtZW50Lm9mZnNldFRvcDtcblxuICB3aGlsZSAoZWxlbWVudCA9IGVsZW1lbnQub2Zmc2V0UGFyZW50KSB7XG4gICAgcGFnZU9mZnNldFggKz0gZWxlbWVudC5vZmZzZXRMZWZ0O1xuICAgIHBhZ2VPZmZzZXRZICs9IGVsZW1lbnQub2Zmc2V0VG9wO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBsZWZ0IDogcGFnZU9mZnNldFgsXG4gICAgdG9wIDogcGFnZU9mZnNldFlcbiAgfVxufVxuIiwiLyoqXG4gKiAgZ2V0U2Nyb2xsUG9zXG4gKlxuICogIGNyb3NzIGJyb3dzZXIgd2F5IHRvIGdldCBzY3JvbGxUb3BcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKHVuZGVmaW5lZCkge1xuICBpZiAod2luZG93LnNjcm9sbFkgIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0U2Nyb2xsUG9zICgpIHsgcmV0dXJuIHdpbmRvdy5zY3JvbGxZOyB9XG4gIGVsc2VcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0U2Nyb2xsUG9zICgpIHsgcmV0dXJuIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3A7IH1cbn0pKCk7XG4iLCIvKipcbiAqICBnZXQgd2luZG93IHNpemUsIGNyb3NzIGJyb3dzZXIgZnJpZW5kbHlcbiAqICBjYWxsIC53aWR0aCgpIG9yIC5oZWlnaHQoKSB0byBnZXQgdGhlIHJlbGV2YW50IHZhbHVlIGluIHBpeGVsc1xuICovXG52YXIgd2luZG93SGVpZ2h0ID0gZnVuY3Rpb24gd2luZG93SGVpZ2h0ICgpIHtcbiAgcmV0dXJuIHdpbmRvdy5pbm5lckhlaWdodCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xufTtcbnZhciB3aW5kb3dXaWR0aCA9IGZ1bmN0aW9uIHdpbmRvd1dpZHRoICgpIHtcbiAgcmV0dXJuIHdpbmRvdy5pbm5lcldpZHRoIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB3aWR0aDogd2luZG93V2lkdGgsXG4gIGhlaWdodDogd2luZG93SGVpZ2h0XG59XG4iLCIvKipcbiAqICBMb29wXG4gKlxuICogIFRoZSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgTG9vcC4gSXQgaGFuZGxlcyBhbmltYXRpb24gYW5kIHN0YXRlIGNoYW5nZXNcbiAqICByZWxhdGVkIHRvIHNjcm9sbGluZyBvciB3aW5kb3cgc2l6aW5nLiBJdCBjYW4gYWxzbyBiZSB1c2VkIGZvciByZWd1bGFyIGpzXG4gKiAgZHJpdmVuIGFuaW1hdGlvbiBhcyB3ZWxsLlxuICpcbiAqICBUbyB1c2U6XG4gKiAgICBleHBvcnRzLmFkZFNjcm9sbEZ1bmN0aW9uKGZuKSAtIGFkZHMgYSBmdW5jdGlvbiB0byBmaXJlIHdoZW5ldmVyIHNjcm9sbFxuICogICAgICBwb3NpdGlvbiBjaGFuZ2VzXG4gKiAgICBleHBvcnRzLmFkZFJlc2l6ZUZ1bmN0aW9uKGZuKSAtIGFkZHMgYSBmdW5jdGlvbiB0byBmaXJlIHdoZW5ldmVyIHRoZVxuICogICAgICB3aW5kb3cgaXMgcmVzaXplZCwgZGVib3VuY2VkIGJ5IHRoZSB2YWx1ZSBvZiB0aGUgcmVzaXplRGVib3VuY2UgdmFyXG4gKiAgICBleHBvcnRzLmFkZEZ1bmN0aW9uKGZuKSAtIGFkZHMgYSBmdW5jdGlvbiB0byBmaXJlIG9uIGV2ZXJ5IGl0ZXJhdGlvbiBvZlxuICogICAgICB0aGUgbG9vcC4gTGltaXQgdGhlIHVzZSBvZiB0aGlzXG4gKiAgICBleHBvcnRzLnJlbW92ZUZ1bmN0aW9uKGZuKSAtIHJlbW92ZXMgYSBmdW5jdGlvbiBmcm9tIHRoZSBsaXN0IG9mIGZ1bmN0aW9uc1xuICogICAgICB0byBmaXJlXG4gKiAgICBleHBvcnRzLnN0YXJ0KCkgLSBzdGFydHMgdGhlIGxvb3AgKGRvZXNuJ3QgbmVlZCB0byBiZSBjYWxsZWQgdW5sZXNzIHRoZVxuICogICAgICBsb29wIHdhcyBzdG9wcGVkIGF0IHNvbWUgcG9pbnQpXG4gKiAgICBleHBvcnRzLnN0b3AoKSAtIHN0b3BzIHRoZSBsb29wXG4gKiAgICBleHBvcnRzLmZvcmNlKCkgLSBmb3JjZXMgdGhlIG5leHQgaXRlcmF0aW9uIG9mIHRoZSBsb29wIHRvIGZpcmUgc2Nyb2xsIGFuZFxuICogICAgICByZXNpemUgZnVuY3Rpb25zLCByZWdhcmRsZXNzIG9mIHdoZXRoZXIgb3Igbm90IGVpdGhlciB0aGluZ3MgYWN0dWFsbHlcbiAqICAgICAgaGFwcGVuZWRcbiAqL1xuXG4vKipcbiAqIFByb3ZpZGVzIHJlcXVlc3RBbmltYXRpb25GcmFtZSBpbiBhIGNyb3NzIGJyb3dzZXIgd2F5LlxuICogQGF1dGhvciBwYXVsaXJpc2ggLyBodHRwOi8vcGF1bGlyaXNoLmNvbS9cbiAqL1xuaWYgKCAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSApIHtcblx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9ICggZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHR3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG5cdFx0d2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHR3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHRmdW5jdGlvbiggLyogZnVuY3Rpb24gRnJhbWVSZXF1ZXN0Q2FsbGJhY2sgKi8gY2FsbGJhY2sgKSB7XG5cdFx0XHR3aW5kb3cuc2V0VGltZW91dCggY2FsbGJhY2ssIDEwMDAgLyA2MCApO1xuXHRcdH07XG5cdH0gKSgpO1xufVxuXG47KGZ1bmN0aW9uIChkb2N1bWVudCx3aW5kb3csdW5kZWZpbmVkKSB7XG5cbiAgLy8gb3RoZXIgbGliIGhlbHBlcnNcbiAgdmFyIGdldFNjcm9sbFBvcyA9IHJlcXVpcmUoJ2xpYi9nZXRTY3JvbGxQb3MnKTtcblxuICAvLyBwcml2YXRlIHZhcnNcbiAgdmFyIHJ1bm5pbmcgPSB0cnVlLFxuICAgICAgbGFzdEJvZHlXaWR0aCA9IGRvY3VtZW50LmJvZHkub2Zmc2V0V2lkdGgsIC8vIHN0b3JlIHdpZHRoIHRvIGRldGVybWluZSBpZiByZXNpemUgbmVlZGVkXG4gICAgICBsYXN0Qm9keUhlaWdodCA9IGRvY3VtZW50LmJvZHkub2Zmc2V0SGVpZ2h0LCAvLyBzdG9yZSBoZWlnaHQgdG8gZGV0ZXJtaW5lIGlmIHJlc2l6ZSBuZWVkZWRcbiAgICAgIGxhc3RTY3JvbGwgPSAtMSxcbiAgICAgIGxhc3RUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCksIC8vIGxhc3QgdGltZSBzbyB3ZSBrbm93IGhvdyBsb25nIGl0J3MgYmVlblxuICAgICAgcmVzaXplRGVib3VuY2UgPSA1MDBcbiAgICAgIDtcblxuICAvLyBzYXZlIHRoZSBmdW5jdGlvbnMgdGhlIGxvb3Agc2hvdWxkIHJ1blxuICAvLyB3aWxsIGJlIHBhc3NlZCBjdXJyZW50VGltZSwgdGltZUNoYW5nZVxuICB2YXIgbG9vcEZ1bmNzID0ge1xuICAgIHJlc2l6ZSA6IFtdLCAvLyBmdW5jdGlvbnMgdG8gcnVuIG9uIHJlc2l6ZVxuICAgIHNjcm9sbCA6IFtdLCAvLyBmdW5jdGlvbnMgdG8gcnVuIG9uIHNjcm9sbFxuICAgIHRpY2sgOiBbXSAvLyBmdW5jdGlvbnMgdG8gcnVuIGV2ZXJ5IHRpY2tcbiAgfTtcblxuICAvLyBhZGQvcmVtb3ZlIG1ldGhvZHMgZm9yIHRob3NlIGZ1bmN0aW9uc1xuICB2YXIgYWRkTG9vcEZ1bmN0aW9uID0gZnVuY3Rpb24gYWRkTG9vcEZ1bmN0aW9uICh0eXBlLCBmbikge1xuICAgIGlmIChsb29wRnVuY3NbdHlwZV0uaW5kZXhPZihmbikgPT09IC0xKSB7IC8vIG1ha2Ugc3VyZSBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QgKG9ubHkgd29ya3Mgd2l0aCBub24tYW5vbnltb3VzIGZ1bmN0aW9ucylcbiAgICAgIGxvb3BGdW5jc1t0eXBlXS5wdXNoKGZuKTtcblx0XHRcdHN0YXJ0KCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciBhZGRTY3JvbGxGdW5jdGlvbiA9IGZ1bmN0aW9uIGFkZFNjcm9sbEZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBhZGRMb29wRnVuY3Rpb24oJ3Njcm9sbCcsZm4pO1xuICB9XG4gIHZhciBhZGRSZXNpemVGdW5jdGlvbiA9IGZ1bmN0aW9uIGFkZFJlc2l6ZUZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBhZGRMb29wRnVuY3Rpb24oJ3Jlc2l6ZScsZm4pO1xuICB9XG4gIHZhciBhZGRGdW5jdGlvbiA9IGZ1bmN0aW9uIGFkZEZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBhZGRMb29wRnVuY3Rpb24oJ3RpY2snLGZuKTtcbiAgfVxuICB2YXIgcmVtb3ZlRnVuY3Rpb24gPSBmdW5jdGlvbiByZW1vdmVGdW5jdGlvbiAoZm4pIHtcbiAgICB2YXIgdHlwZXMgPSBbJ3Jlc2l6ZScsJ3Njcm9sbCcsJ3RpY2snXTtcbiAgICB2YXIgZm91bmQgPSBmYWxzZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR5cGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaW5kZXggPSBsb29wRnVuY3NbdHlwZXNbaV1dLmluZGV4T2YoZm4pO1xuICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICBsb29wRnVuY3NbdHlwZXNbaV1dLnNwbGljZShpbmRleCwxKTtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cdFx0Ly8gY2hlY2sgdGhhdCB3ZSdyZSBzdGlsbCBsaXN0ZW5pbmdcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR5cGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAobG9vcEZ1bmNzW3R5cGVzW2ldXS5sZW5ndGgpXG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZWxzZSBpZiAoaSA9PT0gdHlwZXMubGVuZ3RoIC0gMSlcblx0XHRcdFx0c3RvcCgpO1xuXHRcdH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cblxuICAvLyBkbyBhbGwgZnVuY3Rpb25zIG9mIGEgZ2l2ZW4gdHlwZVxuICB2YXIgZG9Mb29wRnVuY3Rpb25zID0gZnVuY3Rpb24gZG9Mb29wRnVuY3Rpb25zICh0eXBlLGN1cnJlbnRUaW1lKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGxvb3BGdW5jc1t0eXBlXS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGxvb3BGdW5jc1t0eXBlXVtpXSkgLy8gZXh0cmEgY2hlY2sgZm9yIHNhZmV0eVxuICAgICAgXHRsb29wRnVuY3NbdHlwZV1baV0uY2FsbCh3aW5kb3csY3VycmVudFRpbWUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIHN0YXJ0L3N0b3AgY29udHJvbFxuICB2YXIgc3RhcnQgPSBmdW5jdGlvbiBzdGFydExvb3AgKCkge1xuICAgIHJ1bm5pbmcgPSB0cnVlO1xuXHRcdGxvb3BGbigpO1xuICB9XG4gIHZhciBzdG9wID0gZnVuY3Rpb24gc3RvcExvb3AgKCkge1xuICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgfVxuXG4gIC8vIGZvcmNlIGl0IHRvIGZpcmUgbmV4dCB0aW1lIHRocm91Z2ggYnkgc2V0dGluZyBsYXN0U2Nyb2xsIGFuZCBsYXN0Qm9keVdpZHRoXG4gIC8vIHRvIGltcG9zc2libGUgdmFsdWVzXG4gIHZhciBmb3JjZSA9IGZ1bmN0aW9uIGZvcmNlTG9vcCAoKSB7XG4gICAgbGFzdEJvZHlXaWR0aCA9IC0xO1xuICAgIGxhc3RTY3JvbGwgPSAtMTtcbiAgfVxuXG4gIC8vIGhvbGQgYSByZXNpemUgdGltb3V0IHNvIHdlIGNhbiBkZWJvdW5jZSBpdFxuICB2YXIgcmVzaXplVGltZW91dCA9IG51bGw7XG5cbiAgLy8gdGhlIHJlYWwgZGVhbCFcbiAgLy8gaW4gYSBjbG9zdXJlIGZvciBtYXhpbXVtIHNhZmV0eSwgYW5kIHNvIGl0IGF1dG9zdGFydHNcbiAgLy8gbm90ZTogYWZ0ZXIgY2hlY2tpbmcgdXNpbmcganNwZXJmLCByYXRoZXIgdGhhbiBtYWtpbmcgb25lIGJpZyB0b2RvIGFycmF5IG9mXG4gIC8vIGFsbCB0aGUgZnVuY3Rpb25zLCBpdCdzIGZhc3RlciB0byBjYWxsIGVhY2ggYXJyYXkgb2YgZnVuY3Rpb25zIHNlcGFyYXRlbHlcbiAgZnVuY3Rpb24gbG9vcEZuKCkge1xuXG4gICAgLy8gY2hlY2sgdGhhdCB3ZSdyZSBhY3R1YWxseSBydW5uaW5nLi4uXG4gICAgaWYgKHJ1bm5pbmcpIHtcblxuICAgICAgdmFyIGN1cnJlbnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICB2YXIgdGltZUNoYW5nZSA9IGN1cnJlbnRUaW1lIC0gbGFzdFRpbWU7XG4gICAgICB2YXIgY3VycmVudFNjcm9sbCA9IGdldFNjcm9sbFBvcygpO1xuXG4gICAgICAvLyBjaGVjayBpZiByZXNpemVcbiAgICAgIGlmIChkb2N1bWVudC5ib2R5Lm9mZnNldFdpZHRoICE9PSBsYXN0Qm9keVdpZHRoIHx8IGRvY3VtZW50LmJvZHkub2Zmc2V0SGVpZ2h0ICE9PSBsYXN0Qm9keUhlaWdodCkge1xuICAgICAgICAvLyByZXNpemUgaXMgdHJ1ZSwgc2F2ZSBuZXcgc2l6ZXNcbiAgICAgICAgbGFzdEJvZHlXaWR0aCA9IGRvY3VtZW50LmJvZHkub2Zmc2V0V2lkdGg7XG4gICAgICAgIGxhc3RCb2R5SGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5vZmZzZXRIZWlnaHQ7XG5cbiAgICAgICAgaWYgKHJlc2l6ZVRpbWVvdXQpXG4gICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChyZXNpemVUaW1lb3V0KTtcbiAgICAgICAgcmVzaXplVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBkb0xvb3BGdW5jdGlvbnMoJ3Jlc2l6ZScsY3VycmVudFRpbWUpO1xuICAgICAgICB9LCByZXNpemVEZWJvdW5jZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIGNoZWNrIGlmIHNjcm9sbFxuICAgICAgaWYgKGxhc3RTY3JvbGwgIT09IGN1cnJlbnRTY3JvbGwpIHtcbiAgICAgICAgLy8gc2Nyb2xsIGlzIHRydWUsIHNhdmUgbmV3IHBvc2l0aW9uXG4gICAgICAgIGxhc3RTY3JvbGwgPSBjdXJyZW50U2Nyb2xsO1xuXG4gICAgICAgIC8vIGNhbGwgZWFjaCBmdW5jdGlvblxuICAgICAgICBkb0xvb3BGdW5jdGlvbnMoJ3Njcm9sbCcsY3VycmVudFRpbWUpO1xuICAgICAgfVxuXG4gICAgICAvLyBkbyB0aGUgYWx3YXlzIGZ1bmN0aW9uc1xuICAgICAgZG9Mb29wRnVuY3Rpb25zKCd0aWNrJyxjdXJyZW50VGltZSk7XG5cbiAgICAgIC8vIHNhdmUgdGhlIG5ldyB0aW1lXG4gICAgICBsYXN0VGltZSA9IGN1cnJlbnRUaW1lO1xuXG5cdFx0XHQvLyBtYWtlIHN1cmUgd2UgZG8gdGhlIHRpY2sgYWdhaW4gbmV4dCB0aW1lXG5cdCAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcEZuKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gZXhwb3J0IHRoZSB1c2VmdWwgZnVuY3Rpb25zXG4gIG1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFkZFNjcm9sbEZ1bmN0aW9uOiBhZGRTY3JvbGxGdW5jdGlvbixcbiAgICBhZGRSZXNpemVGdW5jdGlvbjogYWRkUmVzaXplRnVuY3Rpb24sXG4gICAgYWRkRnVuY3Rpb246IGFkZEZ1bmN0aW9uLFxuICAgIHJlbW92ZUZ1bmN0aW9uOiByZW1vdmVGdW5jdGlvbixcbiAgICBzdGFydDogc3RhcnQsXG4gICAgc3RvcDogc3RvcCxcbiAgICBmb3JjZTogZm9yY2VcbiAgfVxuXG59KShkb2N1bWVudCx3aW5kb3cpO1xuIiwiLyoqXG4gKiAgVXNlZnVsIGNsYXNzIGZvciBoYW5kbGluZyBwYXJhbGxheGluZyB0aGluZ3NcbiAqICBTdG9yZXMgb2JqZWN0IG1lYXN1cmVtZW50cyBhbmQgcmV0dXJucyBwZXJjZW50YWdlIG9mIHNjcm9sbCB3aGVuIGFza2VkXG4gKi9cblxuLy8gaGVscGVyc1xudmFyIGdldFBhZ2VPZmZzZXQgPSByZXF1aXJlKCdsaWIvZ2V0UGFnZU9mZnNldCcpLFxuICAgIHdpbmRvd1NpemUgPSByZXF1aXJlKCdsaWIvZ2V0V2luZG93U2l6ZScpLFxuICAgIGdldFNjcm9sbFBvcyA9IHJlcXVpcmUoJ2xpYi9nZXRTY3JvbGxQb3MnKSxcbiAgICBsb29wID0gcmVxdWlyZSgnbGliL2xvb3AnKVxuICAgIDtcblxuXG52YXIgUGFyYWxsYXggPSBmdW5jdGlvbiBQYXJhbGxheCAoZWxlbWVudCwgb25TY3JvbGwpIHtcbiAgaWYgKCF0aGlzIGluc3RhbmNlb2YgUGFyYWxsYXgpXG4gICAgcmV0dXJuIG5ldyBQYXJhbGxheChlbGVtZW50KTtcblxuICB2YXIgX3RoaXMgPSB0aGlzO1xuICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG4gIC8vIGdldCBtZWFzdXJlbWVudHMgaW1tZWRpYXRlbHlcbiAgdGhpcy5tZWFzdXJlKCk7XG4gIGlmIChvblNjcm9sbClcbiAgICBvblNjcm9sbChfdGhpcy5nZXRQZXJjZW50YWdlKCkpO1xuXG4gIC8vIGxpc3RlbmVyc1xuICB0aGlzLm9uUmVzaXplID0gZnVuY3Rpb24gbWVhc3VyZVBhcmFsbGF4ICgpIHtcbiAgICBfdGhpcy5tZWFzdXJlKCk7XG4gIH1cbiAgaWYgKG9uU2Nyb2xsKSB7XG4gICAgdGhpcy5vblNjcm9sbCA9IGZ1bmN0aW9uIHNjcm9sbFBhcmFsbGF4ICgpIHtcbiAgICAgIG9uU2Nyb2xsLmFwcGx5KF90aGlzLCBbX3RoaXMuZ2V0UGVyY2VudGFnZSgpXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gc3RhcnQgJ2VyIHVwXG4gIHRoaXMuZW5hYmxlKCk7XG59XG5QYXJhbGxheC5wcm90b3R5cGUgPSB7XG4gIG1lYXN1cmU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcG8gPSBnZXRQYWdlT2Zmc2V0KHRoaXMuZWxlbWVudCk7XG4gICAgdGhpcy50b3AgPSBwby50b3AgLSB3aW5kb3dTaXplLmhlaWdodCgpO1xuICAgIHRoaXMuYm90dG9tID0gcG8udG9wICsgdGhpcy5lbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgICB0aGlzLmhlaWdodCA9IHRoaXMuYm90dG9tIC0gdGhpcy50b3A7XG4gIH0sXG4gIGdldFBlcmNlbnRhZ2U6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2Nyb2xsWSA9IGdldFNjcm9sbFBvcygpO1xuICAgIHZhciBwZXJjID0gKHNjcm9sbFkgLSB0aGlzLnRvcCkgLyAodGhpcy5oZWlnaHQpO1xuICAgIHJldHVybiBwZXJjO1xuICB9LFxuICBkaXNhYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgbG9vcC5yZW1vdmVGdW5jdGlvbih0aGlzLm9uUmVzaXplKTtcbiAgICBpZiAodGhpcy5vblNjcm9sbClcbiAgICAgIGxvb3AucmVtb3ZlRnVuY3Rpb24odGhpcy5vblNjcm9sbCk7XG4gIH0sXG4gIGVuYWJsZTogZnVuY3Rpb24gKCkge1xuICAgIGxvb3AuYWRkUmVzaXplRnVuY3Rpb24odGhpcy5vblJlc2l6ZSk7XG4gICAgaWYgKHRoaXMub25TY3JvbGwpXG4gICAgICBsb29wLmFkZFNjcm9sbEZ1bmN0aW9uKHRoaXMub25TY3JvbGwpO1xuICB9LFxuICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgZGVsZXRlIHRoaXM7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQYXJhbGxheDtcbiIsIi8qKlxuICogIFNldHMgVHJhbnNmb3JtIHN0eWxlcyBjcm9zcyBicm93c2VyXG4gKiAgQHBhcmFtIHtIVE1MRWxlbWVudH1cbiAqICBAcGFyYW0ge3N0cmluZ30gdmFsdWUgb2YgdGhlIHRyYW5zZm9ybSBzdHlsZVxuICovXG5cbnZhciB0cmFuc2Zvcm1BdHRyaWJ1dGVzID0gWyd0cmFuc2Zvcm0nLCd3ZWJraXRUcmFuc2Zvcm0nLCdtb3pUcmFuc2Zvcm0nLCdtc1RyYW5zZm9ybSddO1xudmFyIHNldFRyYW5zZm9ybSA9IGZ1bmN0aW9uIChlbGVtZW50LCB0cmFuc2Zvcm1TdHJpbmcpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRyYW5zZm9ybUF0dHJpYnV0ZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBlbGVtZW50LnN0eWxlW3RyYW5zZm9ybUF0dHJpYnV0ZXNbaV1dID0gdHJhbnNmb3JtU3RyaW5nO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0VHJhbnNmb3JtO1xuIiwiLyoqXHJcbiAqICBGdWxsIEFydGljbGUgY29udHJvbGxlclxyXG4gKi9cclxuXHJcbi8vIHJlcXVpcmVtZW50c1xyXG52YXIgSGFsZnRvbmUgPSByZXF1aXJlKCdvYmplY3RzL2hhbGZ0b25lJyk7XHJcbnZhciBTY3JvbGxDb250cm9sbGVyID0gcmVxdWlyZSgnbGliL3Njcm9sbENvbnRyb2xsZXInKTtcclxudmFyIGdldFNjcm9sbFBvcyA9IHJlcXVpcmUoJ2xpYi9nZXRTY3JvbGxQb3MnKTtcclxudmFyIGVhc2VzID0gcmVxdWlyZSgnbGliL2Vhc2UnKTtcclxuXHJcbi8vIHNldHRpbmdzXHJcbnZhciBIRUFERVJfSEFMRlRPTkVfU0VUVElOR1MgPSB7XHJcbiAgZmFkZTogMTIsXHJcbiAgbWF4UmFkaXVzOiAyMFxyXG59XHJcbnZhciBJTk5FUl9IQUxGVE9ORV9TRVRUSU5HUyA9IHtcclxuICBmYWRlOiAwLFxyXG4gIGltYWdlU2l6aW5nOiAnY29udGFpbicsXHJcbiAgaW5FYXNlU3RhcnQ6IC4xLCAvLyBzY3JvbGwgcGVyY2VudGFnZSB0byBzdGFydCBhbmltYXRpb24gaW4gb24gZmlyc3QgZG90XHJcbiAgaW5FYXNlRW5kOiAuNSwgLy8gc2Nyb2xsIHBlcmNlbnRhZ2UgdG8gZW5kIGFuaW1hdGlvbiBpbiBvbiBsYXN0IGRvdFxyXG4gIG91dEVhc2VTdGFydDogLjc1LFxyXG4gIGNvcm5lcmluZzogOFxyXG59XHJcbnZhciBSRUxBVEVEX0hBTEZUT05FX1NFVFRJTkdTID0ge1xyXG4gIGZhZGU6IDAsXHJcbiAgaW5FYXNlU3RhcnQ6IC0uNCxcclxuICBpbkVhc2VFbmQ6IC44LFxyXG4gIGluRWFzZUZuOiBlYXNlcy5saW5lYXIsXHJcbiAgb3V0RWFzZVN0YXJ0OiAuNixcclxuICBvdXRFYXNlRW5kOiAxLjJcclxufVxyXG5cclxuLyoqXHJcbiAqICBBcnRpY2xlIGNsYXNzXHJcbiAqICBAcGFyYW0ge0hUTUxFbGVtZW50fSB0aGUgd2hvbGUgZGFtbiBhcnRpY2xlXHJcbiAqL1xyXG52YXIgQXJ0aWNsZSA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XHJcbiAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuXHJcbiAgLy8gaW5pdCBoZWFkZXJcclxuICB2YXIgaGVhZGVyRWwgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hcnRpY2xlX19oZWFkZXInKTtcclxuICBpZiAoaGVhZGVyRWwpIHtcclxuICAgIHRoaXMuaGVhZGVyID0gbmV3IEhhbGZ0b25lKGhlYWRlckVsLCBIRUFERVJfSEFMRlRPTkVfU0VUVElOR1MpO1xyXG4gICAgLy90aGlzLmhlYWRlci5hbmltSW4oMTIwMCk7XHJcbiAgfVxyXG5cclxuICAvLyBpbml0IG90aGVyIGhhbGZ0b25lc1xyXG4gIHZhciBoYWxmdG9uZUVscyA9IGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmhhbGZ0b25lJyk7XHJcbiAgdGhpcy5oYWxmdG9uZXMgPSBbXTtcclxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gaGFsZnRvbmVFbHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgIHZhciBodCA9IG5ldyBIYWxmdG9uZShoYWxmdG9uZUVsc1tpXSwgSU5ORVJfSEFMRlRPTkVfU0VUVElOR1MpO1xyXG4gICAgLy9odC5hbmltSW4oMTIwMCk7XHJcbiAgICB0aGlzLmhhbGZ0b25lcy5wdXNoKGh0KTtcclxuICB9XHJcblxyXG4gIHZhciByZWxhdGVkc0VsID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmVsYXRlZHMnKTtcclxuICBpZiAocmVsYXRlZHNFbCkge1xyXG4gICAgdGhpcy5oYWxmdG9uZXMucHVzaChuZXcgSGFsZnRvbmUocmVsYXRlZHNFbCwgUkVMQVRFRF9IQUxGVE9ORV9TRVRUSU5HUykpO1xyXG4gIH1cclxuXHJcbiAgLy8gYnV0dG9uc1xyXG4gIC8vIHZhciBidXR0b25FbHMgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5idXR0b24nKTtcclxuICAvLyB0aGlzLmJ1dHRvbnMgPSBbXTtcclxuICAvLyBmb3IgKHZhciBpID0gMCwgbGVuID0gYnV0dG9uRWxzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgLy8gICB2YXIgaHQgPSBuZXcgSGFsZnRvbmUoYnV0dG9uRWxzW2ldLCB7XHJcbiAgLy8gICAgIGZhZGU6IDEsXHJcbiAgLy8gICAgIGluRWFzZVN0YXJ0OiAwLFxyXG4gIC8vICAgICBpbkVhc2VFbmQ6IDEsXHJcbiAgLy8gICAgIG91dEVhc2VTdGFydDogMS4xLFxyXG4gIC8vICAgICBvdXRFYXNlRW5kOiAxLjEsXHJcbiAgLy8gICAgIGNvbnRyb2w6ICdub25lJyxcclxuICAvLyAgICAgZmlsbDogJyMwNDZjNmYnXHJcbiAgLy8gICB9KTtcclxuICAvLyAgIGJ1dHRvbkVsc1tpXS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLGZ1bmN0aW9uICgpIHtcclxuICAvLyAgICAgaHQuYW5pbSguNSwxLDMwMDApO1xyXG4gIC8vICAgfSwgZmFsc2UpO1xyXG4gIC8vICAgYnV0dG9uRWxzW2ldLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0JyxmdW5jdGlvbiAoKSB7XHJcbiAgLy8gICAgIGh0LmFuaW0oMSwuNSwzMDAwKTtcclxuICAvLyAgIH0sIGZhbHNlKTtcclxuICAvLyAgIHRoaXMuaGFsZnRvbmVzLnB1c2goaHQpO1xyXG4gIC8vIH1cclxuXHJcbiAgLy8gbGlzdGVuIGZvciB3aGVuIHRvIGRlc3Ryb3lcclxuICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gIHZhciBvblNjcm9sbCA9IGZ1bmN0aW9uIChzY3JvbGxQZXJjZW50YWdlKSB7XHJcbiAgICBpZiAoZ2V0U2Nyb2xsUG9zKCkgPiB0aGlzLmJvdHRvbSArIDMwMClcclxuICAgICAgX3RoaXMuZGVzdHJveSh0cnVlKTtcclxuICB9XHJcbiAgdGhpcy5zY3JvbGxDb250cm9sbGVyID0gbmV3IFNjcm9sbENvbnRyb2xsZXIodGhpcy5lbGVtZW50KTtcclxufVxyXG5BcnRpY2xlLnByb3RvdHlwZSA9IHtcclxuICBkZXN0cm95OiBmdW5jdGlvbiAoaXNQYXN0KSB7XHJcbiAgICB2YXIgbmV3U2Nyb2xsUG9zID0gZ2V0U2Nyb2xsUG9zKCkgLSB0aGlzLmVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xyXG4gICAgaWYgKHRoaXMuaGVhZGVyKVxyXG4gICAgICB0aGlzLmhlYWRlci5kZXN0cm95KCk7XHJcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5oYWxmdG9uZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspXHJcbiAgICAgIHRoaXMuaGFsZnRvbmVzW2ldLmRlc3Ryb3koKTtcclxuXHJcbiAgICB0aGlzLnNjcm9sbENvbnRyb2xsZXIuZGVzdHJveSgpO1xyXG5cclxuICAgIC8vIGZpeCBzY3JvbGwgcG9zaXRpb25cclxuICAgIGlmIChpc1Bhc3QpIHtcclxuICAgICAgdmFyIHJldHJpZWQgPSBmYWxzZTtcclxuICAgICAgZnVuY3Rpb24gZml4U2Nyb2xsICgpIHtcclxuICAgICAgICB3aW5kb3cuc2Nyb2xsVG8oMCxuZXdTY3JvbGxQb3MpO1xyXG4gICAgICB9XHJcbiAgICAgIGZpeFNjcm9sbCgpO1xyXG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZml4U2Nyb2xsKTtcclxuICAgIH1cclxuICAgIHRoaXMuZWxlbWVudC5yZW1vdmUoKTtcclxuICAgIC8vZGVsZXRlIHRoaXM7XHJcbiAgfVxyXG59XHJcblxyXG4vLyB0ZW1wIGluaXQgYXJ0aWNsZVxyXG52YXIgYXJ0aWNsZUVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFydGljbGUnKTtcclxuaWYgKGFydGljbGVFbClcclxuICBuZXcgQXJ0aWNsZShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYXJ0aWNsZScpKTtcclxuIiwiLy8gcmVxdWlyZW1lbnRzXHJcbnZhciBIYWxmdG9uZSA9IHJlcXVpcmUoJ29iamVjdHMvaGFsZnRvbmUnKTtcclxudmFyIGVhc2VzID0gcmVxdWlyZSgnbGliL2Vhc2UnKTtcclxuXHJcbi8vIHNldHRpbmdzXHJcblxyXG4vLyBpbml0IGZvb3RlciBoYWxmdG9uZVxyXG52YXIgZm9vdGVySGFsZnRvbmVFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5mb290ZXItbWFpbl9faGFsZnRvbmUnKTtcclxuaWYgKGZvb3RlckhhbGZ0b25lRWwpIHtcclxuICB2YXIgZm9vdGVySGFsZnRvbmUgPSBuZXcgSGFsZnRvbmUgKGZvb3RlckhhbGZ0b25lRWwsIHtcclxuICAgIGZhZGU6IDEyLFxyXG4gICAgbWF4UmFkaXVzOiAyMCxcclxuICAgIGluRWFzZVN0YXJ0OiAtLjI1LFxyXG4gICAgaW5FYXNlRW5kOiAuMSxcclxuICAgIGluRWFzZUZuOiBlYXNlcy5saW5lYXIsXHJcbiAgICBvdXRFYXNlU3RhcnQ6IDEsXHJcbiAgICBvdXRFYXNlRW5kOiAxXHJcbiAgfSk7XHJcbn1cclxuIiwiLyoqXHJcbiAqICBDb250cm9scyBjb29sIGhhbGZ0b25lIHRoaW5naWVzXHJcbiAqL1xyXG5cclxuLy8gcmVxdWlyZW1lbnRzXHJcbnZhciBlYXNlcyA9IHJlcXVpcmUoJ2xpYi9lYXNlJyk7XHJcbnZhciBTY3JvbGxDb250cm9sbGVyID0gcmVxdWlyZSgnbGliL3Njcm9sbENvbnRyb2xsZXInKTtcclxudmFyIHNldFRyYW5zZm9ybSA9IHJlcXVpcmUoJ2xpYi9zZXRUcmFuc2Zvcm0nKTtcclxudmFyIHdpbmRvd1NpemUgPSByZXF1aXJlKCdsaWIvZ2V0V2luZG93U2l6ZScpO1xyXG52YXIgZ2V0QnJlYWtwb2ludCA9IHJlcXVpcmUoJ2xpYi9icmVha3BvaW50cycpO1xyXG52YXIgbG9vcCA9IHJlcXVpcmUoJ2xpYi9sb29wJyk7XHJcblxyXG4vLyBzZXR0aW5nc1xyXG52YXIgREVGQVVMVFMgPSB7XHJcbiAgZmFkZTogNCwgLy8gcm93cyB0byBmYWRlIHRvcCBhbmQgYm90dG9tLCBpZiAwIHRoZSBjYW52YXMgaXMgc2l6ZWQgdG8gYmUgY29udGFpbmVkIGluc3RlYWQgb2Ygb3ZlcmZsb3cgb24gdGhlIHNpZGVzXHJcbiAgbWF4UmFkaXVzOiAxMiwgLy8gbWF4aW11bSByYWRpdXMgZm9yIGEgZG90XHJcbiAgaW5FYXNlRm46IGVhc2VzLmVhc2VPdXQsXHJcbiAgaW5FYXNlU3RhcnQ6IC4yLCAvLyBzY3JvbGwgcGVyY2VudGFnZSB0byBzdGFydCBhbmltYXRpb24gaW4gb24gZmlyc3QgZG90XHJcbiAgaW5FYXNlRW5kOiAuOCwgLy8gc2Nyb2xsIHBlcmNlbnRhZ2UgdG8gZW5kIGFuaW1hdGlvbiBpbiBvbiBsYXN0IGRvdFxyXG4gIG91dEVhc2VGbjogZWFzZXMubGluZWFyLFxyXG4gIG91dEVhc2VTdGFydDogLjYsIC8vIHNjcm9sbCBwZXJjZW50YWdlIHRvIHN0YXJ0IGFuaW1hdGlvbiBvdXQgb24gZmlyc3QgZG90XHJcbiAgb3V0RWFzZUVuZDogMS4xLCAvLyBzY3JvbGwgcGVyY2VudGFnZSB0byBlbmQgYW5pbWF0aW9uIG91dCBvbiBsYXN0IGRvdFxyXG4gIGZpeGVkOiBmYWxzZSwgLy8gZml4ZWQgcG9zaXRpb24gYW5kIGZ1bGwgc2NyZWVuP1xyXG4gIGltYWdlU2l6aW5nOiAnY292ZXInLCAvLyAnY292ZXInIG9yICdjb250YWluJ1xyXG4gIGNvcm5lcmluZzogMCwgLy8gZGlhZ25hbCB0b3AgbGVmdCBmYWRlXHJcbiAgY29udHJvbDogJ3Njcm9sbCcsIC8vICdzY3JvbGwnLCAnbW91c2UnIChUT0RPKSwgb3IgJ25vbmUnXHJcbiAgZmlsbDogbnVsbCwgLy8gb3B0aW9uYWxseSBvdmVycmlkZSBmaWxsIGNvbG9yXHJcbiAgaW5pdGlhbERyYXdQZXJjZW50YWdlOiAuNTUgLy8gcGVyY2VudGFnZSB0byBkcmF3IHJpZ2h0IGF3YXlcclxufVxyXG52YXIgQlJFQUtQT0lOVF9GT1JfU0NST0xMX0NPTlRST0wgPSAyO1xyXG5cclxuLyoqXHJcbiAqICBEb3QgY2xhc3NcclxuICogIEBwYXJhbSB7aW50fSBncmlkIHBvc2l0aW9uIFhcclxuICogIEBwYXJhbSB7aW50fSBncmlkIHBvc2l0aW9uIFlcclxuICogIEBwYXJhbSB7TnVtYmVyfSBtYXggcmFkaXVzXHJcbiAqICBAcGFyYW0ge0hhbGZ0b25lfSBwYXJlbnQgaGFsZnRvbmUgb2JqZWN0XHJcbiAqXHJcbiAqICBAbWV0aG9kIGRyYXcgKHtjYW52YXMgY29udGV4dH0pXHJcbiAqICBAbWV0aG9kIHNldFJhZGl1c0J5UGVyY2VudGFnZSAoe3BlcmNlbnQgb2YgbWF4IHJhZGl1c30pXHJcbiAqL1xyXG52YXIgRG90ID0gZnVuY3Rpb24gKGdyaWRYLCBncmlkWSwgbWF4UmFkaXVzLCBwYXJlbnQpIHtcclxuICB0aGlzLmdyaWRYID0gZ3JpZFg7XHJcbiAgdGhpcy5ncmlkWSA9IGdyaWRZO1xyXG4gIHRoaXMubWF4UmFkaXVzID0gbWF4UmFkaXVzO1xyXG4gIHRoaXMucmFkaXVzID0gbWF4UmFkaXVzO1xyXG4gIHRoaXMucGFyZW50ID0gcGFyZW50O1xyXG4gIHRoaXMucGVyY2VudGFnZSA9ICh0aGlzLmdyaWRYICsgdGhpcy5ncmlkWSkgLyAodGhpcy5wYXJlbnQuY29sdW1ucyArIHRoaXMucGFyZW50LnJvd3MpO1xyXG5cclxuICAvLyBkZWZpbmUgbG9jYXRpb24gd2l0aGluIGNhbnZhcyBjb250ZXh0XHJcbiAgdGhpcy54ID0gdGhpcy5ncmlkWCAqIHRoaXMucGFyZW50LnNldHRpbmdzLm1heFJhZGl1cztcclxuICB0aGlzLnkgPSB0aGlzLmdyaWRZICogdGhpcy5wYXJlbnQuc2V0dGluZ3MubWF4UmFkaXVzO1xyXG4gIGlmICh0aGlzLnBhcmVudC5zZXR0aW5ncy5mYWRlKVxyXG4gICAgdGhpcy55ICs9IHRoaXMucGFyZW50LnNldHRpbmdzLm1heFJhZGl1cztcclxuXHJcbiAgLy8gaGFuZGxlIGNvcm5lcmluZ1xyXG4gIGlmICh0aGlzLnBhcmVudC5zZXR0aW5ncy5jb3JuZXJpbmcgJiYgdGhpcy5ncmlkWCArIHRoaXMuZ3JpZFkgPD0gdGhpcy5wYXJlbnQuc2V0dGluZ3MuY29ybmVyaW5nICsgMSkge1xyXG4gICAgdGhpcy5tYXhSYWRpdXMgPSBlYXNlcy5saW5lYXIoLjMzLC42NiwodGhpcy5ncmlkWCArIHRoaXMuZ3JpZFkpIC8gKHRoaXMucGFyZW50LnNldHRpbmdzLmNvcm5lcmluZyArIDEpKSAqIHRoaXMubWF4UmFkaXVzO1xyXG4gICAgdGhpcy5yYWRpdXMgPSB0aGlzLm1heFJhZGl1cztcclxuICB9XHJcbiAgZWxzZSBpZiAodGhpcy5wYXJlbnQuc2V0dGluZ3MuY29ybmVyaW5nICYmIC0xICogKCh0aGlzLmdyaWRYICsgdGhpcy5ncmlkWSkgLSAodGhpcy5wYXJlbnQuY29sdW1ucyArIHRoaXMucGFyZW50LnJvd3MgLSAyKSkgPD0gdGhpcy5wYXJlbnQuc2V0dGluZ3MuY29ybmVyaW5nICsgMSkge1xyXG4gICAgdGhpcy5tYXhSYWRpdXMgPSBlYXNlcy5saW5lYXIoLjMzLC42NiwtMSAqICgodGhpcy5ncmlkWCArIHRoaXMuZ3JpZFkpIC0gKHRoaXMucGFyZW50LmNvbHVtbnMgKyB0aGlzLnBhcmVudC5yb3dzIC0gMikpIC8gKHRoaXMucGFyZW50LnNldHRpbmdzLmNvcm5lcmluZyArIDEpKSAqIHRoaXMubWF4UmFkaXVzO1xyXG4gICAgdGhpcy5yYWRpdXMgPSB0aGlzLm1heFJhZGl1cztcclxuICB9XHJcbn1cclxuRG90LnByb3RvdHlwZSA9IHtcclxuICBkcmF3OiBmdW5jdGlvbiAoY3R4KSB7XHJcbiAgICBjdHgubW92ZVRvKHRoaXMueCwgdGhpcy55IC0gdGhpcy5yYWRpdXMpO1xyXG4gICAgY3R4LmFyYyh0aGlzLngsIHRoaXMueSwgdGhpcy5yYWRpdXMsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XHJcbiAgfSxcclxuICBzZXRSYWRpdXNCeVBlcmNlbnRhZ2U6IGZ1bmN0aW9uIChwZXJjZW50KSB7XHJcbiAgICB0aGlzLnJhZGl1cyA9IE1hdGgubWF4KDAsIE1hdGgubWluKHRoaXMubWF4UmFkaXVzLCBwZXJjZW50ICogdGhpcy5tYXhSYWRpdXMpKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiAgSGFsZnRvbmUgY2xhc3NcclxuICogIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQsIG9wdGlvbmFsbHkgd2l0aCBhIGJhY2tncm91bmQgaW1hZ2UsIHRvIHR1cm4gaW50byB0aGUgdG95XHJcbiAqICBAcGFyYW0ge29iamVjdH0gc2V0dGluZ3MgdGhhdCBjYW4gb3ZlcnJpZGUgREVGQVVMVFMgZGVmaW5lZCBhYm92ZVxyXG4gKlxyXG4gKiAgQG1ldGhvZCBkcmF3KHtwZXJjZW50YWdlIG9mIGFuaW1hdGlvbiBwcm9ncmVzc30pXHJcbiAqICBAbWV0aG9kIGNyZWF0ZUNhbnZhcygpXHJcbiAqICBAbWV0aG9kIHNpemVJbWFnZSgpIC0gZm9yIGludGVybmFsIHVzZVxyXG4gKiAgQG1ldGhvZCBnZXRQZXJjZW50YWdlRnJvbVNjcm9sbCgpIC0gcmV0dXJucyBhIHBlcmNlbnRhZ2Ugb2YgcHJvZ3Jlc3MgcGFzdCBlbGVtZW50IGJhc2VkIG9uIHNjcm9sbGluZ1xyXG4gKiAgQG1ldGhvZCBpbml0KClcclxuICogIEBtZXRob2QgZGVzdHJveSgpXHJcbiAqICBAbWV0aG9kIGFuaW1Jbih7YW5pbWF0aW9uIHRpbWUgaW4gbXN9KVxyXG4gKi9cclxudmFyIEhhbGZ0b25lID0gZnVuY3Rpb24gKGVsZW1lbnQsIHNldHRpbmdzLCBkb3RTaXplSW1hZ2UpIHtcclxuICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgdGhpcy5zZXR0aW5ncyA9IHt9O1xyXG4gIHNldHRpbmdzID0gc2V0dGluZ3MgfHwge307XHJcbiAgZm9yICh2YXIgcHJvcCBpbiBERUZBVUxUUykge1xyXG4gICAgdGhpcy5zZXR0aW5nc1twcm9wXSA9IHNldHRpbmdzW3Byb3BdICE9PSB1bmRlZmluZWQgPyBzZXR0aW5nc1twcm9wXSA6IERFRkFVTFRTW3Byb3BdO1xyXG4gIH1cclxuXHJcbiAgaWYgKGRvdFNpemVJbWFnZSkge1xyXG4gICAgdGhpcy5kb3RTaXplSW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuICAgIHRoaXMuZG90U2l6ZUltYWdlLnNyYyA9IGRvdFNpemVJbWFnZTtcclxuICAgIHRoaXMuZG90U2l6ZUltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgX3RoaXMuc2l6ZURvdHNCeUltYWdlKCk7XHJcbiAgICAgIF90aGlzLmxhc3REcmF3blBlcmNlbnRhZ2UgPSBudWxsO1xyXG4gICAgICBfdGhpcy5kcmF3KF90aGlzLmdldFBlcmNlbnRhZ2VGcm9tU2Nyb2xsKCkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLmVsZW1lbnQpO1xyXG4gIC8vIG1ha2Ugc3VyZSBwb3NpdGlvbmluZyBpcyB2YWxpZFxyXG4gIGlmIChjb21wdXRlZFN0eWxlLnBvc2l0aW9uID09PSAnc3RhdGljJykge1xyXG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcclxuICB9XHJcbiAgLy8gc2V0IHVwIGNvbG9yIGFuZCBpbWFnZVxyXG4gIHRoaXMuZmlsbCA9IHRoaXMuc2V0dGluZ3MuZmlsbCB8fCBjb21wdXRlZFN0eWxlLmJhY2tncm91bmRDb2xvcjtcclxuICBpZiAoISFjb21wdXRlZFN0eWxlLmJhY2tncm91bmRJbWFnZSAmJiBjb21wdXRlZFN0eWxlLmJhY2tncm91bmRJbWFnZSAhPT0gJ25vbmUnKSB7XHJcbiAgICB0aGlzLmltYWdlID0gbmV3IEltYWdlKCk7XHJcbiAgICB0aGlzLmltYWdlLnNyYyA9IGNvbXB1dGVkU3R5bGUuYmFja2dyb3VuZEltYWdlLm1hdGNoKC9cXCgoPzonfFwiKT8oLis/KSg/Oid8XCIpP1xcKS8pWzFdO1xyXG4gIH1cclxuICBpZiAoIXRoaXMuc2V0dGluZ3MuZmlsbClcclxuICAgIHRoaXMuZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kID0gJ25vbmUnO1xyXG5cclxuICAvLyBsaXN0ZW5lcnNcclxuICB0aGlzLm9uUmVzaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgX3RoaXMuY3JlYXRlQ2FudmFzKCk7XHJcbiAgfVxyXG4gIHRoaXMub25TY3JvbGwgPSBmdW5jdGlvbiAocGVyY2VudGFnZSkge1xyXG4gICAgX3RoaXMuZHJhdyhwZXJjZW50YWdlKTtcclxuICB9XHJcblxyXG4gIC8vIGF1dG9zdGFydFxyXG4gIHRoaXMuaW5pdCgpO1xyXG59XHJcbkhhbGZ0b25lLnByb3RvdHlwZSA9IHtcclxuICBkcmF3OiBmdW5jdGlvbiAocGVyY2VudGFnZSkge1xyXG4gICAgLy8gcm91bmQgdG8gLjElXHJcbiAgICBwZXJjZW50YWdlID0gTWF0aC5yb3VuZChwZXJjZW50YWdlICogMTAwMCkgLyAxMDAwO1xyXG4gICAgaWYgKHBlcmNlbnRhZ2UgPT0gdGhpcy5sYXN0RHJhd25QZXJjZW50YWdlKVxyXG4gICAgICByZXR1cm47XHJcblxyXG4gICAgaWYgKCF0aGlzLmNhbnZhcyB8fCAocGVyY2VudGFnZSA8IHRoaXMuc2V0dGluZ3MuaW5FYXNlU3RhcnQgfHwgcGVyY2VudGFnZSA+IHRoaXMuc2V0dGluZ3Mub3V0RWFzZUVuZCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgLy8gY2xlYXIgY3VycmVudCBjcmFwXHJcbiAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwwLHRoaXMuY2FudmFzLndpZHRoLHRoaXMuY2FudmFzLmhlaWdodCk7XHJcblxyXG4gICAgLy8gaGF2ZSB0byBkbyB0aGUgbWF0aHNcclxuICAgIHRoaXMuY3R4LnNhdmUoKTtcclxuICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgLy8gaGFuZGxlIGFuaW1hdGlvblxyXG4gICAgLy8gaW4gdmFyc1xyXG4gICAgdmFyIGVmZmVjdGl2ZUluUGVyYyA9IChwZXJjZW50YWdlIC0gdGhpcy5zZXR0aW5ncy5pbkVhc2VTdGFydCkgLyAodGhpcy5zZXR0aW5ncy5pbkVhc2VFbmQgLSB0aGlzLnNldHRpbmdzLmluRWFzZVN0YXJ0KTtcclxuICAgIGVmZmVjdGl2ZUluUGVyYyA9IGVmZmVjdGl2ZUluUGVyYyA8IDEgPyB0aGlzLnNldHRpbmdzLmluRWFzZUZuKC0xLDMsZWZmZWN0aXZlSW5QZXJjKSA6IDI7XHJcbiAgICAvLyBvdXQgdmFyc1xyXG4gICAgdmFyIGVmZmVjdGl2ZU91dFBlcmMgPSAocGVyY2VudGFnZSAtIHRoaXMuc2V0dGluZ3Mub3V0RWFzZVN0YXJ0KSAvICh0aGlzLnNldHRpbmdzLm91dEVhc2VFbmQgLSB0aGlzLnNldHRpbmdzLm91dEVhc2VTdGFydCk7XHJcbiAgICBlZmZlY3RpdmVPdXRQZXJjID0gZWZmZWN0aXZlT3V0UGVyYyA+IDAgPyB0aGlzLnNldHRpbmdzLm91dEVhc2VGbigyLC0zLGVmZmVjdGl2ZU91dFBlcmMpIDogMjtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5kb3RzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgIGlmICh0aGlzLmRvdHNbaV0ubWF4UmFkaXVzID4gLjUpIHtcclxuICAgICAgICB2YXIgZG90SW5QZXJjID0gZWZmZWN0aXZlSW5QZXJjIC0gdGhpcy5kb3RzW2ldLnBlcmNlbnRhZ2U7XHJcbiAgICAgICAgdmFyIGRvdE91dFBlcmMgPSBlZmZlY3RpdmVPdXRQZXJjIC0gKDEgLSB0aGlzLmRvdHNbaV0ucGVyY2VudGFnZSk7XHJcbiAgICAgICAgdGhpcy5kb3RzW2ldLnNldFJhZGl1c0J5UGVyY2VudGFnZShNYXRoLm1pbihkb3RJblBlcmMsZG90T3V0UGVyYykpO1xyXG4gICAgICAgIHRoaXMuZG90c1tpXS5kcmF3KHRoaXMuY3R4KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY3R4LmZpbGwoKTtcclxuXHJcbiAgICBpZiAodGhpcy5pbWFnZSAmJiB0aGlzLmltYWdlT2Zmc2V0cykge1xyXG4gICAgICB0aGlzLmN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcInNvdXJjZS1hdG9wXCI7XHJcbiAgICAgIHRoaXMuY3R4LmRyYXdJbWFnZSh0aGlzLmltYWdlLCB0aGlzLmltYWdlT2Zmc2V0cy54LCB0aGlzLmltYWdlT2Zmc2V0cy55LCB0aGlzLmltYWdlT2Zmc2V0cy53aWR0aCwgdGhpcy5pbWFnZU9mZnNldHMuaGVpZ2h0KTtcclxuICAgIH1cclxuICAgIHRoaXMuY3R4LnJlc3RvcmUoKTtcclxuXHJcbiAgICB0aGlzLmxhc3REcmF3blBlcmNlbnRhZ2UgPSBwZXJjZW50YWdlO1xyXG4gIH0sXHJcbiAgY3JlYXRlQ2FudmFzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBraWxsIGV4aXN0aW5nIGNhbnZhc1xyXG4gICAgaWYgKHRoaXMuY2FudmFzKSB7XHJcbiAgICAgIHRoaXMuY2FudmFzLnJlbW92ZSgpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5yZW5kZXJlZCA9IHt9O1xyXG4gICAgLy8gY3JlYXRlIG5ldyBjYW52YXMgYW5kIGRvdHNcclxuICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICB0aGlzLmNhbnZhcy5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywnY2FudmFzLWhhbGZ0b25lJyk7XHJcbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZml4ZWQgfHwgZ2V0QnJlYWtwb2ludCgpIDwgQlJFQUtQT0lOVF9GT1JfU0NST0xMX0NPTlRST0wpIHtcclxuICAgICAgLy8gbm9ybWFsIHNpemluZyBhbmQgcG9zaXRpb25pbmdcclxuICAgICAgdmFyIGNvbHVtbnMgPSBNYXRoLmZsb29yKHRoaXMuZWxlbWVudC5vZmZzZXRXaWR0aCAvIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzKTtcclxuICAgICAgdmFyIHJvd3MgPSBNYXRoLmZsb29yKHRoaXMuZWxlbWVudC5vZmZzZXRIZWlnaHQgLyB0aGlzLnNldHRpbmdzLm1heFJhZGl1cyk7XHJcbiAgICAgIGlmICh0aGlzLnNldHRpbmdzLmZhZGUpIHtcclxuICAgICAgICBjb2x1bW5zICs9IDI7XHJcbiAgICAgICAgcm93cyArPSB0aGlzLnNldHRpbmdzLmZhZGUgKiAyICsgMjtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBpZiAoY29sdW1ucyAlIDIgPT09IDApXHJcbiAgICAgICAgICBjb2x1bW5zICs9IDE7XHJcbiAgICAgICAgaWYgKHJvd3MgJSAyID09PSAwKVxyXG4gICAgICAgICAgcm93cyArPSAxO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gZml4ZWQgc2l6aW5nIGFuZCBwb3NpdGlvbmluZ1xyXG4gICAgICB2YXIgY29sdW1ucyA9IE1hdGguZmxvb3Iod2luZG93U2l6ZS53aWR0aCgpIC8gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMpICsgMjtcclxuICAgICAgdmFyIHJvd3MgPSBNYXRoLmZsb29yKHdpbmRvd1NpemUuaGVpZ2h0KCkgLyB0aGlzLnNldHRpbmdzLm1heFJhZGl1cykgKyB0aGlzLnNldHRpbmdzLmZhZGUgKiAyICsgMjtcclxuICAgICAgc2V0VHJhbnNmb3JtKHRoaXMuZWxlbWVudCwnbm9uZScpO1xyXG4gICAgICBzZXRUcmFuc2Zvcm0odGhpcy5jYW52YXMsJ25vbmUnKTtcclxuICAgICAgdGhpcy5jYW52YXMuc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnO1xyXG4gICAgICB0aGlzLmNhbnZhcy5zdHlsZS50b3AgPSB0aGlzLnNldHRpbmdzLmZhZGUgKiB0aGlzLnNldHRpbmdzLm1heFJhZGl1cyAqIC0xICsgJ3B4JztcclxuICAgICAgdGhpcy5jYW52YXMuc3R5bGUubGVmdCA9IDA7XHJcbiAgICB9XHJcbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IChjb2x1bW5zIC0gMSkgKiB0aGlzLnNldHRpbmdzLm1heFJhZGl1cztcclxuICAgIHRoaXMuY2FudmFzLmhlaWdodCA9ICh0aGlzLnNldHRpbmdzLmZhZGUgPyByb3dzICsgMSA6IHJvd3MgLSAxKSAqIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzO1xyXG4gICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgdGhpcy5jdHguZmlsbFN0eWxlID0gdGhpcy5maWxsO1xyXG4gICAgdGhpcy5jb2x1bW5zID0gY29sdW1ucztcclxuICAgIHRoaXMucm93cyA9IHJvd3M7XHJcblxyXG4gICAgLy8gY2VudGVyIGluIGNvbnRhaW5lclxyXG4gICAgLy8gaWYgKCF0aGlzLnNldHRpbmdzLmZpeGVkIHx8IGdldEJyZWFrcG9pbnQgPCBCUkVBS1BPSU5UX0ZPUl9TQ1JPTExfQ09OVFJPTCkge1xyXG4gICAgLy8gICB0aGlzLmNhbnZhcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICAvLyAgIHRoaXMuY2FudmFzLnN0eWxlLnRvcCA9ICh0aGlzLmVsZW1lbnQub2Zmc2V0SGVpZ2h0IC0gdGhpcy5jYW52YXMuaGVpZ2h0KSAvIDIgKyAncHgnO1xyXG4gICAgLy8gICB0aGlzLmNhbnZhcy5zdHlsZS5sZWZ0ID0gKHRoaXMuZWxlbWVudC5vZmZzZXRXaWR0aCAtIHRoaXMuY2FudmFzLndpZHRoKSAvIDIgKyAncHgnO1xyXG4gICAgLy8gfVxyXG5cclxuXHJcbiAgICAvLyBkZWZpbmUgdGhlIGRvdHNcclxuICAgIHRoaXMuZG90cyA9IFtdO1xyXG4gICAgZm9yICh2YXIgeSA9IDA7IHkgPCByb3dzOyB5KyspIHtcclxuICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCBjb2x1bW5zOyB4Kz0gMikge1xyXG4gICAgICAgIHZhciByYWQ7XHJcbiAgICAgICAgaWYgKHkgPCB0aGlzLnNldHRpbmdzLmZhZGUpIHtcclxuICAgICAgICAgIHJhZCA9ICh5ICsgMSkgLyAodGhpcy5zZXR0aW5ncy5mYWRlICsgMSkgKiB0aGlzLnNldHRpbmdzLm1heFJhZGl1cztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoeSA+PSByb3dzIC0gdGhpcy5zZXR0aW5ncy5mYWRlKSB7XHJcbiAgICAgICAgICByYWQgPSAtMSAqICh5ICsgMSAtIHJvd3MpIC8gKHRoaXMuc2V0dGluZ3MuZmFkZSArIDEpICogdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCF0aGlzLnNldHRpbmdzLmZhZGUgJiYgeSA9PT0gMCAmJiB4ID09PSAwICYmICF0aGlzLnNldHRpbmdzLmZpeGVkKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMuc2V0dGluZ3MuZmFkZSAmJiB5ID09PSAwICYmIHggPT09IGNvbHVtbnMgLSAxICYmICF0aGlzLnNldHRpbmdzLmZpeGVkKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMuc2V0dGluZ3MuZmFkZSAmJiB5ID09PSByb3dzIC0gMSAmJiB4ID09PSAwICYmICF0aGlzLnNldHRpbmdzLmZpeGVkKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMuc2V0dGluZ3MuZmFkZSAmJiB5ID09PSByb3dzIC0gMSAmJiB4ID09PSBjb2x1bW5zIC0gMSAmJiAhdGhpcy5zZXR0aW5ncy5maXhlZCkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgcmFkID0gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZG90cy5wdXNoKG5ldyBEb3QoeSAlIDIgPyB4ICsgMSA6IHgsIHksIHJhZCwgdGhpcykpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuZWxlbWVudC5jaGlsZHJlbi5sZW5ndGgpIHtcclxuICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZSh0aGlzLmNhbnZhcywgdGhpcy5lbGVtZW50LmNoaWxkcmVuWzBdKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRldGVybWluZSBpbWFnZSBzaXplXHJcbiAgICBpZiAodGhpcy5pbWFnZSkge1xyXG4gICAgICBpZiAodGhpcy5pbWFnZS5jb21wbGV0ZSkge1xyXG4gICAgICAgIHRoaXMuc2l6ZUltYWdlKCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICB0aGlzLmltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIF90aGlzLmltYWdlT2Zmc2V0cyA9IF90aGlzLnNpemVJbWFnZShfdGhpcy5pbWFnZSk7XHJcbiAgICAgICAgICBfdGhpcy5sYXN0RHJhd25QZXJjZW50YWdlID0gbnVsbDtcclxuICAgICAgICAgIF90aGlzLmRyYXcoX3RoaXMuZ2V0UGVyY2VudGFnZUZyb21TY3JvbGwoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuZG90U2l6ZUltYWdlICYmIHRoaXMuZG90U2l6ZUltYWdlLmNvbXBsZXRlKSB7XHJcbiAgICAgIHRoaXMuc2l6ZURvdHNCeUltYWdlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZXN0YWJsaXNoIHNjcm9sbCBiYXNlZCBjb250cm9scyBvbmx5IGlmIHNjcmVlbiBpcyBsYXJnZSBlbm91Z2ggZm9yIHVzIHRvIGNhcmVcclxuICAgIGlmIChnZXRCcmVha3BvaW50KCkgPj0gQlJFQUtQT0lOVF9GT1JfU0NST0xMX0NPTlRST0wgJiYgdGhpcy5zZXR0aW5ncy5jb250cm9sID09PSAnc2Nyb2xsJykge1xyXG4gICAgICB0aGlzLnNjcm9sbENvbnRyb2xsZXIgPSBuZXcgU2Nyb2xsQ29udHJvbGxlcih0aGlzLmVsZW1lbnQsIHRoaXMub25TY3JvbGwpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGlmICh0aGlzLnNjcm9sbENvbnRyb2xsZXIpIHtcclxuICAgICAgICB0aGlzLnNjcm9sbENvbnRyb2xsZXIuZGVzdHJveSgpO1xyXG4gICAgICAgIHRoaXMuc2Nyb2xsQ29udHJvbGxlciA9IG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5kcmF3KHRoaXMuZ2V0UGVyY2VudGFnZUZyb21TY3JvbGwoKSk7XHJcbiAgICB9XHJcbiAgfSxcclxuICBzaXplSW1hZ2U6IGZ1bmN0aW9uIChpbWFnZSkge1xyXG4gICAgLy8gbWFrZSBzdXJlIHdlIHN1Y2Nlc3NmdWxseSBsb2FkZWRcclxuICAgIGlmICghaW1hZ2UgfHwgIWltYWdlLndpZHRoIHx8ICFpbWFnZS5oZWlnaHQpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGZpZ3VyZSBvdXQgdGhlIHNjYWxlIHRvIG1hdGNoICdjb3Zlcicgb3IgJ2NvbnRhaW4nLCBhcyBkZWZpbmVkIGJ5IHNldHRpbmdzXHJcbiAgICB2YXIgc2NhbGUgPSB0aGlzLmNhbnZhcy53aWR0aCAvIGltYWdlLndpZHRoO1xyXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuaW1hZ2VTaXppbmcgPT09ICdjb3ZlcicgJiYgc2NhbGUgKiBpbWFnZS5oZWlnaHQgPCB0aGlzLmNhbnZhcy5oZWlnaHQpIHtcclxuICAgICAgc2NhbGUgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyBpbWFnZS5oZWlnaHQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0aGlzLnNldHRpbmdzLmltYWdlU2l6aW5nID09PSAnY29udGFpbicgJiYgc2NhbGUgKiBpbWFnZS5oZWlnaHQgPiB0aGlzLmNhbnZhcy5oZWlnaHQpIHtcclxuICAgICAgc2NhbGUgPSB0aGlzLmNhbnZhcy5oZWlnaHQgLyBpbWFnZS5oZWlnaHQ7XHJcbiAgICB9XHJcbiAgICAvLyBzYXZlIHRoZSB4LHksd2lkdGgsaGVpZ2h0IG9mIHRoZSBzY2FsZWQgaW1hZ2Ugc28gaXQgY2FuIGJlIGVhc2lseSBkcmF3biB3aXRob3V0IG1hdGhcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHg6ICh0aGlzLmNhbnZhcy53aWR0aCAtIGltYWdlLndpZHRoICogc2NhbGUpIC8gMixcclxuICAgICAgeTogKHRoaXMuY2FudmFzLmhlaWdodCAtIGltYWdlLmhlaWdodCAqIHNjYWxlKSAvIDIsXHJcbiAgICAgIHdpZHRoOiBpbWFnZS53aWR0aCAqIHNjYWxlLFxyXG4gICAgICBoZWlnaHQ6IGltYWdlLmhlaWdodCAqIHNjYWxlXHJcbiAgICB9XHJcbiAgfSxcclxuICBzaXplRG90c0J5SW1hZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIGZpcnN0LCBmaWd1cmUgb3V0IGhvdyB0byBzaXplIHRoZSBpbWFnZSBmb3IgdGhlIGNhbnZhc1xyXG4gICAgdmFyIGRvdHNJbWFnZU9mZnNldHMgPSB0aGlzLnNpemVJbWFnZSh0aGlzLmRvdFNpemVJbWFnZSk7XHJcbiAgICBpZiAoIWRvdHNJbWFnZU9mZnNldHMpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB0ZW1wQ2FuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICB0ZW1wQ2FuLndpZHRoID0gdGhpcy5jYW52YXMud2lkdGg7XHJcbiAgICB0ZW1wQ2FuLmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodDtcclxuICAgIHZhciB0ZW1wQ2FuQ3R4ID0gdGVtcENhbi5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgdGVtcENhbkN0eC5maWxsU3R5bGUgPSAnd2hpdGUnO1xyXG4gICAgdGVtcENhbkN0eC5maWxsUmVjdCgwLCAwLCB0ZW1wQ2FuLndpZHRoLCB0ZW1wQ2FuLmhlaWdodCk7XHJcbiAgICB0ZW1wQ2FuQ3R4LmRyYXdJbWFnZSh0aGlzLmRvdFNpemVJbWFnZSwgZG90c0ltYWdlT2Zmc2V0cy54LCBkb3RzSW1hZ2VPZmZzZXRzLnksIGRvdHNJbWFnZU9mZnNldHMud2lkdGgsIGRvdHNJbWFnZU9mZnNldHMuaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gdGhpcy5kb3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgIHZhciBpbWdEYXRhID0gdGVtcENhbkN0eC5nZXRJbWFnZURhdGEodGhpcy5kb3RzW2ldLnggLSB0aGlzLnNldHRpbmdzLm1heFJhZGl1cywgdGhpcy5kb3RzW2ldLnkgLSB0aGlzLnNldHRpbmdzLm1heFJhZGl1cywgdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMgKiAyLCB0aGlzLnNldHRpbmdzLm1heFJhZGl1cyAqIDIpO1xyXG4gICAgICAvL2NvbnNvbGUubG9nKHRoaXMuZG90c1tpXS54IC0gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMsIHRoaXMuZG90c1tpXS55IC0gdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMsIHRoaXMuc2V0dGluZ3MubWF4UmFkaXVzICogMiwgdGhpcy5zZXR0aW5ncy5tYXhSYWRpdXMgKiAyKTtcclxuICAgICAgLy8gb25seSBnZXR0aW5nIHJlZCwgYmVjYXVzZSBpbWFnZSBzaG91bGQgYmUgZ3JleXNjYWxlIGFueXdheVxyXG4gICAgICB2YXIgYXZlcmFnZVJlZCA9IDA7XHJcbiAgICAgIGZvciAodmFyIGogPSAwLCBqTGVuID0gaW1nRGF0YS5kYXRhLmxlbmd0aDsgaiA8IGpMZW47IGogKz0gNCkge1xyXG4gICAgICAgIHZhciBvcGFjaXR5QWRkID0gKDI1NSAtIGltZ0RhdGEuZGF0YVtqXSkgKiAoKDI1NSAtIGltZ0RhdGEuZGF0YVtqICsgM10pIC8gMjU1KTtcclxuICAgICAgICBhdmVyYWdlUmVkICs9IGltZ0RhdGEuZGF0YVtqXSArIG9wYWNpdHlBZGQ7XHJcbiAgICAgICAgLy8gaWYgKGogPCA0MDApXHJcbiAgICAgICAgLy8gICBjb25zb2xlLmxvZyhpbWdEYXRhLmRhdGFbal0sIG9wYWNpdHlBZGQsIGltZ0RhdGEuZGF0YVtqXSArIG9wYWNpdHlBZGQpO1xyXG4gICAgICB9XHJcbiAgICAgIGF2ZXJhZ2VSZWQgLz0gKGltZ0RhdGEuZGF0YS5sZW5ndGggLyA0KTtcclxuXHJcbiAgICAgIHRoaXMuZG90c1tpXS5tYXhSYWRpdXMgPSB0aGlzLmRvdHNbaV0ubWF4UmFkaXVzICogKCgyNTUgLSBhdmVyYWdlUmVkKSAvIDI1NSk7XHJcbiAgICAgIC8vIHJlbW92ZSB0aGlzIGRvdCBpZiBpdCB3aWxsIG5ldmVyIHNob3dcclxuICAgICAgaWYgKHRoaXMuZG90c1tpXS5tYXhSYWRpdXMgPCAuNSkge1xyXG4gICAgICAgIHRoaXMuZG90cy5zcGxpY2UoaSwxKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgZ2V0UGVyY2VudGFnZUZyb21TY3JvbGw6IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLnNjcm9sbENvbnRyb2xsZXIgPyB0aGlzLnNjcm9sbENvbnRyb2xsZXIuZ2V0UGVyY2VudGFnZSgpIDogdGhpcy5zZXR0aW5ncy5pbml0aWFsRHJhd1BlcmNlbnRhZ2U7XHJcbiAgfSxcclxuICBpbml0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBtYWtlIHRoZSBjYW52YXNcclxuICAgIHRoaXMuY3JlYXRlQ2FudmFzKCk7XHJcblxyXG4gICAgLy8gc2Nyb2xsIGxpc3RlbmVyIGFkZGVkIGluIGNyZWF0ZUNhbnZhcyBmblxyXG5cclxuICAgIC8vIGxpc3RlbiBmb3IgcmVzaXplXHJcbiAgICBsb29wLmFkZFJlc2l6ZUZ1bmN0aW9uKHRoaXMub25SZXNpemUpO1xyXG4gIH0sXHJcbiAgZGVzdHJveTogZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMuc2Nyb2xsQ29udHJvbGxlcilcclxuICAgICAgdGhpcy5zY3JvbGxDb250cm9sbGVyLmRlc3Ryb3koKTtcclxuICAgIGxvb3AucmVtb3ZlRnVuY3Rpb24odGhpcy5vblJlc2l6ZSk7XHJcbiAgICB0aGlzLmNhbnZhcy5yZW1vdmUoKTtcclxuICAgIGRlbGV0ZSB0aGlzO1xyXG4gIH0sXHJcbiAgYW5pbTogZnVuY3Rpb24gKHN0YXJ0UGVyYywgZW5kUGVyYywgdGltZSwgZWFzZSwgY2IpIHtcclxuICAgIC8vIGZpcnN0LCB0dXJuIG9mZiBzY3JvbGwgbGlzdGVuaW5nXHJcbiAgICBpZiAodGhpcy5zY3JvbGxDb250cm9sbGVyKVxyXG4gICAgICB0aGlzLnNjcm9sbENvbnRyb2xsZXIuZGlzYWJsZSgpO1xyXG4gICAgLy8gZXN0YWJsaXNoIGRlZmF1bHRzXHJcbiAgICBzdGFydFBlcmMgPSBzdGFydFBlcmMgfHwgMDtcclxuICAgIGVuZFBlcmMgPSAhaXNOYU4oZW5kUGVyYykgPyBlbmRQZXJjIDogMTtcclxuICAgIHRpbWUgPSB0aW1lIHx8IDEwMDA7XHJcbiAgICBlYXNlID0gZWFzZSB8fCBlYXNlcy5lYXNlSW5PdXQ7XHJcbiAgICAvLyBnZXQgc29tZSBiYXNlIHZhcnNcclxuICAgIHZhciBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgIHZhciBkZWx0YVBlcmMgPSBlbmRQZXJjIC0gc3RhcnRQZXJjO1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHZhciBydW5uaW5nID0gdHJ1ZTtcclxuICAgIC8vIHRoaXMgZ29lcyBpbiB0aGUgbG9vcFxyXG4gICAgdmFyIGFuaW1hdGlvbkZuID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICBpZiAocnVubmluZykge1xyXG4gICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICB2YXIgZGVsdGFUaW1lID0gKG5vdyAtIHN0YXJ0VGltZSkgLyB0aW1lO1xyXG4gICAgICAgIGlmIChkZWx0YVRpbWUgPCAxKVxyXG4gICAgICAgICAgX3RoaXMuZHJhdyhlYXNlKHN0YXJ0UGVyYyxkZWx0YVBlcmMsZGVsdGFUaW1lKSk7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICBfdGhpcy5kcmF3KGVuZFBlcmMpO1xyXG4gICAgICAgICAgaWYgKF90aGlzLnNjcm9sbENvbnRyb2xsZXIpXHJcbiAgICAgICAgICAgIF90aGlzLnNjcm9sbENvbnRyb2xsZXIuZW5hYmxlKCk7XHJcbiAgICAgICAgICAvLyBnZXQgYmFjayBvdXQgb2YgdGhlIGxvb3BcclxuICAgICAgICAgIGxvb3AucmVtb3ZlRnVuY3Rpb24oYW5pbWF0aW9uRm4pO1xyXG4gICAgICAgICAgaWYgKGNiKVxyXG4gICAgICAgICAgICBjYigpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgbG9vcC5hZGRGdW5jdGlvbihhbmltYXRpb25Gbik7XHJcbiAgfSxcclxuICBhbmltSW46IGZ1bmN0aW9uICh0aW1lLCBjYikge1xyXG4gICAgLy8gYW5pbWF0ZSB0aGUgY2FudmFzIGZyb20gaW5FYXNlU3RhcnQgdG8gY3VycmVudCBzY3JvbGwgcG9zXHJcbiAgICAvLyBjaGVjayBpZiB3ZSBldmVuIG5lZWQgdG9cclxuICAgIHZhciBlbmRQZXJjID0gdGhpcy5nZXRQZXJjZW50YWdlRnJvbVNjcm9sbCgpO1xyXG4gICAgaWYgKGVuZFBlcmMgPCB0aGlzLnNldHRpbmdzLmluRWFzZVN0YXJ0KVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgdGhpcy5hbmltKHRoaXMuc2V0dGluZ3MuaW5FYXNlU3RhcnQsIGVuZFBlcmMsIHRpbWUsIGVhc2VzLmVhc2VPdXQsIGNiKTtcclxuICB9LFxyXG4gIGFuaW1PdXQ6IGZ1bmN0aW9uICh0aW1lLCBjYikge1xyXG4gICAgLy8gYW5pbWF0ZSB0aGUgY2FudmFzIGZyb20gaW5FYXNlU3RhcnQgdG8gY3VycmVudCBzY3JvbGwgcG9zXHJcbiAgICAvLyBjaGVjayBpZiB3ZSBldmVuIG5lZWQgdG9cclxuICAgIHZhciBzdGFydFBlcmMgPSB0aGlzLmdldFBlcmNlbnRhZ2VGcm9tU2Nyb2xsKCk7XHJcbiAgICBpZiAoc3RhcnRQZXJjIDwgdGhpcy5zZXR0aW5ncy5pbkVhc2VTdGFydClcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgIHRoaXMuYW5pbShzdGFydFBlcmMsIHRoaXMuc2V0dGluZ3MuaW5FYXNlU3RhcnQsIHRpbWUsIGVhc2VzLmVhc2VJbiwgY2IpO1xyXG4gIH1cclxufVxyXG5cclxuLy8gdGVtcCBhdXRvIGluaXRcclxuLy8gdmFyIGh0ckVscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5oYWxmdG9uZScpO1xyXG4vLyB2YXIgaHRycyA9IFtdO1xyXG4vLyBmb3IgKHZhciBpID0gMCwgbGVuID0gaHRyRWxzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbi8vICAgaHRycy5wdXNoKG5ldyBIYWxmdG9uZShodHJFbHNbaV0sIHsgZmFkZTogMTIsIGZpeGVkOiBmYWxzZSB9KSk7XHJcbi8vIH1cclxuLy8gd2luZG93Lmh0cnMgPSBodHJzO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEhhbGZ0b25lO1xyXG4iLCIvKipcclxuICogIFRoZSBNeSBUaXRsZXMgdG95XHJcbiAqL1xyXG4vLyByZXF1aXJlbWVudHNcclxudmFyIEhhbGZ0b25lID0gcmVxdWlyZSgnb2JqZWN0cy9oYWxmdG9uZScpO1xyXG52YXIgZWFzZXMgPSByZXF1aXJlKCdsaWIvZWFzZScpO1xyXG52YXIgd2luZG93U2l6ZSA9IHJlcXVpcmUoJ2xpYi9nZXRXaW5kb3dTaXplJyk7XHJcblxyXG4vLyBzZXR0aW5nc1xyXG52YXIgSEFMRlRPTkVfU0VUVElOR1MgPSB7XHJcbiAgaW5FYXNlRm46IGVhc2VzLmVhc2VPdXQsXHJcbiAgaW5FYXNlU3RhcnQ6IC0uMSxcclxuICBpbkVhc2VFbmQ6IC41LFxyXG4gIG91dEVhc2VGbjogZWFzZXMuZWFzZUluLFxyXG4gIG91dEVhc2VTdGFydDogLjUsXHJcbiAgb3V0RWFzZUVuZDogMS4xLFxyXG4gIGZhZGU6IDEsXHJcbiAgZmlsbDogJyMwMTFDMUYnLFxyXG4gIG1heFJhZGl1czogOSxcclxuICBjb250cm9sOiAnbm9uZScsXHJcbiAgaW5pdGlhbERyYXdQZXJjZW50YWdlOiAwXHJcbn1cclxudmFyIEFOSU1fVElNRSA9IDEwMDAwO1xyXG5cclxuLyoqXHJcbiAqICBNeVRpdGxlc1xyXG4gKiAgQHBhcmFtIHtIVE1MRWxlbWVudH1cclxuICovXHJcbnZhciBNeVRpdGxlcyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XHJcbiAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuXHJcbiAgdGhpcy5oYWxmdG9uZXMgPSBbXTtcclxuICB0aGlzLmhhbGZ0b25lcy5wdXNoKG5ldyBIYWxmdG9uZShlbGVtZW50LCBIQUxGVE9ORV9TRVRUSU5HUywgJy9pbWFnZXMvZG90U2l6ZUltYWdlVGVzdC5qcGcnKSk7XHJcbiAgdGhpcy5oYWxmdG9uZXMucHVzaChuZXcgSGFsZnRvbmUoZWxlbWVudCwgSEFMRlRPTkVfU0VUVElOR1MsICcvaW1hZ2VzL2RvdFNpemVJbWFnZVRlc3QyLmpwZycpKTtcclxuICB0aGlzLmhhbGZ0b25lcy5wdXNoKG5ldyBIYWxmdG9uZShlbGVtZW50LCBIQUxGVE9ORV9TRVRUSU5HUywgJy9pbWFnZXMvZG90U2l6ZUltYWdlVGVzdDMuanBnJykpO1xyXG4gIC8vIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmhhbGZ0b25lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gIC8vICAgdGhpcy5oYWxmdG9uZXNbaV0uZHJhdygwKTtcclxuICAvLyB9XHJcbiAgdmFyIGluZGV4ID0gLTE7XHJcbiAgdmFyIF90aGlzID0gdGhpcztcclxuICBmdW5jdGlvbiBhbmltTmV4dCAoKSB7XHJcbiAgICBpbmRleCA9IChpbmRleCArIDEpICUgX3RoaXMuaGFsZnRvbmVzLmxlbmd0aDtcclxuICAgIC8vY29uc29sZS5sb2coaW5kZXgpO1xyXG4gICAgX3RoaXMuaGFsZnRvbmVzW2luZGV4XS5hbmltKDAsMSxBTklNX1RJTUUsZWFzZXMubGluZWFyKTtcclxuICB9XHJcbiAgLy90aGlzLmhhbGZ0b25lc1swXS5hbmltKC41LDEsQU5JTV9USU1FIC8gMixlYXNlcy5saW5lYXIpO1xyXG4gIGFuaW1OZXh0KCk7XHJcbiAgd2luZG93LnNldEludGVydmFsKGFuaW1OZXh0LEFOSU1fVElNRSAqIC44KTtcclxufVxyXG5cclxudmFyIG15VGl0bGVzRWxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm15LXRpdGxlcycpO1xyXG5mb3IgKHZhciBpID0gMCwgbGVuID0gbXlUaXRsZXNFbHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICBuZXcgTXlUaXRsZXMobXlUaXRsZXNFbHNbaV0pO1xyXG59XHJcbiIsIi8qKlxyXG4gKiAgU2Nyb2xscyB0aGUgc2NyZWVuIHRvIHRoZSB0b3Agb2YgLmhlYWRlci1tYWluIG9uIGxvYWQgaWYgcGFnZVR5cGUgaXMgZGVmaW5lZFxyXG4gKi9cclxuLy8gcmVxdWlyZW1lbnRzXHJcbnZhciBnZXRTY3JvbGxQb3MgPSByZXF1aXJlKCdsaWIvZ2V0U2Nyb2xsUG9zJyk7XHJcbnZhciBhbmltYXRlU2Nyb2xsVG8gPSByZXF1aXJlKCdsaWIvYW5pbWF0ZVNjcm9sbFRvJyk7XHJcblxyXG4vLyBkbyBpdCByaWdodCBhd2F5XHJcbnZhciBoZWFkZXJNYWluID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmhlYWRlci1tYWluJyk7XHJcbnZhciBwYWdlVHlwZSA9IGRvY3VtZW50LmJvZHkuZ2V0QXR0cmlidXRlKCdkYXRhLXBhZ2UtdHlwZScpO1xyXG5cclxuaWYgKHBhZ2VUeXBlICYmIHBhZ2VUeXBlICE9PSAnaW5kZXgnICYmIGhlYWRlck1haW4pIHtcclxuICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoZ2V0U2Nyb2xsUG9zKCkgPCA1MClcclxuICAgICAgYW5pbWF0ZVNjcm9sbFRvKGhlYWRlck1haW4sIG51bGwsIG51bGwsIDYwMCwgMCk7XHJcbiAgfSwgd2luZG93LnNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ3NlZW5OYXYnKSA/IDEwMCA6IDYwMCk7XHJcbiAgd2luZG93LnNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ3NlZW5OYXYnLHRydWUpO1xyXG59XHJcbiIsIi8qKlxuICogIHNjcmlwdHMuanNcbiAqICBUaGlzIHNob3VsZCBpbmNsdWRlIG9iamVjdHMsIHdoaWNoIGluIHR1cm4gaW5jbHVkZSB0aGUgbGliIGZpbGVzIHRoZXkgbmVlZC5cbiAqICBUaGlzIGtlZXBzIHVzIHVzaW5nIGEgbW9kdWxhciBhcHByb2FjaCB0byBkZXYgd2hpbGUgYWxzbyBvbmx5IGluY2x1ZGluZyB0aGVcbiAqICBwYXJ0cyBvZiB0aGUgbGlicmFyeSB3ZSBuZWVkLlxuICovXG4vLyBvYmplY3RzXG5yZXF1aXJlKCdvYmplY3RzL3Njcm9sbE9uTG9hZCcpO1xucmVxdWlyZSgnb2JqZWN0cy9hcnRpY2xlJyk7XG5yZXF1aXJlKCdvYmplY3RzL2Zvb3RlcicpO1xucmVxdWlyZSgnb2JqZWN0cy9teVRpdGxlcycpO1xuIl19
