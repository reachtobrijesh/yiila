'use strict';
/**
 * @fileoverview Класс CInlineValidator
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..');
	
/**
 * CInlineValidator валидатор, основанный на методе модели, отвечающем за валидацию 
 *
 * @constructor
 * @extends {CValidator}
 */
var CInlineValidator = module.exports = function()
{
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CInlineValidator, Yiila.CValidator);

/**
 * @type {string} имя метода, определенного в классе проверяемой модели
 */
CInlineValidator.prototype.method;
/**
 * @type {Object} дополнительные параметры, которые будут отправлены в метод модели
 */
CInlineValidator.prototype.params;

/**
 * Проверяет указанный объект.
 * @param {!Model} obj Модель, над которой производится проверка.
 * @param {Array} opt_attributes Список атрибутов, которые должны быть проверены.
 *     Если параметр не передан или = null, будут проверены все атрибуты,
 *     указанные в {@see attributes}.
 * @override
 */
CInlineValidator.prototype.validateAttribute = function(obj,attribute) 
{
	var method = this.method;
	obj[method](attribute,this.params);
};