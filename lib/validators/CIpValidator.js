'use strict';
/**
 * @fileoverview Класс CIpValidator
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..');

/**
 * CIpValidator проверяет является ли значение атрибута корректным IP адресом.
 * 
 * Внимание: в настоящий момент проверяется на соответствие IPv4.
 * 
 * @constructor
 * @extends {CValidator}
 */
var CIpValidator = module.exports = function()
{
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CIpValidator,Yiila.CValidator);

/**
 * @type {boolean} может ли быть значение атрибута пустым или null. 
 *     По умолчанию true (означает, что если значение пустое, оно валидно)
 */
CIpValidator.prototype.allowEmpty = true;

/**
 * Проверяет указанный объект.
 * @param {!Model} obj Модель, над которой производится проверка.
 * @param {Array} opt_attributes Список атрибутов, которые должны быть проверены.
 *     Если параметр не передан или = null, будут проверены все атрибуты,
 *     указанные в {@see attributes}.
 * @override
 */
CIpValidator.prototype.validateAttribute = function(obj,attribute) {
	
	var value = obj[attribute];
	
	if (this.allowEmpty && this.isEmpty(value))
		return;
	
	if (!CIpValidator.isIPv4(value) && !CIpValidator.isIPv6(value)) {
		var message = this.message ? this.message : '{attribute} must be an IP address.';
		this.addError(obj,attribute,message);		
	}
};

/**
 * Static method
 * @param {string} value
 * @return {boolean}
 */
CIpValidator.isIPv4 = function(value) {
	var pattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
	
	if (!pattern.test(value))
		return false;
	
	var parts = value.split('.'), len = parts.length;
		
	for (var i=0; i < len; i++) {
		if (parts[i] > 255)
			return false;
	}
	
	return true;
};

/**
 * Static method
 * @param {string} value
 * @return {boolean}
 */
CIpValidator.isIPv6 = function(value) {
	var pattern = /^::|^::1|^([a-fA-F0-9]{1,4}::?){1,7}([a-fA-F0-9]{1,4})$/;
	
	if (!pattern.test(value))
		return false;
	
	return true;
};