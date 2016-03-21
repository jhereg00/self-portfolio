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
