'use strict';

/**
 * @fileoverview CLogRoute class file.
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..');
var moment = require('moment');

/**
 * CLogRoute - базовый класс для всех маршрутизаторов журнала сообщений
 *
 * Объект маршрутизатор получает сообщения из журнала и отправляет их
 * куда-либо еще, например в файл, эл.почту, сервер.
 * 
 * Получаемые сообщения могут быть отфильтрованы до отправки в пункт назначения.
 * Фильтры включают в себя фильтр по уровню сообщения и фильтр по категории.
 *
 * Чтобы задать фильтр по уровню, установите свойство {@see levels},
 * которое принимает строку с разделенными запятыми названиями уровней
 * (например, 'Error, Debug')
 * Чтобы установить фильтр по категориям, установите свойство {@see categories},
 * которое принимает строку с разделенными запятыми названиями категорий
 * (например, 'System.Web, System.IO').
 *
 * Фильтр по уровням и фильтр по категориям могут быть скомбинированы,
 * Например, только сообщения удовлетворяющие обоим фильтрам будут возвращены.
 * 
 * @constructor
 * @abstract
 * @extends {CComponent}
 */
var CLogRoute = module.exports = function()
{
	return Yiila.CComponent.call(this);
};
Yiila.inherits(CLogRoute, Yiila.CComponent);

/**
 * @type {boolean} следует ли включить этот маршрутизатор. По умолчанию, true.
 */
CLogRoute.prototype.enabled=true;
/**
 * @type {string} Перечисление уровней, разделенные пробелом или запятой. 
 * По умолчанию пустая строка, что соответствует всем уровням.
 */
CLogRoute.prototype.levels='';
/**
 * @type {string|!Array} список категорий, или строка с названиями категорий,
 * разделенными пробелом или запятой.
 * По умолчанию пустой массив, что соответствует всем уровням.
 */
CLogRoute.prototype.categories=[];
/**
 * @type {string|!Array} список категорий, или строка с названиями категорий,
 * разделенными пробелом или запятой, которые должны быть исключены.
 * По умолчанию пустой массив, то есть никакие категории не будут исключены.
 */
CLogRoute.prototype.except=[];
/**
 * @type {*} дополнительный фильтр. Пока не реализовано, и надо ли...
 */
CLogRoute.prototype.filter=null;
/**
 * @type {!Array} Сообщения журнала, отобранные этим маршрутизаторром.
 */
CLogRoute.prototype.logs=[];

/**
 * Форматирует сообщение журнала
 * @param {string} message Текст сообщения
 * @param {string} level Уровень
 * @param {string} category Категория
 * @param {float} time timestamp
 * @return {string} Отформатированное сообщение
 * @protected
 */
CLogRoute.prototype.formatLogMessage = function(message,level,category,time)
{
	var dformat = moment.unix(time).format('YYYY-MM-DD HH:mm:ss');
	return dformat+' ['+level+'] ['+category+'] '+message+"\n";
};

/**
 * Получает отфильтрованные сообщения журнала для выполнения дальнейших
 * операций.
 * @param {CLogger} logger Ссылка на экземпляр класса CLogger
 * @para, {boolean} opt_processLogs Следует ли выполнить дальнейшие операции, после того
 *     как сообщения были получены из журнала.
 *     По умолчанию, false.
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
 * Запускает обработку сообщений журнала и отправляет по месту назначения.
 * Классы наследники должны, реализовать этот метод.
 * @param {!Array} logs Список сообщений. Каждый элемент - одно сообщение
 * со следующей структурой:
 * [
 *   [0] => message (string)
 *   [1] => level (string)
 *   [2] => category (string)
 *   [3] => timestamp (float, obtained by microtime(true));
 * ]
 *   @protected
 *   @abstract
 */
CLogRoute.prototype.processLogs = function(logs) {};