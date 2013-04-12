'use strict';

/**
 * @fileoverview CUrlValidator class file
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..'),
	url = require('url');

/**
 * CUrlValidator validates that the attribute value is a valid http or https URL.
 *
 * @constructor
 * @extends {CValidator}
 */
var CUrlValidator = module.exports = function() {
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CUrlValidator, Yiila.CValidator);

/**
 * @type {(!Array|!RegExp)} the regular expression used to validate the attribute value.
 * It can be an instance of RegExp or array (the first element must be an expression, 
 * the second - flags passed to RegExp constructor).
 * The pattern may contain a {schemes} token that will be replaced
 * by a regular expression which represents the {@see validSchemes}.
 */
CUrlValidator.prototype.pattern = ['^{schemes}:\\/\\/(([A-Z0-9][A-Z0-9_-]*)(\\.[A-Z0-9][A-Z0-9_-]*)+)', 'i'];

/**
 * @type {!Array} list of URI schemes which should be considered valid. By default, http and https
 **/
CUrlValidator.prototype.validSchemes = ['http','https'];

/**
 * @type {string} the default URI scheme. If the input doesn't contain the scheme part, the default
 *     scheme will be prepended to it (thus changing the input). Defaults to null, meaning a URL must
 *     contain the scheme part.
 **/
CUrlValidator.prototype.defaultScheme;

/**
 * @type {boolean} следует ли при валидации учитывать IDN. По умолчанию - false, в этом случае
 *     URL адрес, содержащий IDN, будет признан невалидным.
 */
CUrlValidator.prototype.validateIDN=false;
	

/**
 * @type {boolean} whether the attribute value can be null or empty. Defaults to true,
 *     meaning that if the attribute is empty, it is considered valid.
 */
CUrlValidator.prototype.allowEmpty = true;

/**
 * Validates the attribute of the object.
 * If there is any error, the error message is added to the object.
 * @param {!Object} obj the object being validated
 * @param {string} attribute the attribute being validated
 * @override
 */
CUrlValidator.prototype.validateAttribute = function(obj,attribute) {

	var value = obj[attribute], message;
	
	if (this.allowEmpty && this.isEmpty(value))
		return;
		
	if ((value = this.validateValue(value))!==false)
		obj[attribute] = value;
	else
	{
		message = this.message ? this.message : '{attribute} is not a valid URL.';
		this.addError(obj,attribute,message);
	}	
};

/**
 * Validates a static value to see if it is a valid URL.
 * Note that this method does not respect {@see allowEmpty} property.
 * This method is provided so that you can call it directly without going through the model validation rule mechanism.
 * @param {*} value the value to be validated
 * @return {(string|boolean}} false if the the value is not a valid URL, otherwise the possibly 
 *     modified value ({@see defaultScheme})
 */
CUrlValidator.prototype.validateValue = function(value) {
	
	if (typeof value == 'string' && value.length < 2000)  // make sure the length is limited to avoid DOS attacks
	{
		var pattern, source, flags = '', tValue;

		if (this.defaultScheme && value.indexOf('://') < 0)
			value = this.defaultScheme+'://'+value;

		tValue = this.validateIDN ? url.format(url.parse(value)) : value;
			
		if (this.pattern instanceof RegExp) {
			source = this.pattern.source;
			
			if (this.pattern.global)
				flags +='g';
			if (this.pattern.ignoreCase)
				flags +='i';				
			if (this.pattern.multiline)
				flags +='m';
		} else {
			source = this.pattern[0];
			
			if (this.pattern[1])
				flags = this.pattern[1];
		}
		
		if (source.indexOf('{schemes}') >= 0)
			source = source.replace('{schemes}','('+this.validSchemes.join('|')+')');
		
		pattern = new RegExp(source, flags);
		
		if (tValue.match(pattern))
			return value;
	}
	
	return false;
};