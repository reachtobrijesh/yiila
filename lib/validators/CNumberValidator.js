'use strict';

/**
 * @fileoverview Класс CNumberValidator
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..');

/**
 * CNumberValidator проверяет является ли значение атрибута числом
 *
 * @constructor
 * @extends {CValidator}
 */
var CNumberValidator = module.exports = function()
{
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CNumberValidator, Yiila.CValidator);

/**
 * @type {boolean} должно ли быть значение атрибута только целым числом
 * По умолчанию false.
 */
CNumberValidator.prototype.integerOnly = false;

/**
 * @type {boolean} может ли быть значение атрибута пустым или null.
 * По усолчанию true, то есть если значение атрибута пустое, оно считается валидным.
 */
CNumberValidator.prototype.allowEmpty = true;

/**
 * @type {?number} верхний предел числа.
 * Если не установлено или null, считается предел не задан.
 * По умолчанию предел не задан.
 */
CNumberValidator.prototype.max;

/**
 * @type {?number} нижний предел числа.
 * Если не установлено или null, считается предел не задан.
 * По умолчанию предел не задан.
 */
CNumberValidator.prototype.min;

/**
 * @type {?string} текст сообщения о превышении верхнего предела
 */
CNumberValidator.prototype.tooBig;

/**
 * @type {?string} текст сообщения о выходе за нижний предел
 */
CNumberValidator.prototype.tooSmall;

/**
 * @type {!RegExp} регулярное выражение для вычисления целых чисел.
 */
CNumberValidator.prototype.integerPattern=/^\s*[+-]?\d+\s*$/;

/**
 * @type {!RegExp} регулярное выражение для вычисления чисел.
 */
CNumberValidator.prototype.numberPattern=/^\s*[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?\s*$/;

/**
 * Проверяет указанный объект.
 * @param {!Model} obj Модель, над которой производится проверка.
 * @param {Array} opt_attributes Список атрибутов, которые должны быть проверены.
 *     Если параметр не передан или = null, будут проверены все атрибуты,
 *     указанные в {@see attributes}.
 * @override
 */
CNumberValidator.prototype.validateAttribute = function(obj,attribute) {

	var value = obj[attribute], message;
	
	if (this.allowEmpty && this.isEmpty(value))
		return;
	
	if (this.integerOnly) 
	{
		if (!String(value).match(this.integerPattern)) {
			message = this.message ? this.message : '{attribute} must be an integer.';
			this.addError(obj,attribute,message);
		}
		
	} else {
		if(!String(value).match(this.numberPattern))
		{
			message = this.message ? this.message : '{attribute} must be a number.';
			this.addError(obj,attribute,message);
		}
	}
	
	if (this.min && value < this.min)
	{
		message = this.tooSmall ? this.tooSmall : '{attribute} is too small (minimum is {min}).';
		this.addError(obj,attribute,message,{'{min}':this.min});
	}
	
	if (this.max && value > this.max)
	{
		message = this.tooBig ? this.tooBig : '{attribute} is too big (maximum is {max}).';
		this.addError(obj,attribute,message,attribute,{'{max}':this.max});
	}
};