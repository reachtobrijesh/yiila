'use strict';
/**
 * @fileoverview Класс CEmailValidator
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..');

/**
 * CEmailValidator проверяет является ли значение атрибута коррекктным email адресом.
 * @constructor
 * @extends {CValidator}
 */
var CEmailValidator = module.exports = function()
{
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CEmailValidator, Yiila.CValidator);

/**
 * @type {!RegExp|string} регулярое выражение для проверки корректности адреса
 * @see http://www.regular-expressions.info/email.html
 */
CEmailValidator.prototype.pattern = '^[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$';
/**
 * @type {!RegExp|string} регулярное выражение для проверки адресов, содержащих имя владельца адреса
 * Это свойство используется только в том случае, если {@see allowName} имеет значени true.
 * @see allowName
 */
CEmailValidator.prototype.fullPattern='^[^@]*<[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?>$';
/**
 * @type {boolean} следует ли разрешить возможность наличия имени в адресе. (Например, "Qiang Xue <qiang.xue@gmail.com>").
 *     По умолчанию - false.
 * @see fullPattern
 */
CEmailValidator.prototype.allowName=false;
/**
 * @type {boolean} может ли быть значение атрибута пустым. По умолчанию true,
 *     то есть пустые значения признаются корректными.
 */
CEmailValidator.prototype.allowEmpty=true;

/**
 * Проверяет указанный объект.
 * @param {!Model} obj Модель, над которой производится проверка.
 * @param {Array} opt_attributes Список атрибутов, которые должны быть проверены.
 *     Если параметр не передан или = null, будут проверены все атрибуты,
 *     указанные в {@see attributes}.
 * @override
 */
CEmailValidator.prototype.validateAttribute = function(obj,attribute) 
{
	var value = obj[attribute];
		
	if (this.allowEmpty && this.isEmpty(value))
		return;
		
	if (!this.strict && value != this.trueValue && value != this.falseValue
		|| this.strict && value !== this.trueValue && value !== this.falseValue)
	{
		var message = this.message ? this.message : '{attribute} must be either {true} or {false}.';
		this.addError(obj,attribute, message, {'{true}': this.trueValue,'{false}': this.falseValue});
	}
	
	if (this.allowEmpty && this.isEmpty($value))
		return;
	
	if (this.validateValue(value))
	{
		var message = this.message ? this.message : '{attribute} is not a valid email address.';
		this.addError(obj,attribute,message);
	}
};

/**
 * Проверяет корректность адреса.
 * Этот метод может быть использован без модели, но в этом случае он не учитывает свойство {@see allowEmpty}.
 * @param {string} value Значение которое необходимо проверить
 * @return {boolean} Является ли переданное значение корректным email адресом
 */
CEmailValidator.prototype.validateValue = function(value)
{
	// make sure string length is limited to avoid DOS attacks
	return typeof value == 'string' && value.length<=254 && (value.match(this.pattern) || this.allowName && value.match(this.fullPattern));
}