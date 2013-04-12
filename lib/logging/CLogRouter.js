'use strict';

/**
 * @fileoverview CLogRouter class file
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..');

/**
 * Collects and processes log messages from a logger.
 * 
 * Log routes may be configured in application configuration like following:
 * <pre>
 * {
 *     'preload':['log'], // preload log component when app starts
 *     'components': {
 *         'log': {
 *             'class':'CLogRouter',
 *             'routes': [
 *                 {
 *                     'class':'MyFileLogRoute',
 *                     'levels':'trace, info',
 *                     'categories':'system.*'
 *                 },
 *                 {
 *                     'class':'MyEmailLogRoute',
 *                     'levels':'error, warning'
 *                 }
 *             ]
 *         }
 *     }
 * }
 * </pre>
 *
 * You can specify multiple routes with different filtering conditions and different
 * targets, even if the routes are of the same type.
 * 
 * @constructor
 * @extends {CComponent}
 */
var CLogRouter = module.exports = function() {
	return Yiila.CComponent.call(this);
};
Yiila.inherits(CLogRouter, Yiila.CComponent);

/**
 * @type {!Array}
 * @private
 */
CLogRouter.prototype._routes = [];

/**
 * Initializes this application component.
 * @override
 */
CLogRouter.prototype.init = function() {
	CLogRouter.__superClass__.init.call(this);
	
	var len = this._routes.length, route;
	
	for (var i = 0; i < len; i++)
	{
		route = Yiila.createComponent(this._routes[i]);
		route.init();
		this._routes[i] = route;
	}
	Yiila.getLogger().on('flush', this.collectLogs.bind(this));
	Yiila.app().on('end', this.processLogs.bind(this));
};

/**
 * @return {!Array} the currently initialized routes
 */
CLogRouter.prototype.getRoutes = function() {
	return this._routes.slice();
};

/**
 * @param {Array} config list of route configurations. Each array element represents
 * the configuration for a single route and has the following array structure:
 * <ul>
 * <li>class: specifies the class name or alias for the route class.</li>
 * <li>name-value pairs: configure the initial property values of the route.</li>
 * </ul>
 */
CLogRouter.prototype.setRoutes = function(config) {
	for(var i = 0, len = config.length; i < len; i++)
		this._routes.push(config[i]);
};

/**
 * Collects log messages from a logger.
 * This method is an event handler to the {@see CLogger.flush} event.
 * @param {boolean=} opt_dumpLogs {@see CLogger.flush()}
 */
CLogRouter.prototype.collectLogs = function(opt_dumpLogs) {
	var logger = Yiila.getLogger();
	opt_dumpLogs = typeof opt_dumpLogs == 'boolean' ? opt_dumpLogs : false;
	this._routes.forEach(function(route) {
		if(route.enabled)
			route.collectLogs(logger,opt_dumpLogs);
	});
};

/**
 * Collects and processes log messages from a logger.
 */
CLogRouter.prototype.processLogs = function() {
	var logger = Yiila.getLogger();
	this._routes.forEach(function(route) {
		if(route.enabled)
			route.collectLogs(logger,true);
	});
};