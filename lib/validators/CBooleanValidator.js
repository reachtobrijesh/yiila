'use strict';

/**
 * @fileoverview CBooleanValidator class file
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..');

/**
 * CBooleanValidator validates that the attribute value is either {@see trueValue}  or {@see falseValue}.
 * 
 * @constructor
 * @extends {CValidator}
 */
var CBooleanValidator = module.exports = function()
{
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CBooleanValidator,Yiila.CValidator);

/**
 * @type {*} the value representing true status. Defaults to '1'.
 */
CBooleanValidator.prototype.trueValue = '1';

/**
 * @type {*} the value representing false status. Defaults to '0'.
 */
CBooleanValidator.prototype.falseValue = '0';

/**
 * @type {boolean} whether the comparison to {@see trueValue} and {@see falseValue} is strict.
 *     When this is true, the attribute value and type must both match 
 *     those of {@see trueValue} or {@see falseValue}.
 *     Defaults to false, meaning only the value needs to be matched.
 */
CBooleanValidator.prototype.strict = false;

/**
 * @type {boolean} whether the attribute value can be null or empty. Defaults to true,
 *     meaning that if the attribute is empty, it is considered valid.
 */
CBooleanValidator.prototype.allowEmpty = true;

/**
 * Validates the attribute of the object.
 * If there is any error, the error message is added to the object.
 * @param {!Object} obj the object being validated
 * @param {string} attribute the attribute being validated
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