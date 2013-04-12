'use strict';

/**
 * @fileoverview Класс CValidator class file
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..'),
	_ = require('underscore');

/**
 * CValidator is the base class for all validators.
 * 
 * @constructor
 * @extends {CComponent}
 */
var CValidator = module.exports = function() {
	return Yiila.CComponent.call(this);
};
Yiila.inherits(CValidator, Yiila.CComponent);

/**
 * @type {Array} list of attributes to be validated.
 */
CValidator.prototype.attributes = null;

/**
 * @type {boolean} whether this validation rule should be skipped when there is already a validation
 *     error for the current attribute. Defaults to false.
 */
CValidator.prototype.skipOnError = false;
	
/**
 * @type {Object} list of scenarios that the validator should be applied.
 *     Each value refers to a scenario name with the same name as its object key.
 */
CValidator.prototype.on = null;

/**
 * @type {Object} list of scenarios that the validator should not be applied to.
 *     Each value refers to a scenario name with the same name as its object key.
 */
CValidator.prototype.except = null;
	
/**
 * @type {?string} the user-defined error message. Different validators may define various
 *     placeholders in the message that are to be replaced with actual values. All validators
 *     recognize "{attribute}" placeholder, which will be replaced with the label of the attribute.
 */
CValidator.prototype.message = null;
	
/**
 * Validates a single attribute.
 * This method should be overridden by child classes.
 * @param {!Object} obj the data object being validated
 * @param {string} attribute the name of the attribute to be validated.
 * @abstract
 * @protected
 */
CValidator.prototype.validateAttribute = function(obj,attribute) {};

/**
 * Validates the specified object.
 * @param {!Object} obj the data object being validated
 * @param {Array=} opt_attributes the list of attributes to be validated.
 *     Defaults to null, meaning every attribute listed in {@see attributes} will be validated.
 */
CValidator.prototype.validate = function(obj,opt_attributes)
{
	var self = this;

	if (opt_attributes)
		opt_attributes = _.intersection(this.attributes,opt_attributes);
	else
		opt_attributes = this.attributes  ? this.attributes : [];
	
	opt_attributes.forEach(function(attribute) {
		if (!self.skipOnError || !obj.hasErrors(attribute))
			self.validateAttribute(obj,attribute);
	});
};

/**
 * Returns a value indicating whether the validator applies to the specified scenario.
 * A validator applies to a scenario as long as any of the following conditions is met:
 * <ul>
 * <li>the validator's "except" property does not contains the specified scenario</li>
 * <li>the validator's "on" property is empty</li>
 * <li>the validator's "on" property contains the specified scenario</li>
 * </ul>
 * @param {?string} scenario scenario name
 * @return {boolean} whether the validator applies to the specified scenario.
 */
CValidator.prototype.applyTo = function(scenario)
{			
	if (this.except && this.except.hasOwnProperty(scenario))
		return false;

	return !this.on || this.on.hasOwnProperty(scenario);
};

/**
 * Adds an error about the specified attribute to the active record.
 * This is a helper method that performs message selection and internationalization.
 * @param {!Object} obj the data object being validated
 * @param {string} attribute the attribute being validated
 * @param {string} message the error message
 * @param {Object=} opt_params values for the placeholders in the error message
 * @protected
 */
CValidator.prototype.addError = function(obj,attribute,message,opt_params)
{
	if (typeof opt_params !== 'object')
		opt_params = {};
	
	opt_params['{attribute}']=obj.getAttributeLabel(attribute);
	obj.addError(attribute,Yiila.t('validator',message, opt_params));
}

/**
 * Checks if the given value is empty.
 * A value is considered empty if it is null, an empty array, or the trimmed result is an empty string.
 * @param {*} value the value to be checked
 * @param {boolean=} opt_trim whether to perform trimming before checking if the string is empty. 
 *     Defaults to false.
 * @return {boolean} boolean whether the value is empty
 * @protected
 */
CValidator.prototype.isEmpty = function(value,opt_trim)
{
	return value===null || (Array.isArray(value) && value.length===0) || value==='' || 
		opt_trim && typeof value == 'string' && value.trim()==='';
};

/**
 * @type {!Object} list of built-in validators
 */
CValidator.builtInValidators = {
	'required':'CRequiredValidator',
	'url':'CUrlValidator',
	'length':'CStringValidator',
	'numerical':'CNumberValidator',
	'boolean':'CBooleanValidator',
	'in':'CRangeValidator',
	'ip': 'CIpValidator'
};

/**
 * Creates a validator object.
 * @param {string} name the name or class of the validator
 * @param {!Object} obj the data object being validated that may contain the inline validation method
 * @param {(!Array|string)} attributes list of attributes to be validated. This can be either an array of
 * the attribute names or a string of comma-separated attribute names.
 * @param {Object=} opt_params initial values to be applied to the validator properties
 * @return {CValidator} the validator
 */
CValidator.createValidator = function(name,obj,attributes,opt_params)
{
	var on, except, validator, className;
	
	if (typeof attributes === 'string')
		attributes = attributes.split(/[\s,]+/);

	if (!opt_params)
		opt_params = {};
	
	if (opt_params.hasOwnProperty('on'))
	{
		if (typeof params['on'] === 'string')
			on =  params['on'].split(/[\s,]+/);
		else
			on = params['on'];
	}
	else
		on = new Array();

	if (opt_params.hasOwnProperty('except'))
	{
		if (typeof params['except'] === 'string')
			except =  params['except'].split(/[\s,]+/);
		else
			except = params['except'];
	}
	else
		except = new Array();

	if (typeof name == 'string')
	{
		if (typeof obj[name] == 'function')
		{	
			validator = new Yiila.CInlineValidator();
			validator.attributes = attributes;
			validator.method = name;

			validator.params = opt_params;
			
			if (opt_params.hasOwnProperty('skipOnError'))
				validator.skipOnError = opt_params['skipOnError'];
				
		} else {
			if (this.builtInValidators[name] !== void 0)
				className=Yiila.import(this.builtInValidators[name],true);
			else
				className=Yiila.import(name,true);
			validator = new Yiila[className];
			
			opt_params['attributes'] = attributes;	
			for (var pname in opt_params)
				validator[pname] = opt_params[pname];
		}
		
	} else {
		validator = new name();
		
		opt_params['attributes'] = attributes;	
		for (var pname in opt_params)
			validator[pname] = opt_params[pname];
	}

	validator.on = !on.length ? null : _.object(on,on);
	validator.except = !except.length ? null : _.object(except,except);

	return validator;
};