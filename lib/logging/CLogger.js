'use strict';

/**
 * @fileoverview CLogger class file
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..');

/**
 * CLogger records log messages in memory.
 *
 * CLogger implements the methods to retrieve the messages with
 * various filter conditions, including log levels and log categories.
 * 
 * @constructor
 * @extends {CComponent}
 */
var CLogger = module.exports = function() {
	return Yiila.CComponent.call(this);
};
Yiila.inherits(CLogger, Yiila.CComponent);

CLogger.LEVEL_TRACE='trace';
CLogger.LEVEL_WARNING='warning';
CLogger.LEVEL_ERROR='error';
CLogger.LEVEL_INFO='info';
CLogger.LEVEL_PROFILE='profile';

/**
 * @type {number} how many messages should be logged before they are flushed to destinations.
 *     Defaults to 10,000, meaning for every 10,000 messages, the {@see flush} method will be
 *     automatically invoked once. If this is 0, it means messages will never be flushed automatically.
 */
CLogger.prototype.autoFlush=10000;

/**
 * @type {boolean} this property will be passed as the parameter to {@see flush()} when it is
 *     alled in {@see log()} due to the limit of {@see autoFlush} being reached.
 *     By default, this property is false, meaning the filtered messages are still kept in the memory
 *     by each log route after calling {@see flush()}. If this is true, the filtered messages
 *     will be written to the actual medium each time {@see flush()} is called within {@see log()}.
 */
CLogger.prototype.autoDump=false;
/**
 * @type {Array} log messages
 * @private
 */
CLogger.prototype._logs=[];
/**
 * @type {number} number of log messages
 * @private
 */
CLogger.prototype._logCount=0;
/**
 * @type {Array} log levels for filtering (used when filtering)
 * @private
 */
CLogger.prototype._levels = null;
/**
 * @type {Array} log categories for filtering (used when filtering)
 * @private
 */
CLogger.prototype._categories = null;
/**
 * @type {Array} log categories for excluding from filtering (used when filtering)
 * @private
 */
CLogger.prototype.except_ = null;
/**
* @type {boolean} if we are processing the log or still accepting new log messages
* @private
*/
CLogger.prototype._processing=false;

/**
 * @type {number} number of milliseconds.
 *     If this is 0, it means messages will never be flushed automatically.
 * @private
 */
CLogger.prototype._autoFlushTimer=0;

/**
 * Logs a message.
 * Messages logged by this method may be retrieved back via {@see getLogs}.
 * @param {string} message the message to be logged
 * @param {string=} opt_level level of the message (e.g. 'Trace', 'Warning', 'Error'). It is case-insensitive.
 * @param {string=} opt_category category of the message (e.g. 'system.web'). It is case-insensitive.
 * @see getLogs
 */
CLogger.prototype.log = function(message,opt_level,opt_category) {
	if (!this.getIsInitialized())
		this.init();
	
	opt_level = opt_level || 'info';
	opt_category = opt_category || 'application';
	
	this._logs.push([message,opt_level,opt_category,(Date.now() / 1000)]);
	this._logCount++;
	
	if (this.autoFlush > 0 && this._logCount >= this.autoFlush && !this._processing) {
		this._processing = true;
		this.flush(this.autoDump);
		this._processing = false;
	}
};

/**
 * Retrieves log messages.
 *
 * Messages may be filtered by log levels and/or categories.
 * A level filter is specified by a list of levels separated by comma or space
 * (e.g. 'trace, error'). A category filter is similar to level filter
 * (e.g. 'system, system.web'). A difference is that in category filter
 * you can use pattern like 'system.*' to indicate all categories starting
 * with 'system'.
 *
 * If you do not specify level filter, it will bring back logs at all levels.
 * The same applies to category filter.
 *
 * Level filter and category filter are combinational, i.e., only messages
 * satisfying both filter conditions will be returned.
 *
 * @param {string} opt_levels level filter. Optional.
 * @param {string|!Array} opt_categories category filter. Optional.
 * @param {string|!Array} opt_except categories to except. Optional.
 * @return {!Array} list of messages. Each array element represents one message
 * with the following structure:
 * [
 *   [0] => message (string)
 *   [1] => level (string)
 *   [2] => category (string)
 *   [3] => timestamp (float)
 * ];
 */
