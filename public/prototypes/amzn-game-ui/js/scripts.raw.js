(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.default = [{
    name: 'Soldier',
    portraitUrl: 'images/class-select-portrait-soldier.png',
    items: ['Badass Rifle', 'Potent AF Potion']
}, {
    name: 'Explorer',
    portraitUrl: 'images/class-select-portrait-explorer.png',
    items: ['Hunting Axe', 'Monocular']
}, {
    name: 'Adventurer',
    portraitUrl: 'images/class-select-portrait-adventurer.png',
    items: ['Wooden Club', 'Advanced Map']
}, {
    name: 'Expatriate',
    portraitUrl: 'images/class-select-portrait-expatriate.png',
    items: ['Silver Sword', 'Strength Potion']
}, {
    name: 'Stowaway',
    portraitUrl: 'images/class-select-portrait-stowaway.png',
    items: ['Rogue\'s Knife', 'Cooked Steak']
}];

},{}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 *  scripts.js
 *  This should include objects, which in turn include the lib files they need.
 *  This keeps us using a modular approach to dev while also only including the
 *  parts of the library we need.
 */
var ClassSelectScreen_1 = require("./ui/ClassSelectScreen");
var classConfigs_1 = require("./data/classConfigs");
var classSelectScreenEl = document.getElementById('classSelectScreen');
var classSelectScreen = new ClassSelectScreen_1.default(classSelectScreenEl, classConfigs_1.default);
classSelectScreen.show();

},{"./data/classConfigs":1,"./ui/ClassSelectScreen":6}],3:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var createElement_1 = require("../utils/createElement");

var AnimatingCanvasAbstract = function () {
    function AnimatingCanvasAbstract() {
        _classCallCheck(this, AnimatingCanvasAbstract);

        this._initCanvas();
    }

    _createClass(AnimatingCanvasAbstract, [{
        key: "_initCanvas",
        value: function _initCanvas() {
            this.canvas = createElement_1.default('canvas');
            this.ctx = this.canvas.getContext('2d');
        }
    }, {
        key: "draw",
        value: function draw(time) {}
    }, {
        key: "clear",
        value: function clear() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }, {
        key: "start",
        value: function start() {
            if (this.running) {
                return;
            }
            this.running = true;
            this.animStartTime = new Date().getTime();
            // bind to `this` so we can reuse it in other scopes, like the window's requestAnimationFrame
            this.loop = this.loop.bind(this);
            this.loop();
        }
    }, {
        key: "stop",
        value: function stop() {
            this.running = false;
        }
    }, {
        key: "loop",
        value: function loop() {
            if (this.running) {
                this.draw(new Date().getTime() - this.animStartTime);
                requestAnimationFrame(this.loop);
            }
        }
    }]);

    return AnimatingCanvasAbstract;
}();

exports.default = AnimatingCanvasAbstract;

},{"../utils/createElement":9}],4:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var createElement_1 = require("../utils/createElement");
var CloudedCanvas_1 = require("./CloudedCanvas");
var ClassCardFrameCanvas_1 = require("./ClassCardFrameCanvas");
var ITEM_COUNT = 2;
var MISSING_ITEM_MSG = 'Nothing.<br>Absolutely Nothing';
var FLICKER_MIN_DELAY = 200;
var FLICKER_MAX_DELAY = 1000;
var FLICKER_RETURN_DELAY = 160;
var FLICKER_NO_TRIPLE_THRESHOLD = 400;
var ACTIVE_CANVAS_IMAGE = 'images/class-select-frame-active-extras.png';
var ACTIVE_CANVAS_STOP_DELAY = 500;

