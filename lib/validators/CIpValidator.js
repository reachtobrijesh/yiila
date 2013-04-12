'use strict';

/**
 * @fileoverview CIpValidator class file
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..');

/**
 * CIpValidator validates that the attribute value is a valid IP.
 * 
 * @constructor
 * @extends {CValidator}
 */
var CIpValidator = module.exports = function() {
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CIpValidator,Yiila.CValidator);

/**
 * @type {boolean} whether the attribute value can be null or empty. Defaults to true,
 *     meaning that if the attribute is empty, it is considered valid.
 */
CIpValidator.prototype.allowEmpty = true;

/**
 * Validates the attribute of the object.
 * If there is any error, the error message is added to the object.
 * @param {!Object} obj the object being validated
 * @param {string} attribute the attribute being validated
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
 * Validates a static value to see if it is a valid IPv4.
 * Note that this method does not respect {@see allowEmpty} property.
 * This method is provided so that you can call it directly without going through the model validation rule mechanism.
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
 * Validates a static value to see if it is a valid IPv6.
 * Note that this method does not respect {@see allowEmpty} property.
 * This method is provided so that you can call it directly without going through the model validation rule mechanism.
 * @param {string} value
 * @return {boolean}
 */
CIpValidator.isIPv6 = function(value) {
	var pattern = /^::|^::1|^([a-fA-F0-9]{1,4}::?){1,7}([a-fA-F0-9]{1,4})$/;
	
	if (!pattern.test(value))
		return false;
	
	return true;
};