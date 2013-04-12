'use strict';

/**
 * @fileoverview CRangeValidator class file
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..');

/**
 * CRangeValidator validates that the attribute value is among the list (specified via {@see range}).
 * You may invert the validation logic with help of the {@see not} property.
 *
 * @constructor
 * @extends {CValidator}
 */
var CRangeValidator = module.exports = function() {
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CRangeValidator, Yiila.CValidator);

/**
 * @type {!Array} list of valid values that the attribute value should be among
 */
CRangeValidator.prototype.range;
/**
 * @type {boolean} whether to invert the validation logic. Defaults to false. If set to true,
 *     the attribute value should NOT be among the list of values defined via {@see range}.
 */
CRangeValidator.prototype.not = false;
/**
 * @type {boolean} whether the attribute value can be null or empty. Defaults to true,
 *     meaning that if the attribute is empty, it is considered valid.
 */
CRangeValidator.prototype.allowEmpty = true;

/**
 * Validates the attribute of the object.
 * If there is any error, the error message is added to the object.
 * @param {!Object} obj the object being validated
 * @param {string} attribute the attribute being validated
 * @override
 */
CRangeValidator.prototype.validateAttribute = function(obj,attribute) {	
	var value = obj[attribute], message;
	
	if (this.allowEmpty && this.isEmpty(value))
		return;
		
	if (!Array.isArray(this.range))
		throw new Error('The "range" property must be specified with a list of values.');
	
	if (!this.not && !this.range.indexOf(value))
	{
		message = this.message ? this.message : '{attribute} is not in the list.';
		this.addError(obj,attribute,message);
	}
	else if(this.not && this.range.indexOf(value))
	{
		message = this.message ? this.message : '{attribute} is in the list.';
		this.addError(obj,attribute,message);
	}
};