var ClassCard = function () {
    function ClassCard(options) {
        var _this = this;

        _classCallCheck(this, ClassCard);

        this.config = options;
        this._buildElement();
        // temp
        this.element.addEventListener('click', function () {
            _this.setActive();
        });
        this.element.addEventListener('mouseenter', function () {
            _this.hovered = true;
            _this.highlight();
        });
        this.element.addEventListener('mouseleave', function () {
            _this.hovered = false;
            _this.unhighlight();
        });
    }

    _createClass(ClassCard, [{
        key: "_buildElement",
        value: function _buildElement() {
            this.htmlElements = {
                main: createElement_1.default('a', { className: 'class-card' + (this.config.shifted ? ' is-shifted' : '') }),
                portraitBox: createElement_1.default('div', { className: 'class-card__portrait-box' }),
                portrait: createElement_1.default('img', {
                    className: 'class-card__portrait',
                    src: this.config.portraitUrl
                }),
                name: createElement_1.default('div', { className: 'class-card__name' }),
                nameSpan: createElement_1.default('span', { innerHTML: this.config.name }),
                items: []
            };
            this.element = this.htmlElements.main;
            // slap in greebles first
            this.element.appendChild(createElement_1.default('img', { className: 'class-card__greeble class-card__greeble--tr', src: 'images/greeble-tr.png' }));
            this.element.appendChild(createElement_1.default('img', { className: 'class-card__greeble class-card__greeble--bl1', src: 'images/greeble-bl.png' }));
            this.element.appendChild(createElement_1.default('img', { className: 'class-card__greeble class-card__greeble--bl2', src: 'images/greeble-bl2.png' }));
            this.element.appendChild(this.htmlElements.portraitBox);
            this.htmlElements.portraitBox.appendChild(this.htmlElements.portrait);
            this.element.appendChild(this.htmlElements.name);
            this.htmlElements.name.appendChild(this.htmlElements.nameSpan);
            // create the right number of items, regardless how many we're given
            for (var i = 0; i < ITEM_COUNT; i++) {
                var itemEl = createElement_1.default('div', { className: 'class-card__item' });
                itemEl.appendChild(createElement_1.default('span', { innerHTML: this.config.items[i] || MISSING_ITEM_MSG }));
                this.htmlElements.items.push(itemEl);
                this.element.appendChild(itemEl);
            }
            // create the frame that highlights
            this.frame = new ClassCardFrameCanvas_1.default();
            this.element.appendChild(this.frame.canvas);
        }
    }, {
        key: "_clearShiftUnshiftTimeout",
        value: function _clearShiftUnshiftTimeout() {
            if (this.shiftUnshiftTimeout) {
                window.clearTimeout(this.shiftUnshiftTimeout);
            }
        }
        /**
         * Shift the card out of its normal space.
         *
         * @param {number} [delay=0] - delay before shifting in ms
         * @memberof ClassCard
         */

    }, {
        key: "shift",
        value: function shift() {
            var _this2 = this;

            var delay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

            this._clearShiftUnshiftTimeout();
            if (delay > 0) {
                this.shiftUnshiftTimeout = window.setTimeout(function () {
                    _this2.element.classList.add('is-shifted');
                }, delay);
            } else {
                this.element.classList.add('is-shifted');
            }
        }
        /**
         * Return a shifted card back to its normal space.
         *
         * @param {number} [delay=0] - delay before unshifting in ms
         * @memberof ClassCard
         */

    }, {
        key: "unshift",
        value: function unshift() {
            var _this3 = this;

            var delay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

            this._clearShiftUnshiftTimeout();
            if (delay > 0) {
                this.shiftUnshiftTimeout = window.setTimeout(function () {
                    _this3.element.classList.remove('is-shifted');
                }, delay);
            } else {
                this.element.classList.remove('is-shifted');
            }
        }
        /**
         * Show the bright frame to indicate hover or active.
         *
         * @returns
         * @memberof ClassCard
         */

    }, {
        key: "highlight",
        value: function highlight() {
            var _this4 = this;

            if (this.frameShowing) {
                return;
            }
            this.frame.canvas.style.transition = 'none';
            this.frame.canvas.style.opacity = '1';
            this.frame.start();
            this.frameShowing = true;
            // re-enable transitions on next frame
            requestAnimationFrame(function () {
                _this4.frame.canvas.style.transition = '';
            });
        }
        /**
         * Hide the bright frame.
         *
         * @returns
         * @memberof ClassCard
         */

    }, {
        key: "unhighlight",
        value: function unhighlight() {
            if (this.hovered || this.active) {
                return;
            }
            this.frame.canvas.style.opacity = '0';
            this.frameShowing = false;
        }
        /**
         * Sets the active state, also showing the frame and cloudedCanvas.
         *
         * @memberof ClassCard
         */

    }, {
        key: "setActive",
        value: function setActive() {
            // if we don't have a clouded canvas, make one now
            if (!this.cloudedCanvas) {
                this.cloudedCanvas = new CloudedCanvas_1.default({
                    imagePath: ACTIVE_CANVAS_IMAGE,
                    cloudSpeed: {
                        x: 100,
                        y: 100
                    }
                });
                this.element.appendChild(this.cloudedCanvas.canvas);
            }
            this.element.classList.add('is-active');
            this.cloudedCanvas.start();
            this.active = true;
            this.highlight();
        }
        /**
         * Takes the card out of the active state. Also unhighlights if not hovered.
         *
         * @memberof ClassCard
         */

    }, {
        key: "setInactive",
        value: function setInactive() {
            var _this5 = this;

            this.element.classList.remove('is-active');
            this.active = false;
            if (this.cloudedCanvas) {
                window.setTimeout(function () {
                    _this5.cloudedCanvas.stop();
                    _this5.cloudedCanvas.clear();
                }, ACTIVE_CANVAS_STOP_DELAY);
            }
            this.unhighlight();
        }
    }]);

    return ClassCard;
}();

