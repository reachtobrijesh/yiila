'use strict';

/**
 * @fileoverview Класс CRangeValidator
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..');

/**
 * CRangeValidator проверяет значение атрибута на соответствие разрешенному
 * списку значений. Вы можете инвертировать логику проверки. {@see not}
 *
 * Помните, что проверка проходит в strict режиме, то есть атрибут
 * проверяется не только по значению, но и по типу.
 *
 * @constructor
 * @extends {CValidator}
 */
var CRangeValidator = module.exports = function()
{
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CRangeValidator, Yiila.CValidator);

/**
 * @type {!Array} список значений, которые считаются валидными(инвалидными) для атрибута
 */
CRangeValidator.prototype.range;

/**
 * @type {boolean} нужно ли инвертировать логику. По умолчанию - false.
 * Если установлено true, значение атрибута НЕ должно присутствовать в списке {@see range}.
 **/
CRangeValidator.prototype.not = false;
 	
/**
 * @type {boolean} может ли быть значение атрибута пустым или null. 
 *     По умолчанию true (означает, что если значение пустое, оно валидно)
 */
CRangeValidator.prototype.allowEmpty = true;

/**
 * Проверяет указанный объект.
 * @param {!Model} obj Модель, над которой производится проверка.
 * @param {Array} opt_attributes Список атрибутов, которые должны быть проверены.
 *     Если параметр не передан или = null, будут проверены все атрибуты,
 *     указанные в {@see attributes}.
 * @override
 */
CRangeValidator.prototype.validateAttribute = function(obj,attribute) 
{	
	var value = obj[attribute], message;
	
	if (this.allowEmpty && this.isEmpty(value))
		return;
		
	if (!Array.isArray(this.range))
		throw new Error('The "range" property must be specified with a list of values.');
	
	if (!this.not && !this.range.indexOf(value))
	{
		message = this.message ? this.message : '{attribute} is not in the list.';
		this.addError(obj,attribute,message);
	}
	else if(this.not && this.range.indexOf(value))
	{
		message = this.message ? this.message : '{attribute} is in the list.';
		this.addError(obj,attribute,message);
	}
};