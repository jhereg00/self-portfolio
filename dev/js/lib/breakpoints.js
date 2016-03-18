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