exports.default = ClassCard;

},{"../utils/createElement":9,"./ClassCardFrameCanvas":5,"./CloudedCanvas":7}],5:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

Object.defineProperty(exports, "__esModule", { value: true });
var AnimatedValue_1 = require("../utils/AnimatedValue");
var CubicBezier_1 = require("../utils/easing/CubicBezier");
var AnimatingCanvasAbstract_1 = require("./AnimatingCanvasAbstract");
var REAL_TIME_PER_KEYFRAME_TIME = 33;
// set up global frame image
var frameImageLoaded = false;
var FRAME_IMAGE = new Image();
FRAME_IMAGE.addEventListener('load', function () {
    frameImageLoaded = true;
});
FRAME_IMAGE.src = 'images/class-select-frame.png';
var EASE_OUT_BEZIER = new CubicBezier_1.default(.07, .24, .25, .98);
var EASE_OUT_BEZIER_SUBTLE = new CubicBezier_1.default(.14, .27, .57, .97);
var EASE_IN_OUT_BEZIER = new CubicBezier_1.default(.49, .12, .45, .98);
var LAST_KF_TIME = 14;
var SHAPES = [{
    // top bar
    type: 'rectangle',
    x: 0,
    y: 0,
    w: new AnimatedValue_1.default([{ time: 0, value: 0, ease: EASE_OUT_BEZIER.ease }, { time: 9, value: 346 }]),
    h: 22
}, {
    // left side
    type: 'rectangle',
    x: 0,
    y: 0,
    w: 28,
    h: new AnimatedValue_1.default([{ time: 0, value: 0, ease: EASE_OUT_BEZIER.ease }, { time: 5, value: 732 }])
}, {
    // above name
    type: 'rectangle',
    x: 0,
    y: 550,
    w: new AnimatedValue_1.default([{ time: 1, value: 0, ease: EASE_OUT_BEZIER_SUBTLE.ease }, { time: 9, value: 564 }]),
    h: 27
}, {
    // right side
    type: 'rectangle',
    x: 317,
    y: new AnimatedValue_1.default([{ time: 0, value: 732, ease: EASE_IN_OUT_BEZIER.ease }, { time: 12, value: 0 }]),
    w: 40,
    h: 740
}, {
    // below name
    type: 'rectangle',
    x: 0,
    y: 624,
    w: new AnimatedValue_1.default([{ time: 2, value: 0, ease: EASE_OUT_BEZIER_SUBTLE.ease }, { time: 12, value: 564 }]),
    h: 11
}, {
    // between items
    type: 'rectangle',
    x: 0,
    y: 673,
    w: new AnimatedValue_1.default([{ time: 2, value: 0, ease: EASE_OUT_BEZIER_SUBTLE.ease }, { time: 14, value: 564 }]),
    h: 4
}, {
    // bottom
    type: 'rectangle',
    x: 0,
    y: 713,
    w: new AnimatedValue_1.default([{ time: 1, value: 0, ease: EASE_IN_OUT_BEZIER.ease }, { time: 13, value: 564 }]),
    h: 50
}];

