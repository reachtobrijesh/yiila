'use strict';

/**
 * @fileoverview Класс CConsoleLogRoute
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..'),
	colors = require('colors'),
	moment = require('moment');

/**
 * CConsoleLogRoute записывает сообщения журнала в консоль
 * @constructor
 * @extends {CLogRoute}
 */
var CConsoleLogRoute = module.exports = function()
{
	return Yiila.CLogRoute.call(this);
};
Yiila.inherits(CConsoleLogRoute,Yiila.CLogRoute);

/**
 * Выводит сообщения журнала в консоль
 * @param {!Array} logs Список сообщений журнала
 */
CConsoleLogRoute.prototype.processLogs = function(logs)
{
	var message;
	
	logs.forEach(function(log) {
		message = this.formatLogMessage(log[0],log[1],log[2],log[3]);
		process.stdout.write(message);
	}, this);
};

CConsoleLogRoute.prototype.formatLogMessage = function(message,level,category,time) {
	var dformat = moment.unix(time).format('YYYY-MM-DD HH:mm:ss'),
		color;
	
	switch (level) {
		case Yiila.CLogger.LEVEL_ERROR:
			color = 'red';
			break;
		case Yiila.CLogger.LEVEL_WARNING:
			color = 'yellow';
			break;
		default:
			color = 'green';
			break;				
	}
	return dformat.grey+(' ['+level+'] ['+category+'] ')[color]+message+"\n";	
};