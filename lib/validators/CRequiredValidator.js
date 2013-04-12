'use strict';

/**
 * @fileoverview CRequiredValidator class file
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..');

/**
 * CRequiredValidator validates that the specified attribute does not have null or empty value.
 *
 * @constructor
 * @extends {CValidator}
 */
var CRequiredValidator = module.exports = function() {
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CRequiredValidator, Yiila.CValidator);

/**
 * @type {*} the desired value that the attribute must have.
 * If this is null, the validator will validate that the specified attribute does not have null or empty value.
 * If this is set as a value that is not null, the validator will validate that
 * the attribute has a value that is the same as this property value.
 * Defaults to null.
 */
CRequiredValidator.prototype.requiredValue;
/**
 * @type {boolean} whether the comparison to {@see requiredValue} is strict.
 * When this is true, the attribute value and type must both match those of {@see requiredValue}.
 * Defaults to false, meaning only the value needs to be matched.
 * This property is only used when {@see requiredValue} is not null.
 */
CRequiredValidator.prototype.strict = false;

/**
 * Validates the attribute of the object.
 * If there is any error, the error message is added to the object.
 * @param {!Object} obj the object being validated
 * @param {string} attribute the attribute being validated
 * @override
 */
CRequiredValidator.prototype.validateAttribute = function(obj,attribute) {
	var value = obj[attribute] ? obj[attribute] : null;
	var message;
	
	if (this.requiredValue)
	{
		if (!this.strict && value != this.requiredValue || this.strict && value !== this.requiredValue)
		{
			message = this.message ? this.message : '{attribute} must be {value}.';
			this.addError(obj,attribute,message,{'{value}':this.requiredValue});
		}
	}
	else if(this.isEmpty(value,true))
	{
		message = this.message ? this.message : '{attribute} cannot be blank.';
		this.addError(obj,attribute,message);
	}
};