var ClassCardFrameCanvas = function (_AnimatingCanvasAbstr) {
    _inherits(ClassCardFrameCanvas, _AnimatingCanvasAbstr);

    function ClassCardFrameCanvas() {
        _classCallCheck(this, ClassCardFrameCanvas);

        var _this = _possibleConstructorReturn(this, (ClassCardFrameCanvas.__proto__ || Object.getPrototypeOf(ClassCardFrameCanvas)).call(this));

        _this.offscreenCanvas = document.createElement('canvas');
        _this.octx = _this.offscreenCanvas.getContext('2d');
        _this.canvas.classList.add('class-card__frame-canvas');
        FRAME_IMAGE.addEventListener('load', function () {
            _this._sizeCanvas();
        });
        return _this;
    }

    _createClass(ClassCardFrameCanvas, [{
        key: "_sizeCanvas",
        value: function _sizeCanvas() {
            var canWidth = FRAME_IMAGE.width;
            var canHeight = FRAME_IMAGE.height;
            this.canvas.width = canWidth;
            this.canvas.height = canHeight;
            this.offscreenCanvas.width = canWidth;
            this.offscreenCanvas.height = canHeight;
        }
    }, {
        key: "draw",
        value: function draw(time) {
            var _this2 = this;

            var kfTime = time / REAL_TIME_PER_KEYFRAME_TIME;
            this.octx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
            this.octx.fillStyle = '#FFFFFF';
            SHAPES.forEach(function (shape) {
                if (shape.type === 'rectangle') {
                    _this2.octx.fillRect(getRealValue(shape.x, kfTime), getRealValue(shape.y, kfTime), getRealValue(shape.w, kfTime), getRealValue(shape.h, kfTime));
                }
            });
            this.clear();
            this.ctx.save();
            this.ctx.drawImage(FRAME_IMAGE, 0, 0);
            this.ctx.globalCompositeOperation = 'source-in';
            this.ctx.drawImage(this.offscreenCanvas, 0, 0);
            this.ctx.restore();
            // save redraws
            if (kfTime > LAST_KF_TIME) {
                this.stop();
            }
        }
    }]);

    return ClassCardFrameCanvas;
}(AnimatingCanvasAbstract_1.default);
// quick helper


function getRealValue(baseValue, time) {
    if (baseValue instanceof AnimatedValue_1.default) {
        return baseValue.getAtTime(time);
    } else {
        return baseValue;
    }
}
exports.default = ClassCardFrameCanvas;

},{"../utils/AnimatedValue":8,"../utils/easing/CubicBezier":11,"./AnimatingCanvasAbstract":3}],6:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var ClassCard_1 = require("./ClassCard");
var UNSHIFT_STAGGER_TIME = 33;
// this is super minimal
// using mostly as a controller for now

