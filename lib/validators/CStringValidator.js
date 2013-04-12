'use strict';

/**
 * @fileoverview CStringValidator class file
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..');

/**
 * CStringValidator validates that the attribute value is of certain length.
 *
 * Note, this validator should only be used with string-typed attributes.
 *
 * @constructor
 * @extends {CValidator}
 */
var CStringValidator = module.exports = function()
{
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CStringValidator, Yiila.CValidator);

/**
 * @type {?number} integer maximum length. Defaults to null, meaning no maximum limit.
 */
CStringValidator.prototype.max = null;
/**
 * @typr {?number} minimum length. Defaults to null, meaning no minimum limit.
 */
CStringValidator.prototype.min = null;
/**
 * @type {?number} exact length. Defaults to null, meaning no exact length limit.
 */
CStringValidator.prototype.is = null;
/**
 * @type {?string} user-defined error message used when the value is too short.
 */
CStringValidator.prototype.tooShort = null;
/**
 * @type {?string} user-defined error message used when the value is too long.
 */
CStringValidator.prototype.tooLong = null;
/**
 * @type {boolean} whether the attribute value can be null or empty. Defaults to true,
 *     meaning that if the attribute is empty, it is considered valid.
 */
CStringValidator.prototype.allowEmpty = true;

/**
 * Validates the attribute of the object.
 * If there is any error, the error message is added to the object.
 * @param {!Object} obj the object being validated
 * @param {string} attribute the attribute being validated
 * @override
 */
CStringValidator.prototype.validateAttribute = function(obj,attribute) {

	var value = obj[attribute], message;
	
	if (this.allowEmpty && this.isEmpty(value))
		return;

	var length = value.length;

	if (this.min && length < this.min)
	{
		message = this.tooShort ? this.tooShort : '{attribute} is too short (minimum is {min} characters).';
		this.addError(obj,attribute,message,{'{min}':this.min});
	}
	if (this.max && length > this.max)
	{
		message = this.tooShort ? this.tooShort : '{attribute} is too long (maximum is {max} characters).';
		this.addError(obj,attribute,message,{'{max}':this.max});
	}
	if (this.is && length !== this.is)
	{
		message=this.tooShort ? this.tooShort : '{attribute} is of the wrong length (should be {length} characters).';
		this.addError(obj,attribute,message,{'{length}':this.is});
	}
};