CLogger.prototype.getLogs = function(opt_levels,opt_categories,opt_except) {
	opt_levels = opt_levels || '';
	opt_categories = opt_categories || new Array();
	opt_except = opt_except || new Array();
	
	this._levels = opt_levels.toLowerCase().split(/[\s,]+/);
	
	if (typeof opt_categories == 'string')
		this._categories = opt_categories.toLowerCase().split(/[\s,]+/);
	else
		this._categories = opt_categories.map(function(s) {return s.toLowerCase()});

	if (typeof opt_except == 'string')
		this.except_ = opt_except.toLowerCase().split(/[\s,]+/);
	else
		this.except_ = opt_except.map(function(s) {return s.toLowerCase()});

	var ret = this._logs.slice();

	if (opt_levels !== '')
		ret = ret.filter(this.filterByLevel, this);

	if (Array.isArray(this._categories) || Array.isArray(this.except_))
		ret = ret.filter(this.filterByCategory, this);

	return ret;
};

/**
 * Filter function used by {@see getLogs}
 * @param {!Array} value element to be filtered
 * @return {boolean} true if valid log, false if not.
 */
CLogger.prototype.filterByCategory = function(value) {
	return this._filterAllCategories(value, 2);
};

/**
 * Filter function used to filter included and excluded categories.
 * @param {!Array} value element to be filtered
 * @param {number} index the index of the values array to be used for check
 * @return {boolean} true if valid timing entry, false if not.
 * @private
 */
CLogger.prototype._filterAllCategories = function(value, index) {
	var cat = value[index].toLowerCase();
	var ret = this._categories ? false : true;
	var c, len, category;
	
	if (this._categories) {
		
		len = this._categories.length;
		
		if (len) {
			for (var i = 0; i < len; i++) {
				category = this._categories[i];
				if (cat===category || ((c = category.replace(/\.\*$/,''))!==category && cat.indexOf(c)==0)) {
					ret = true;
					break;
				}
			}
		} else 
			ret = true;
	}
	
	if (ret && this.except_) {
		len = this.except_.length;
		
		for (var i = 0; i < len; i++) {
			category = this.except_[i];
			if (cat===category || ((c = category.replace(/\.\*$/,''))!==category && cat.indexOf(c)==0)) {
				ret = false;
				break;
			}
		}
	}
	
	return ret;
};

/**
 * Set an interval to flush the logs.
 * @param {number} time number of milliseconds.
 *     If this is 0, previously activated timer will be removed.
 */
CLogger.prototype.setAutoFlushTimer = function(time) {
	if (!CLogger.prototype.setAutoFlushTimer.interval && time) {
		CLogger.prototype.setAutoFlushTimer.interval = setInterval((function() {
			if (!this._processing)
			{
				this._processing = true;
				this.flush(this.autoDump);
				this._processing = false;
			}		
		}).bind(this), time);

	} else if (CLogger.prototype.setAutoFlushTimer.interval && !time) {
		clearInterval(CLogger.prototype.setAutoFlushTimer.interval);
		CLogger.prototype.setAutoFlushTimer.interval = null;		
	}
};

/**
 * Filter function used by {@see getLogs}
 * @param {!Array} value element to be filtered
 * @return {boolean} true if valid log, false if not.
 */
CLogger.prototype.filterByLevel = function(value) {
	return this._levels.indexOf(value[1].toLowerCase()) != -1 ? true : false;
};

/**
 * Emit "flush" event and removes all recorded messages from the memory.
 * Any handlers of the flush event must do work synchronously (omit event loop)
 * @param {boolean} opt_dumpLogs whether to process the logs immediately as they are passed to log route
 */
CLogger.prototype.flush = function(opt_dumpLogs) {
	this.emit('flush', opt_dumpLogs);
	this._logs = [];
	this._logCount = 0;
};