var ClassSelectScreen = function () {
    function ClassSelectScreen(element, classConfigs) {
        var _this = this;

        _classCallCheck(this, ClassSelectScreen);

        this.classCards = [];
        classConfigs.forEach(function (c, index) {
            var card = new ClassCard_1.default(c);
            card.shift();
            _this.classCards.push(card);
            element.appendChild(card.element);
            card.element.addEventListener('click', function () {
                _this.setActiveClass(index);
            });
        });
        this.element = element;
    }

    _createClass(ClassSelectScreen, [{
        key: "setActiveClass",
        value: function setActiveClass(index) {
            if (this.activeIndex === index) {
                return;
            }
            // clear current
            if (this.activeIndex !== undefined) {
                this.classCards[this.activeIndex].setInactive();
            }
            // set new
            if (this.classCards[index]) {
                this.classCards[index].setActive();
                this.activeIndex = index;
            }
        }
    }, {
        key: "show",
        value: function show() {
            this.element.classList.remove('is-hidden');
            this.classCards.forEach(function (c, index) {
                c.unshift(index * UNSHIFT_STAGGER_TIME);
            });
        }
    }]);

    return ClassSelectScreen;
}();

exports.default = ClassSelectScreen;

},{"./ClassCard":4}],7:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

Object.defineProperty(exports, "__esModule", { value: true });
var deepExtend_1 = require("../utils/deepExtend");
var tileCanvasImage_1 = require("../utils/tileCanvasImage");
var AnimatingCanvasAbstract_1 = require("./AnimatingCanvasAbstract");
// set up global cloud image
var cloudImageLoaded = false;
var CLOUD_IMAGE = new Image();
CLOUD_IMAGE.addEventListener('load', function () {
    cloudImageLoaded = true;
});
CLOUD_IMAGE.src = 'images/clouds.png';
var DEFAULTS = {
    imagePath: '',
    cloudSpeed: {
        x: 100,
        y: 100
    }
};

var CloudedCanvas = function (_AnimatingCanvasAbstr) {
    _inherits(CloudedCanvas, _AnimatingCanvasAbstr);

    function CloudedCanvas(options) {
        _classCallCheck(this, CloudedCanvas);

        var _this = _possibleConstructorReturn(this, (CloudedCanvas.__proto__ || Object.getPrototypeOf(CloudedCanvas)).call(this));

        _this.config = deepExtend_1.default({}, DEFAULTS, options);
        _this._initImage();
        _this._sizeCanvas();
        _this.canvas.classList.add('clouded-canvas');
        return _this;
    }

    _createClass(CloudedCanvas, [{
        key: "_initImage",
        value: function _initImage() {
            var _this2 = this;

            this.image = new Image();
            this.imageLoaded = false;
            this.image.addEventListener('load', function () {
                _this2.imageLoaded = true;
                _this2._sizeCanvas();
            });
            this.image.src = this.config.imagePath;
        }
    }, {
        key: "_sizeCanvas",
        value: function _sizeCanvas() {
            if (!this.config && !this.image) {
                // not ready
                return;
            }
            var canWidth = this.config && this.config.width || this.image.width;
            var canHeight = this.config && this.config.height || this.image.height;
            this.canvas.width = canWidth;
            this.canvas.height = canHeight;
        }
    }, {
        key: "draw",
        value: function draw() {
            var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

            if (!this.imageLoaded || !cloudImageLoaded) {
                // if we don't have the images, fail
                return;
            }
            var timeInS = time / 1000;
            this.clear();
            // save context state
            this.ctx.save();
            // draw the clouds, tiled
            tileCanvasImage_1.default(this.canvas, CLOUD_IMAGE, this.config.cloudSpeed.x * timeInS, this.config.cloudSpeed.y * timeInS);
            // change mode to draw within destination
            this.ctx.globalCompositeOperation = 'source-in';
            // draw the real image
            this.ctx.drawImage(this.image, 0, 0);
            // return to last state
            this.ctx.restore();
        }
    }]);

    return CloudedCanvas;
}(AnimatingCanvasAbstract_1.default);

exports.default = CloudedCanvas;

},{"../utils/deepExtend":10,"../utils/tileCanvasImage":12,"./AnimatingCanvasAbstract":3}],8:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });

