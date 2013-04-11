'use strict';
/**
 * @fileoverview Класс CBooleanValidator
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..');

/**
 * CBooleanValidator проверяет значение атрибута на соответствие логическому типу данных,
 * то есть соответствует ли значение атрибута либо {@see trueValue} либо {@see falseValue}.
 * @constructor
 * @extends {CValidator}
 */
var CBooleanValidator = module.exports = function()
{
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CBooleanValidator,Yiila.CValidator);

/**
 * @type {*} Значение, соответсвующее статусу true. По умолчанию -  '1'.
 */
CBooleanValidator.prototype.trueValue = '1';

/**
 * @type {*} Значение, соответсвующее статусу false. По умолчанию -  '0'.
 */
CBooleanValidator.prototype.falseValue = '0';

/**
 * @type {boolean} нужно ли использовать строгое сравнение.
 * Когда установлено в true, значение атрибута и тип должны совпадать с
 * {@see trueValue} или {@see falseValue}.
 * По умолчанию - false, то есть сравниваются только значения, без проверки типа.
 */
CBooleanValidator.prototype.strict = false;

/**
 * @type {boolean} может ли быть значение атрибута пустым или null. 
 *     По умолчанию true (означает, что если значение пустое, оно валидно)
 */
CBooleanValidator.prototype.allowEmpty = true;

/**
 * Проверяет указанный объект.
 * @param {!Model} obj Модель, над которой производится проверка.
 * @param {Array} opt_attributes Список атрибутов, которые должны быть проверены.
 *     Если параметр не передан или = null, будут проверены все атрибуты,
 *     указанные в {@see attributes}.
 * @override
 */
CBooleanValidator.prototype.validateAttribute = function(obj,attribute) 
{
	var value = obj[attribute] ? obj[attribute] : null;
		
	if (this.allowEmpty && this.isEmpty(value))
		return;
		
	if (!this.strict && value != this.trueValue && value != this.falseValue
		|| this.strict && value !== this.trueValue && value !== this.falseValue)
	{
		var message = this.message ? this.message : '{attribute} must be either {true} or {false}.';
		this.addError(obj,attribute, message, {'{true}': this.trueValue,'{false}': this.falseValue});
	}
};