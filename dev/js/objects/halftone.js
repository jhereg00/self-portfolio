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