var AnimatedValue = function () {
    function AnimatedValue(keyframes) {
        var startBound = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
        var endBound = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

        _classCallCheck(this, AnimatedValue);

        this.keyframes = keyframes;
        this.length = keyframes[keyframes.length - 1].time;
        this.startBound = startBound;
        this.endBound = endBound;
    }

    _createClass(AnimatedValue, [{
        key: "getAtTime",
        value: function getAtTime(time) {
            // handle before if startBound and after if endBound
            if (this.startBound && this.keyframes[0].time >= time) {
                return this.keyframes[0].value;
            } else if (this.endBound && this.keyframes[this.keyframes.length - 1].time <= time) {
                return this.keyframes[this.keyframes.length - 1].value;
            }
            // time for maths
            // kf measures the 'to' frame, so start at 1 instead of 0
            var kf = 1;
            // for loop that doesn't really do anything inside the loop. Just iterates until the condition is true
            for (; kf < this.keyframes.length - 1 && time > this.keyframes[kf].time; kf++) {}
            // determine easing method
            if (typeof this.keyframes[kf - 1].ease === 'function') {
                return this.keyframes[kf - 1].ease(this.keyframes[kf - 1].value, this.keyframes[kf].value - this.keyframes[kf - 1].value, (time - this.keyframes[kf - 1].time) / (this.keyframes[kf].time - this.keyframes[kf - 1].time));
            } else {
                // no passed easing method, so linear it is
                return this.keyframes[kf - 1].value + (this.keyframes[kf].value - this.keyframes[kf - 1].value) * (time - this.keyframes[kf - 1].time) / (this.keyframes[kf].time - this.keyframes[kf - 1].time);
            }
        }
    }]);

    return AnimatedValue;
}();

exports.default = AnimatedValue;

},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var deepExtend_1 = require("../utils/deepExtend");
/**
 * Creates an element with the given properties.
 *
 * @export
 * @param {string} tagName
 * @param {object} [props={}]
 * @returns
 */
function createElement(tagName) {
  var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var el = document.createElement(tagName);
  deepExtend_1.default(el, props);
  return el;
}
exports.default = createElement;

},{"../utils/deepExtend":10}],10:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Deeply extends an object with another. The first object is mutated.
 *
 * @param {Object} obj1
 * @param {Object} obj2
 * @returns
 */
function deepExtendObject(obj1, obj2) {
    for (var prop in obj2) {
        if (_typeof(obj2[prop]) === 'object') {
            if (_typeof(obj1[prop]) !== 'object') {
                obj1[prop] = {};
            }
            // recursively apply object
            deepExtend(obj1[prop], obj2[prop]);
        } else {
            obj1[prop] = obj2[prop];
        }
    }
    return obj1;
}
/**
 * Deeply extends an object with a number of other objects.
 *
 * @export
 * @param {object} obj1
 * @param {object[]} additionalObjects
 * @returns
 */
function deepExtend(obj1) {
    for (var _len = arguments.length, additionalObjects = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        additionalObjects[_key - 1] = arguments[_key];
    }

    additionalObjects.forEach(function (o) {
        deepExtendObject(obj1, o);
    });
    return obj1;
}
exports.default = deepExtend;

},{}],11:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });

