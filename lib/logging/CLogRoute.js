'use strict';

/**
 * @fileoverview CLogRoute class file
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..'),
	moment = require('moment');

/**
 * CLogRoute is the base class for all log route classes.
 *
 * A log route object retrieves log messages from a logger and sends it
 * somewhere, such as files, emails.
 * The messages being retrieved may be filtered first before being sent
 * to the destination. The filters include log level filter and log category filter.
 *
 * To specify level filter, set {@see levels} property,
 * which takes a string of comma-separated desired level names (e.g. 'Error, Debug').
 * To specify category filter, set {@see categories} property,
 * which takes a string of comma-separated desired category names (e.g. 'System.Web, System.IO').
 *
 * Level filter and category filter are combinational, i.e., only messages
 * satisfying both filter conditions will they be returned.
 * 
 * @constructor
 * @abstract
 * @extends {CComponent}
 */
var CLogRoute = module.exports = function() {
	return Yiila.CComponent.call(this);
};
Yiila.inherits(CLogRoute, Yiila.CComponent);

/**
 * @type {boolean} whether to enable this log route. Defaults to true.
 */
CLogRoute.prototype.enabled=true;
/**
 * @type {string} list of levels separated by comma or space. Defaults to empty, meaning all levels.
 */
CLogRoute.prototype.levels='';
/**
 * @type {string|!Array} array of categories, or string list separated by comma or space.
 *     Defaults to empty array, meaning all categories.
 */
CLogRoute.prototype.categories=[];
/**
 * @type {string|!Array} array of categories, or string list separated by comma or space, to EXCLUDE from logs.
 *     Defaults to empty array, meaning no categories are excluded.
 *     This will exclude any categories after categories has been ran.
 */
CLogRoute.prototype.except=[];
/**
 * @type {*} the additional filter that can be applied to the log messages.
 * NOTE: RESERVED, NOT IMPLEMENTED YET
 */
CLogRoute.prototype.filter=null;
/**
 * @type {!Array} the logs that are collected so far by this log route.
 */
CLogRoute.prototype.logs=[];

/**
 * Formats a log message given different fields.
 * @param {string} message message content
 * @param {string} level message level
 * @param {string} category message category
 * @param {float} time timestamp
 * @return {string} formatted message
 * @protected
 */
CLogRoute.prototype.formatLogMessage = function(message,level,category,time)
{
	var dformat = moment.unix(time).format('YYYY-MM-DD HH:mm:ss');
	return dformat+' ['+level+'] ['+category+'] '+message+"\n";
};

/**
 * Retrieves filtered log messages from logger for further processing.
 * @param {CLogger} logger logger instance
 * @para, {boolean} opt_processLogs whether to process the logs after they are collected from the logger.
 *     Defaults to false.
 */
CLogRoute.prototype.collectLogs = function(logger, opt_processLogs)
{
	if (typeof opt_processLogs !== 'boolean')
		opt_processLogs = false;
	
	var logs = logger.getLogs(this.levels,this.categories,this.except);
	this.logs = !this.logs.length ? logs : this.logs.concat(logs);
	
	if (opt_processLogs && this.logs.length)
	{
		if (this.logs.length)
			this.processLogs(this.logs);
		this.logs = [];
	}
};

/**
 * Processes log messages and sends them to specific destination.
 * Derived child classes must implement this method.
 * @param {!Array} logs list of messages. Each array element represents one message
 * with the following structure:
 * [
 *   [0] => message (string)
 *   [1] => level (string)
 *   [2] => category (string)
 *   [3] => timestamp (float, obtained by microtime(true));
 * ]
 * @protected
 * @abstract
 */
CLogRoute.prototype.processLogs = function(logs) {};