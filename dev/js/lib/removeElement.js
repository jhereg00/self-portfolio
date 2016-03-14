/**
 *  Remove a DOM Element
 */

var removeElement = (function () {

  var testEl = document.createElement('div');
  if (testEl.remove && typeof testEl.remove === 'function') {
    return function (element) {
      element.remove();
    }
  }
  else {
    return function (element) {
      try {
        element.parentNode.removeChild(element);
      } catch (err) {
        console.error(err);
      }
    }
  }

})();

module.exports = removeElement;