var CubicBezier = function () {
    function CubicBezier(x1, y1, x2, y2) {
        _classCallCheck(this, CubicBezier);

        this.points = [0, 0, x1, y1, x2, y2, 1, 1];
        this.ease = this.ease.bind(this);
    }
    // this was mostly ripped/ported to ES6 from a method I figured out years ago. I don't remember how it actually works.


    _createClass(CubicBezier, [{
        key: "ease",
        value: function ease(start, change, percentage) {
            // first, figure out y percentage - which we use for the output - from x percentage - which is the input
            var possibleResults = [];
            // let's find `t` where:
            // x = (1-t)^3 * X0 + 3*(1-t)^2 * t * X1 + 3*(1-t) * t^2 * X2 + t^3 * X3
            // thus a series of formulas can be used to derive `t` by solving a cubic equation
            //
            // some of this hurts my brain, but these were derived from:
            //   simplify the cubic equation:
            //     t^3(X0 + 3X1 - 3X2 + X3) + 3*t^2*(X0 - 2X1 + X2) + 3 * t * (X1 - X0) + X0 - x
            //     use the formulas:
            //       t = u - (b / (3a))
            //       u^3 + pu + q = 0
            //       p = (3ac - b^2) / 3a^2
            //       q = (2b^3 - 9abc + 27a^2d) / 27a^3
            //
            //     see: https://en.wikipedia.org/wiki/Cubic_function
            var a = this.points[0] + 3 * this.points[2] - 3 * this.points[4] + this.points[6];
            var b = 3 * (this.points[0] - 2 * this.points[2] + this.points[4]);
            var c = 3 * (this.points[2] - this.points[0]);
            var d = -percentage;
            var discriminant = void 0;
            if (!a) {
                // quadratic formula
                discriminant = c * c - 4 * b * d;
                if (discriminant >= 0) {
                    possibleResults = [(-b + Math.sqrt(discriminant)) / (2 * b), (-b - Math.sqrt(discriminant)) / (2 * b)];
                }
            } else {
                // cubic
                // start by normalizing the equation
                b /= a;
                c /= a;
                d /= a;
                var p = (3 * c - b * b) / 3;
                var q = (2 * b * b * b - 9 * b * c + 27 * d) / 27;
                if (p === 0) {
                    // cube root
                    possibleResults = [Math.pow(-q, 1 / 3)];
                } else if (q === 0) {
                    possibleResults = [Math.sqrt(-p), -Math.sqrt(p)];
                } else {
                    discriminant = Math.pow(q / 2, 2) + Math.pow(p / 3, 3);
                    if (discriminant === 0) {
                        possibleResults = [Math.pow(q / 2, 1 / 3) - b / 3];
                    } else if (discriminant > 0) {
                        possibleResults = [Math.pow(-(q / 2) + Math.sqrt(discriminant), 1 / 3) - Math.pow(q / 2 + Math.sqrt(discriminant), 1 / 3) - b / 3];
                    } else {
                        var r = Math.sqrt(Math.pow(-(p / 3), 3));
                        var phi = Math.acos(-(q / (2 * r)));
                        var s = 2 * Math.pow(r, 1 / 3);
                        possibleResults = [s * Math.cos(phi / 3) - b / 3, s * Math.cos((phi + 2 * Math.PI) / 3) - b / 3, s * Math.cos((phi + 4 * Math.PI) / 3) - b / 3];
                    }
                }
            }
            var t = void 0;
            if (possibleResults.length === 1) {
                t = possibleResults[0];
            } else {
                for (var i = 0, len = possibleResults.length; i < len; i++) {
                    if (possibleResults[i] >= 0 && possibleResults[i] <= 1) {
                        t = possibleResults[i];
                        break;
                    }
                }
            }
            // finally use t to get y
            var y = (1 - t) * (1 - t) * (1 - t) * this.points[1] + 3 * (1 - t) * (1 - t) * t * this.points[3] + 3 * (1 - t) * t * t * this.points[5] + t * t * t * this.points[7];
            return start + y * change;
        }
    }]);

    return CubicBezier;
}();

exports.default = CubicBezier;

},{}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Fills an entire canvas with a tiling of a given image.
 *
 * @export
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement} image
 * @param {number} baseX
 * @param {number} baseY
 * @returns
 */
function tileCanvasImage(canvas, image, baseX, baseY) {
    if (!image.width || !image.height) {
        // image can't be drawn without a size.
        // probably not loaded
        return;
    }
    // get the context
    var ctx = canvas.getContext('2d');
    // find upper-left starting position
    var startX = baseX - Math.ceil(baseX / image.width) * image.width;
    var startY = baseY - Math.ceil(baseY / image.height) * image.height;
    for (var curX = startX; curX < canvas.width; curX += image.width) {
        for (var curY = startY; curY < canvas.height; curY += image.height) {
            ctx.drawImage(image, curX, curY);
        }
    }
}
exports.default = tileCanvasImage;

},{}]},{},[2])

