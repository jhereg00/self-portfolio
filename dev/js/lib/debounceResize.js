/**
 *  Debounce resize events
 *  base export adds a function to fire on resize
 *  exports.remove allows you to remove a function
 */

var resizeTimeout;
var resizeFunctions = [];
var doResize = function () {
  for (var i = 0, len = resizeFunctions.length; i < len; i++) {
    resizeFunctions[i]();
  }
}
window.addEventListener('resize',function () {
  if (resizeTimeout)
    clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function () {
    doResize();
  }, 300);
});
window.addEventListener('load',function () {
  doResize();
});

var addResizeFunction = function (fn) {
  if (typeof fn === 'function' && resizeFunctions.indexOf(fn) == -1)
    resizeFunctions.push(fn);
}
var removeResizeFunction = function (fn) {
  for (var i = 0, len = resizeFunctions.length; i < len; i++) {
    if (resizeFunctions[i] == fn) {
      resizeFunctions.splice(i,1);
      return true;
    }
  }
  return false;
}

module.exports = addResizeFunction;
module.exports.remove = removeResizeFunction;
