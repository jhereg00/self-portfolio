/**
 *  AJAXRequest
 *
 *  create a new instance to make a new request, or just call the exported function
 *  because it will create a new instance automatically if needed.
 *
 *	@param {object} options:
 *    @url : url to hit
 *    [@type] : 'GET' or 'POST'
 *    [@data] : object of parameters to pass to url
 *    [@complete] : function to run when complete, whether successful or not
 *    [@success] : function to run if successful
 *    [@error] : function to run if something goes wrong
 *    [@formEl] : element to return as the second argument to each of the above functions
 */

;(function (window,document,undefined) {

  // ajax
	var AJAXRequest = function (options) {
    if (!this instanceof AJAXRequest)
      return new AJAXRequest(options);

		if (!options.url)
			throw 'AJAXRequest requires a url';
		var xhttp = new XMLHttpRequest();
		options.type = options.type || 'GET';
		this.options = options;

		var dataStr = "";
		for (var prop in options.data) {
			dataStr += (dataStr === "" ? "" : "&") + prop + "=" + encodeURI(options.data[prop]);
		}

		xhttp.onreadystatechange = function () {
			if (xhttp.readyState === 4) {
				console.log('ajax done:',options.url,options.data);

				// done
				if (options.complete && typeof options.complete === 'function') {
					options.complete(xhttp.responseText, xhttp);
				}

				// success or fail
				if (xhttp.status === 200) {
					if (options.success && typeof options.success === 'function') {
						options.success(xhttp.responseText, xhttp);
					}
				}
				else if (options.error && typeof options.error === 'function') {
					options.error(xhttp.responseText, xhttp);
				}
			}
		}

		xhttp.open(options.type,(dataStr && options.type === 'GET' ? options.url + '?' + dataStr : options.url),true);
    // web-standards compliant x-requested-with
    xhttp.setRequestHeader("X-Requested-With","XMLHttpRequest");
		if (options.type === 'POST' && dataStr) {
			xhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
			xhttp.send(dataStr);
		}
		else {
			xhttp.send();
		}
	}

  module.exports = AJAXRequest;

})(window,document);
