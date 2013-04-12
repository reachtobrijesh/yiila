'use strict';

/**
 * @fileoverview CEmailValidator class file
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..');

/**
 * CEmailValidator validates that the attribute value is a valid email address.
 * 
 * @constructor
 * @extends {CValidator}
 */
var CEmailValidator = module.exports = function() {
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CEmailValidator, Yiila.CValidator);

/**
 * @type {!RegExp|string} the regular expression used to validate the attribute value.
 * @see http://www.regular-expressions.info/email.html
 */
CEmailValidator.prototype.pattern = '^[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$';
/**
 * @type {!RegExp|string} the regular expression used to validate email addresses with the name part.
 * This property is used only when {@see allowName} is true.
 * @see allowName
 */
CEmailValidator.prototype.fullPattern='^[^@]*<[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?>$';
/**
 * @type {boolean} whether to allow name in the email address (e.g. "Qiang Xue <qiang.xue@gmail.com>"). 
 *     Defaults to false.
 * @see fullPattern
 */
CEmailValidator.prototype.allowName=false;
/**
 * @type {boolean} whether the attribute value can be null or empty. Defaults to true,
 *     meaning that if the attribute is empty, it is considered valid.
 */
CEmailValidator.prototype.allowEmpty=true;

/**
 * Validates the attribute of the object.
 * If there is any error, the error message is added to the object.
 * @param {!Object} obj the object being validated
 * @param {string} attribute the attribute being validated
 * @override
 */
CEmailValidator.prototype.validateAttribute = function(obj,attribute) {
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
 * Validates a static value to see if it is a valid email.
 * Note that this method does not respect {@see allowEmpty} property.
 * This method is provided so that you can call it directly without going through the model validation rule mechanism.
 * @param {*} value the value to be validated
 * @return {boolean} whether the value is a valid email
 */
CEmailValidator.prototype.validateValue = function(value) {
	// make sure string length is limited to avoid DOS attacks
	return typeof value == 'string' && value.length<=254 && (value.match(this.pattern) || this.allowName && value.match(this.fullPattern));
};