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
