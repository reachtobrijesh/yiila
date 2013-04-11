'use strict';
/**
 * @fileoverview Класс CLogger
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..');

/**
 * CLogger записывает сообщения журнала в память.
 *
 * Включает методы для получения сообщений с различными условиями-фильтрами,
 * в том числе по уровню сообщения и категории.
 * @constructor
 * @extends {CComponent}
 */
var CLogger = module.exports = function() 
{
	return Yiila.CComponent.call(this);
};
Yiila.inherits(CLogger, Yiila.CComponent);

CLogger.LEVEL_TRACE='trace';
CLogger.LEVEL_WARNING='warning';
CLogger.LEVEL_ERROR='error';
CLogger.LEVEL_INFO='info';
CLogger.LEVEL_PROFILE='profile';

/**
 * @type {number} Количество сообщений которые могут быть записаны
 *     перед тем как они будут сброщены в место назначения.
 *     По умолчанию 10 000, то есть каждые 10 000 сообщений сбрасываются методом
 *     {@see flush}. Если установлено 0, автоматически не будет вызываться {@see flush}.
 */
CLogger.prototype.autoFlush=10000;

/**
 * @type {boolean} Это свойство будет передано как параметр в {@see flush()}, когда последний
 *     вызывается из {@see log()} при достижении лимита {@see autoFlush}.
 *     По умолчанию это свойство = false - это означает, что отфильтрованные сообщения остаются в памяти
 *     каждого маршрутизатора после вызова {@see flush()}. Если установлено в true, 
 *     отфильтрованные сообщения будут записаны в соответствующий источник маршрутизатором, 
 *     каждый раз когда будет вызываться {@see flush()} из {@see log()}.
 */
CLogger.prototype.autoDump=false;
/**
 * @type {Array} Журнал сообщений
 * @private
 */
CLogger.prototype._logs=[];
/**
 * @type {number} Количество сообщений в журнале
 * @private
 */
CLogger.prototype._logCount=0;
/**
 * @type {Array}
 * @private
 */
CLogger.prototype._levels = null;
/**
 * @type {Array} Категории (используется при фильтрации)
 * @private
 */
CLogger.prototype._categories = null;
/**
 * @type {Array} Категории, исключаемые при фильтрации
 * @private
 */
CLogger.prototype.except_ = null;
/**
* @type {boolean} запущена ли обработка журнала или сообщения по прежнему
*     принимаются в журнал
* @private
*/
CLogger.prototype._processing=false;

/**
 * @type {number} Количество milliseconds через которые вызывается автоматический сброс в место
 *     назначения. Если установлено 0, автоматически не будет вызываться {@see flush}.
 * @private
 */
CLogger.prototype._autoFlushTimer=0;

/**
 * Помещает сообщение в журнал
 * Сообщения, помещенные в журнал этим методом, могут быть получены
 * назад через {@see getLogs}.
 * @param {string} message Сообщение, которое нужно поместить в журнал
 * @param {string=} opt_level Уровень сообщения
 *     (например, 'Trace', 'Warning', 'Error'). Регистро-независимо.
 * @param {string=} opt_category Категория сообщения 
 *     (например, 'core.application'). Регистро-независимо.
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
 * Возвращает данные журнала сообщений
 *
 * Сообщения могут быть отфильтрованы по уровням и/или категориям.
 * Фильтр по уровням представляет из себя список названий уровней, разделенных запятой
 * или пробелом (например, 'trace, error').
 * Фильтр категорий похож на предыдущий (например, 'system, system.web').
 * Однако в фильтре категорий можно также использовать шаблон (.*):
 * например,'system.*', чтобы обозначить все категории, начинающиеся с 'system'.
 *
 * Если фильтр по уровням не задан, будут возвращены сообщения по всем уровням.
 * То же относится и фильтру по категориям.
 *
 * Фильтр по уровням и фильтр по категориям можно комбинировать, то есть
 * будут возвращены сообщения, удовлетворяющие обоим фильтрам.
 *
 * @param {string} opt_levels Фильтр по уровням
 * @param {string|!Array} opt_categories Фильтр по категориям
 * @param {string|!Array} optexcept_ Фильтр по исключаемым категориям
 * @return {!Array} Список сообщений. Каждый элемент списка - одно сообщение
 * со следующей структурой:
 * [
 *   [0] => текст сообщения (string)
 *   [1] => уровень (string)
 *   [2] => категория (string)
 *   [3] => timestamp (float)
 * ];
 */
CLogger.prototype.getLogs = function(opt_levels,opt_categories,optexcept_) {
	opt_levels = opt_levels || '';
	opt_categories = opt_categories || new Array();
	optexcept_ = optexcept_ || new Array();
	
	this._levels = opt_levels.toLowerCase().split(/[\s,]+/);
	
	if (typeof opt_categories == 'string')
		this._categories = opt_categories.toLowerCase().split(/[\s,]+/);
	else
		this._categories = opt_categories.map(function(s) {return s.toLowerCase()});

	if (typeof optexcept_ == 'string')
		this.except_ = optexcept_.toLowerCase().split(/[\s,]+/);
	else
		this.except_ = optexcept_.map(function(s) {return s.toLowerCase()});

	var ret = this._logs.slice();

	if (opt_levels !== '')
		ret = ret.filter(this.filterByLevel, this);

	if (Array.isArray(this._categories) || Array.isArray(this.except_))
		ret = ret.filter(this.filterByCategory, this);

	return ret;
};

/**
 * Метод-фильтр. Используется в {@see getLogs}
 * @param {!Array} value Элемент для фильтрации
 * @return {boolean} Возвращает true, если элемент удовлетворяет условиям,
 *     false - в противном случае.
 */
CLogger.prototype.filterByCategory = function(value) {
	return this.filterAllCategories(value, 2);
};

/**
 * Метод-фильтр используется для фильтрации по включенным и исключенным категориям
 * @param {!Array} value Элемент для фильтрации
 * @param {number} index Индекс в переданном элементе, который используется для проверки
 * @return {boolean} Возвращает true, если элемент удовлетворяет условиям,
 *     false - в противном случае.
 */
CLogger.prototype.filterAllCategories = function(value, index) {
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
 * Устанавливает сборку журнала через заданный интервал,
 * если интервал установлен в 0, ранее взведенный таймер будет остановлен.
 * @param {number} time время в милисекундах
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
 * Метод-фильтр. Используется в {@see getLogs}
 * @param {!Array} value Элемент для фильтрации
 * @return {boolean} Возвращает true, если элемент удовлетворяет условиям,
 *     false - в противном случае.
 */
CLogger.prototype.filterByLevel = function(value) {
	return this._levels.indexOf(value[1].toLowerCase()) != -1 ? true : false;
};

/**
 * Удаляет все сохраненные сообщения журнала из памяти.
 * Этот метод бросает событие flush.
 * Обработчики этого события должны выполнять код синхронно, минуя event loop.
 * @param {boolean} opt_dumpLogs  следует ли запустить обоаботку сообщений немедленно
 * при попадании в маршрутизатор журнала
 */
CLogger.prototype.flush = function(opt_dumpLogs) {
	// событие flush обрабатывается в CLogRouter синхронно, минуя event loop,
	// поэтому после отправки события мы можем сразу очистить внутренние данные
	this.emit('flush', opt_dumpLogs);
	this._logs = [];
	this._logCount = 0;
};