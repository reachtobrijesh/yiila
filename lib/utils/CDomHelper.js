/**
 * @fileoverview CDomHelper class file.
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..'),
	async = require('async');

/**
 * CDomHelper provide some basic functionalities to parse Dom.
 * Some of functions are asynchronous by default, such as {@see cascade, each}.
 * Examlple of usage:
 * <pre>
 *     var dom = Yiila.CDomHelper;
 *     dom.cascade(
 *         this.findAll('......'),
 *         this.each(
 *             this.text(),
 *             function(previous, callback) {
 *                 console.log(previous);
 *                 callback(null,null);
 *             }
 *         )
 *     )(window.document, function(err, result) {
 *         if (err)
 *             Yiila.trace(err.message);
 *         window.close();
 *     });
 *     
 * </pre>
 */
var CDomHelper = module.exports = function() {
	/**
	 * Map of tags whose content to ignore when calculating text length.
	 * @type {Object}
	 * @private
	 */
	var _TAGS_TO_IGNORE = {
		'SCRIPT': 1,
		'STYLE': 1,
		'HEAD': 1,
		'IFRAME': 1,
		'OBJECT': 1
	};

	/**
	 * Map of tags which have predefined values with regard to whitespace.
	 * @type {Object}
	 * @private
	 */
	var _PREDEFINED_TAG_VALUES = {'IMG': ' ', 'BR': '\n'};
	
	/**
	 * Recursive support function for text content retrieval.
	 * @param {Node} node The node from which we are getting content.
	 * @param {Array} buf string buffer.
	 * @param {boolean} normalizeWhitespace Whether to normalize whitespace.
	 * @private
	 */
	function _getTextContent(node, buf, normalizeWhitespace) {
		if (node.nodeName in _TAGS_TO_IGNORE) {
			// ignore certain tags
		} else if (node.nodeType == 3) {
			if (normalizeWhitespace) {
				buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ''));
			} else {
				buf.push(node.nodeValue);
			}
		} else if (node.nodeName in _PREDEFINED_TAG_VALUES) {
			buf.push(_PREDEFINED_TAG_VALUES[node.nodeName]);
		} else {
			var child = node.firstChild;
			while (child) {
				_getTextContent(child, buf, normalizeWhitespace);
				child = child.nextSibling;
			}
		}
	};
	
	return {
		/**
		 * Set an element to use it as previous result then
		 * {@see find}, {@see findAll} are executed
		 * @param {Document|Element} element
		 * @return {Function}
		 */
		set: function(element) {
			return function(callback) {
				if (CDomHelper.isElement(element) || CDomHelper.isDocument(element))
					callback(null,element);
				else
					callback(new Error('Could not set element'), null);
			};
		},
		/**
		 * Find a first element which match the expression
		 * @param {string|Element|Document} selector CSS3 expression, instance of Element or 
		 *     instance of Document
		 * @param {boolean=} opt_direct lookup among children of previously found element only.
		 *     Defaults to false
		 * @return {Function}
		 */
		find: function(selector, opt_direct) {
			return function(previous, callback) {	

				if (CDomHelper.isElement(selector) || CDomHelper.isDocument(selector)) {
					callback(null,selector);
				} else {	
					var element = null;
					
					try {
						element = previous.querySelector(selector); 
					} catch(e) {}
					
					if (!element || (opt_direct && element.parentNode != previous))
						callback(new Error('Could not find selector "'+selector+'"'), null);
					else 
						callback(null, element);
				}
			};
		},
		/**
		 * Find all elements which match the expression
		 * @param {string|Element|Document} selector CSS3 expression, instance of Element or 
		 *     instance of Document
		 * @param {boolean=} opt_direct lookup among children of previously found element only.
		 *     Defaults to false
		 * @return {Function}
		 */
		findAll: function(selector, opt_direct) {
			return function(previous, callback) {
				
				if (CDomHelper.isElement(selector) || CDomHelper.isDocument(selector)) {
					callback(null,[selector]);
				} else {
					var elements = null;
					
					try {
						elements = previous.querySelectorAll(selector); 
					} catch(e) {}
					
					if (!elements)
						elements = [];
					else if (opt_direct) {
						elements = [].filter.call(elements, function(element){
						     return element.parentNode == previous;
						});
					}
					if (!elements.length)
						callback(new Error('Could not find selector "'+selector+'"'), null);
					else
						callback(null, elements);
				}
			};
		},
		/**
		 * Find text content of a previous result
		 * @return {Function}
		 */
		text: function() {
			return function(previous, callback) {
				callback(null, CDomHelper.getTextContent(previous));
			};
		},
		/**
		 * Get value of a previous result
		 * @return {Function}
		 */
		value: function() {
			return function(previous, callback) {
				if (previous['value'] !== void 0)
					callback(null, previous.value);
				else
					callback(new Error('Could not get value'),null);
			};			
		},
		/**
		 * Runs an array of functions in series, each passing their results to the next in the array. 
		 * However, if any of the functions pass an error to the callback, the next function 
		 * is not executed and the main callback is immediately called with the error.
		 * The function is asynchronous.
		 * @param {?} tasks
		 * @return {Function}
		 */
		cascade: function(tasks) {
			var tasks = Array.prototype.slice.call(arguments);
			
			return function(previous, callback) {
				var t = tasks.slice();
				if (previous)
					t.unshift(CDomHelper.set(previous));
				async.waterfall(t,callback);
			};
		},
		/**
		 * Applies tasks to each item in a previous result, in series.
		 * The function is asynchronous.
		 * @param {?} tasks
		 * @return {Function}
		 */
		each: function() {
			var tasks = Array.prototype.slice.call(arguments);
			
			return function(previous,callback) {
				async.eachSeries(previous,function(item,item_cb) {
					async.eachSeries(tasks,function(task,task_cb){
						task(item, task_cb);
					}, item_cb);
				}, callback);
			};
		},
		/**
		 * Applies tasks to a previous result, in series.
		 * The function is asynchronous.
		 * @param {?} tasks
		 * @return {Function}
		 */
		series: function() {
			var tasks = Array.prototype.slice.call(arguments);
			
			return function(previous,callback) {
				async.eachSeries(tasks,function(task,task_cb){
					task(previous, task_cb);
				}, callback);
			};			
		},
		/**
		 * Store a previous result to the model attribute
		 * @param {Object} model instance of CModel
		 * @param {string} attribute name of attribute
		 * @return {Function}
		 */
		toAttribute: function(model, attribute) {
			return function(previous,callback) {
				model[attribute] = previous;
				callback(null, previous);
			};
		},
		/**
		 * Returns the text content of the current node, without markup and invisible
		 * symbols. New lines are stripped and whitespace is collapsed,
		 * such that each character would be visible.
		 *
		 * @param {Node} node The node from which we are getting content.
		 * @return {string} The text content.
		 */
		getTextContent: function(node) {
			var textContent;

			if ('innerText' in node) {
				textContent = node.innerText.replace(/(\r\n|\r|\n)/g, '\n');
				// Unfortunately .innerText() returns text with &shy; symbols
				// We need to filter it out and then remove duplicate whitespaces
			} else {
				var buf = [];
				_getTextContent(node, buf, true);
				textContent = buf.join('');
			}

			// Strip &shy; entities.
			textContent = textContent.replace(/ \xAD /g, ' ').replace(/\xAD/g, '');
			// Strip &#8203; entities.
			textContent = textContent.replace(/\u200B/g, '');
			
			if (textContent != ' ') {
				textContent = textContent.replace(/^\s*/, '');
			}

			return textContent;
		},
		/**
		 * Whether the object looks like an Element.
		 * @param {*} obj The object being tested for Element likeness.
		 * @return {boolean} Whether the object looks like an Element.
		 */
		isElement: function(obj) {
			return this.isObject(obj) && obj.nodeType == 1;
		},
		/**
		 * Whether the object looks like a Document.
		 * @param {*} obj The object being tested for Document likeness.
		 * @return {boolean} Whether the object looks like a Document.
		 */
		isDocument: function(obj) {
			return this.isObject(obj) && obj.nodeType == 9;
		},
		/**
		 * Returns true if the specified value is an object.  This includes arrays
		 * and functions.
		 * @param {*} val Variable to test.
		 * @return {boolean} Whether variable is an object.
		 */
		isObject: function(val) {
			var type = typeof val;
			return type == 'object' && val != null || type == 'function';	
		}	
	};
}();