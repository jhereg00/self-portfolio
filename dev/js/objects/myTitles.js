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
