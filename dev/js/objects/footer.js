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
