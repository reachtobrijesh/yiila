/**
 * @fileoverview WevPage class
 * @author mik.bulatov@gmail.com
 */
var Yiila = require('../../../lib/');

//@namespace lib
var lib = {
	request: require('request'),
	jsdom: require('jsdom'),
	util: require('util')
};

/**
 * The class provide ability to load the url and build a DOM structure in the one step. Just for example.
 * @constructor
 * @extends {CComponent}
 */
var WebPage = module.exports = function() {
	return Yiila.CComponent.call(this);
};
Yiila.inherits(WebPage, Yiila.CComponent);

/**
 * The property must be set before you call {@see load()}
 * @type {number} number of milliseconds 
 */
WebPage.prototype.timeout = 30000;

/**
 * The property must be set before you call {@see load()}
 * @type {!Array} valid codes of the http response
 */
WebPage.prototype.acceptedStatusCodes = [200,304];

/**
 * Whether to create a window object
 * @link https://developer.mozilla.org/en-US/docs/DOM/window
 * @type {boolean}
 */
WebPage.prototype.createWindow = false;

/**
 * @type {Object}
 * @private
 */
WebPage.prototype._doc = null;


/**
 * Load the page and create a DOM structure.
 * @param {string} uri the url of the page
 * @param {Function=} opt_callback callback function
 */
WebPage.prototype.load = function(uri, opt_callback) {
	var self = this;
	var options = {uri:uri, jar:false, timeout: self.timeout}; 
	opt_callback = opt_callback || function() {};
	
	lib.request(options, function(err, response, data) {
		if (!err && self.acceptedStatusCodes.indexOf(response.statusCode) !== -1) {
			var document = lib.jsdom.jsdom(data, lib.jsdom.level(2, 'style'), {
				features : {
					FetchExternalResources : false,
					ProcessExternalResources: false
				}
			});
			
			if (self.createWindow)
				document.createWindow();
			
			self._clear();
			self._doc = document;
			opt_callback(null, response, document);
		} else if (err)
			opt_callback(err);
		else
			opt_callback(new Error(lib.util.format('Unacceptable status code: %s', response.statusCode)));
	});
};

/**
 * Clear ane internal data
 * @private
 */
WebPage.prototype._clear = function() {
	if (this._doc && this._doc.parentWindow && typeof this._doc.parentWindow.close == 'function')
		this._doc.parentWindow.close();
};

/**
 * Close the web page
 * Note: don't forget to call this method when all your operations with DOM was done
 */
WebPage.prototype.close = function() {
	this._clear();
	this._doc = null;
};
