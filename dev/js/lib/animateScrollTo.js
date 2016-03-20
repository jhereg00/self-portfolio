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
