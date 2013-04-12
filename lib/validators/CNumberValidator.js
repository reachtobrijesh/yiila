'use strict';

/**
 * @fileoverview CNumberValidator class file
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..');

/**
 * CNumberValidator validates that the attribute value is a number.
 *
 * @constructor
 * @extends {CValidator}
 */
var CNumberValidator = module.exports = function() {
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CNumberValidator, Yiila.CValidator);

/**
 * @type {boolean} whether the attribute value can only be an integer. Defaults to false.
 */
CNumberValidator.prototype.integerOnly = false;

/**
 * @type {boolean} whether the attribute value can be null or empty. Defaults to true,
 *     meaning that if the attribute is empty, it is considered valid.
 */
CNumberValidator.prototype.allowEmpty = true;

/**
 * @type {?number} upper limit of the number. Defaults to null, meaning no upper limit.
 */
CNumberValidator.prototype.max = null;

/**
 * @type {?number} lower limit of the number. Defaults to null, meaning no lower limit.
 */
CNumberValidator.prototype.min = null;

/**
 * @type {?string} user-defined error message used when the value is too big.
 */
CNumberValidator.prototype.tooBig;

/**
 * @type {?string} user-defined error message used when the value is too small.
 */
CNumberValidator.prototype.tooSmall;

/**
 * @type {!RegExp} the regular expression for matching integers.
 */
CNumberValidator.prototype.integerPattern=/^\s*[+-]?\d+\s*$/;

/**
 * @type {!RegExp} string the regular expression for matching numbers.
 */
CNumberValidator.prototype.numberPattern=/^\s*[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?\s*$/;

/**
 * Validates the attribute of the object.
 * If there is any error, the error message is added to the object.
 * @param {!Object} obj the object being validated
 * @param {string} attribute the attribute being validated
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