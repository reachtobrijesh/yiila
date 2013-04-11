'use strict';

/**
 * @fileoverview Класс CLogRouter
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..');
/**
 * CLogRoutes управляет маршрутизаторами журнала, которые сохраняют
 * данные журнала в раздличных источниках.
 * 
 * Маршрутизаторы журнала могут быть настроены в конфигурации приложения.
 * Пример конфигурации:
 * <pre>
 * {
 *     'preload':['log'], // загрузка компонента при старте приложения
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
 * Можно указывать множество маршрутизаторов с различными условиями фильтрации
 * и различными источниками записи, даже, если маршрутизаторы одного типа.
 * @constructor
 * @extends {CComponent}
 */
var CLogRouter = module.exports = function() {
	return Yiila.CComponent.call(this);
};
Yiila.inherits(CLogRouter, Yiila.CComponent);

/**
 * @type {!Array} Список инициализированных маршрутизаторов
 * @private
 */
CLogRouter.prototype._routes = [];

/**
 * Инициализация компонента
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
 * @return {!Array} Массив инициализированных маршрутизаторов
 */
CLogRouter.prototype.getRoutes = function() {
	return this._routes.slice();
};

/**
 * @param {Array} config Список маршрутизаторов. Каждый элемент списка
 * представляет из себя конфигурацию для одного маршрутизатора и имеет
 * следующую структуру:
 * <ul>
 * <li>class: имя класса маршрутизатора</li>
 * <li>пара имя-значения: устанавливает свойства маршрутизатора</li>
 * </ul>
 */
CLogRouter.prototype.setRoutes = function(config) {
	for(var i = 0, len = config.length; i < len; i++)
		this._routes.push(config[i]);
};

/**
 * Собирает сообщения из журнала
 * Этот метод является обработчиком события CLogger::flush.
 * @param {boolean=} opt_dumpLogs {@see CLogger::flush()}
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
 * Собирает сообщения из журнала и запускает процесс обработки
 */
CLogRouter.prototype.processLogs = function() {
	var logger = Yiila.getLogger();
	this._routes.forEach(function(route) {
		if(route.enabled)
			route.collectLogs(logger,true);
	});
};