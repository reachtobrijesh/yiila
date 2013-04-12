'use strict';

/**
 * @fileoverview CInlineValidator class file
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..');
	
/**
 * CInlineValidator represents a validator which is defined as a method in the object being validated.
 *
 * @constructor
 * @extends {CValidator}
 */
var CInlineValidator = module.exports = function() {
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CInlineValidator, Yiila.CValidator);

/**
 * @type {string} the name of the validation method defined in the active record class
 */
CInlineValidator.prototype.method;
/**
 * @type {Object} additional parameters that are passed to the validation method
 */
CInlineValidator.prototype.params;

/**
 * Validates the attribute of the object.
 * If there is any error, the error message is added to the object.
 * @param {!Object} obj the object being validated
 * @param {string} attribute the attribute being validated
 * @override
 */
CInlineValidator.prototype.validateAttribute = function(obj,attribute) {
	var method = this.method;
	obj[method](attribute,this.params);
};