'use strict';
/**
 * @fileoverview CModel class file
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..');

//@namespace lib
var lib = {
	usc: require('underscore'),
	uscs: require('underscore.string')
};

/**
 * CModel is the base class providing the common features needed by data model objects.
 * CModel defines the basic framework for data models that need to be validated.
 * 
 * @constructor
 */
var CModel = module.exports = function() {};

/**
 * @type {Object}
 * @private
 */
CModel.prototype._errors = {};

/**
 * @private
 */
CModel.prototype._validators = null;

/**
 * @type {string}
 * @private
 */
CModel.prototype._scenario = '';

/**
 * Returns the list of attribute names of the model.
 * @return {!Array.<string>} list of attribute names.
 */
CModel.prototype.attributeNames = function() { return [];};

/**
 * Returns the validation rules for attributes.
 *
 * This method should be overridden to declare validation rules.
 * Each rule is an array with the following structure:
 * <pre>
 * {'attributes':'список атрибутов', 'validator': валидатор, 'on':'имя сценария', ...параметры валидатора...)
 * </pre>
 * where
 * <ul>
 * <li>attribute list: specifies the attributes (separated by commas) to be validated;</li>
 * <li>validator name: specifies the validator to be used. It can be the name of a model class
 *   method, the name of a built-in validator.
 *   A validation method must have the following signature:
 * <pre>
 * // $params refers to validation parameters given in the rule
 * Model.prototype.validatorName = function(attribute,params)
 * </pre>
 *   A built-in validator refers to one of the validators declared in {@see CValidator.builtInValidators}.
 * </li>
 * <li>on: this specifies the scenarios when the validation rule should be performed.
 *   Separate different scenarios with commas. If this option is not set, the rule
 *   will be applied in any scenario that is not listed in "except". Please see {@see scenario} 
 *   for more details about this option.</li>
 * <li>except: this specifies the scenarios when the validation rule should not be performed.
 *   Separate different scenarios with commas. Please see {@see scenario} for more details 
 *   about this option.</li>
 * <li>additional parameters are used to initialize the corresponding validator properties.
 *   Please refer to individal validator class API for possible properties.</li>
 * </ul>
 *
 * The following are some examples:
 * <pre>
 * [
 *     {'attributes': 'username', 'validator': 'length', 'min'=>3, 'max'=>12},
 *     {'attributes': 'username', 'validator': validatorUsername}
 * ]
 * </pre>
 *
 * Note, in order to inherit rules defined in the parent class, a child class needs to
 * merge the parent rules with child rules using functions like array_merge().
 *
 * @return {Array.<!Object>} validation rules to be applied when {@see validate()} is called.
 * @see scenario
 */
CModel.prototype.rules = function(){
	return [];
};

/**
 * Returns the attribute labels.
 * Attribute labels are mainly used in error messages of validation.
 * By default an attribute label is generated using {@see generateAttributeLabel}.
 * This method allows you to explicitly specify attribute labels.
 *
 * Note, in order to inherit labels defined in the parent class, a child class needs to
 * merge the parent labels with child labels using functions like array_merge().
 *
 * @return {!Object} attribute labels (name=>label)
 * @see generateAttributeLabel
 */
CModel.prototype.attributeLabels = function(){
	return {};
};

/**
 * Performs the validation.
 *
 * This method executes the validation rules as declared in {@see rules}.
 * Only the rules applicable to the current {@see scenario} will be executed.
 * A rule is considered applicable to a scenario if its 'on' option is not set
 * or contains the scenario.
 *
 * Errors found during the validation can be retrieved via {@see getErrors}.
 *
 * @param {Array.<string>} opt_attributes list of attributes that should be validated. Defaults to null,
 * meaning any attribute listed in the applicable validation rules should be
 * validated. If this parameter is given as a list of attributes, only
 * the listed attributes will be validated.
 * @param {boolean=} opt_clearErrors whether to call {@see clearErrors} before performing validation
 * @return {boolean} whether the validation is successful without any error.
 */
CModel.prototype.validate = function(opt_attributes, opt_clearErrors) {
	if (typeof opt_clearErrors != 'boolean' || opt_clearErrors)
		this.clearErrors();

	var validators = this.getValidators(), len = validators.length;

	for (var i = 0; i < len; i++) {
		validators[i].validate(this,opt_attributes);
	}
	
	return !this.hasErrors();
};

/**
 * Returns all the validators declared in the model.
 * This method differs from {@see getValidators} in that the latter
 * would only return the validators applicable to the current {@see scenario}.
 * The change made to the returned array will persist and reflect
 * in the result of the next call of {@see getValidators}.
 * @return {!Array} all the validators declared in the model.
 */
CModel.prototype.getValidatorList = function() {
	if (!this._validators)
		this._validators = this.createValidators();
		
	return this._validators;
};

/**
 * Returns the validators applicable to the current {@see scenario}.
 * @param {string=} opt_attribute the name of the attribute whose validators should be returned.
 * If this is null, the validators for ALL attributes in the model will be returned.
 * @return {!Array} the validators applicable to the current {@see scenario}.
 */
CModel.prototype.getValidators = function(opt_attribute) {
	if (!this._validators)
		this._validators = this.createValidators();

	var validators = [], 
		scenario = this.getScenario(),
		len = this._validators.length,
		validator;
	
	for (var i = 0; i < len; i++) {
		validator = this._validators[i];
		if (validator.applyTo(scenario)) {
			if (!opt_attribute || validator.attributes.indexOf(opt_attribute))
				validators.push(validator);
		}
	}
	
	return validators;
};

/**
 * Creates validator objects based on the specification in {@see rules()}.
 * This method is mainly used internally.
 * @return {!Array} validators built based on {@see rules()}.
 * @thorows Error if rule is not valid
 */
CModel.prototype.createValidators = function() {
	var validators = [], rules = this.rules(), len = rules.length, rule;
	
	for (var i = 0; i < len; i++) {
		rule = rules[i];
		if (rule['attributes'] !== void 0 && rule['validator'] !== void 0) {
			validators.push(
				Yiila.CValidator.createValidator(
					rule['validator'],
					this,
					rule['attributes'],
					lib.usc.omit(rule, 'attributes', 'validator')
				)
			);
		} else
			throw Error('CModel has an invalid validation rule. The rule must specify attributes to be validated and the validator name.');
	}
	
	return validators;
};

/**
 * Returns a value indicating whether there is any validation error.
 * @param {string=} opt_attribute attribute name. Use null to check all attributes.
 * @return {boolean} whether there is any error.
 */
CModel.prototype.hasErrors = function(opt_attribute) {
	if (!opt_attribute)
		return lib.usc.isEmpty(this._errors) ? false : true;

	return this._errors[opt_attribute] !== void 0 ? true : false;
};

/**
 * Returns the errors for all attribute or a single attribute.
 * @param {string=} opt_attribute attribute name. Use null to retrieve errors for all attributes.
 * @return {!Array|!Object} errors for all attributes or the specified attribute. 
 *     Empty array is returned if no error.
 */
CModel.prototype.getErrors = function(opt_attribute) {
	if (!opt_attribute)
		return this._errors;

	return this._errors[opt_attribute] !== void 0 ? this._errors[opt_attribute] : [];
};

/**
 * Returns the first error of the specified attribute.
 * @param {string} attribute attribute name.
 * @return {?string} the error message. Null is returned if no error.
 */
CModel.prototype.getError = function(attribute) {
	return this._errors[attribute] ? this._errors[attribute][0] : null;
};

/**
 * Adds a new error to the specified attribute.
 * @param {string} attribute attribute name
 * @param {string} error new error message
 */
CModel.prototype.addError = function(attribute,error) {
	if (!this._errors[attribute])
		this._errors[attribute] = [];
		 
	this._errors[attribute].push(error);
};

/**
 * Adds a list of errors.
 * @param {!Object} errors a list of errors. The array keys must be attribute names.
 * The array values should be error messages. If an attribute has multiple errors,
 * these errors must be given in terms of an array.
 * You may use the result of {@see getErrors()} as the value for this parameter.
 */
CModel.prototype.addErrors = function(errors) {
	var errs, len;
	 
	for (var attribute in errors)
	{
		if (typeof errors[attribute] === 'string')
		{
			this.addError(attribute, errors[attribute]);
		} else {
			errs = errors[attribute];
			len = errs.length;

			for (var i = 0; i < len; i++) {
				this.addError(attribute, errs[i]);
			}
		}	
	}
};

/**
 * Removes errors for all attributes or a single attribute.
 * @param {string=} opt_attribute attribute name. Use null to remove errors for all attribute.
 */
CModel.prototype.clearErrors = function(opt_attribute) {
	if (!opt_attribute)
		this._errors = {};
	else
		delete this._errors[attribute]															;
};

/**
 * Returns all attribute values.
 * @param {Array=} opt_names list of attributes whose value needs to be returned.
 * Defaults to null, meaning all attributes as listed in {@see attributeNames} will be returned.
 * If it is an array, only the attributes in the array will be returned.
 * @return {!Object} attribute values (name=>value).
 */
CModel.prototype.getAttributes = function(opt_names) {
	var values = {},
		attrNames = this.attributeNames(),
		len = attrNames.length,
		name;
	
	for (var i = 0; i < len; i++) {
		name = attrNames[i]; 
		values[name] = this[name] !== void 0 ? this[name] : null;
	}
	
	if (opt_names)
	{
		var values2 = {};
		len = opt_names.length;
		for (var i = 0; i < len; i++) {
			name = opt_names[i];
			values2[name] = values[name] !== void 0 ? values[name] : null;
		}

		return values2;
	}
	
	return values;
};

/**
 * Returns the text label for the specified attribute.
 * @param {string} attribute the attribute name
 * @return {string} the attribute label
 * @see generateAttributeLabel
 * @see attributeLabels
 */
CModel.prototype.getAttributeLabel = function(attribute) {
	var labels = this.attributeLabels();
	
	if (labels[attribute] !== void 0)
		return labels[attribute];

	return this.generateAttributeLabel(attribute);
};

/**
 * Sets the attribute values in a massive way.
 * @param {!Object} values attribute values (name=>value) to be set.
 * @see attributeNames
 */
CModel.prototype.setAttributes = function(values) {
	if (typeof values !== 'object')
		return;
	
	var attributes = this.attributeNames();	
	attributes = lib.usc.object(attributes,lib.usc.range(attributes.length));
	
	for (var name in values) {
		if (attributes[name] !== void 0 && this[name] !== void 0) {
			this[name] = values[name];
		}
	}
};

/**
 * Sets the attributes to be null.
 * @param {Array} opt_names list of attributes to be set null. If this parameter is not given,
 * all attributes as specified by {@see attributeNames} will have their values unset.
 */
CModel.prototype.unsetAttributes = function(opt_names) {
	if (!opt_names)
		opt_names = this.attributeNames();
	
	var len = opt_names.length, name;
	for (var i = 0; i < len; i++) {
		name = opt_names[i];
		if (this[name] !== void 0)
			this[name] = null;
	}
};

/**
 * Returns a value indicating whether the attribute is required.
 * This is determined by checking if the attribute is associated with a
 * {@see CRequiredValidator} validation rule in the current {@see scenario}.
 * @param {string} attribute attribute name
 * @return {boolean} whether the attribute is required
 */
CModel.prototype.isAttributeRequired = function(attribute) {
	var validators = this.getValidators(), length = validators.length;

	for (var i = 0; i < length; i++) {
		if (validators[i] instanceof Yiila.CRequiredValidator)
			return true;
	}
	
	return false;
};

/**
 * Generates a user friendly attribute label.
 * For example, 'department_name' or 'department-name' becomes 'DepartmentName'.
 * @param {string} name the column name
 * @return {string} the attribute label
 */
CModel.prototype.generateAttributeLabel = function(name) {
	return lib.uscs.camelize(name);
};

/**
 * Returns the scenario that this model is used in.
 *
 * Scenario affects how validation is performed and which attributes can
 * be massively assigned.
 *
 * A validation rule will be performed when calling {@see validate()}
 * if its 'except' value does not contain current scenario value while
 * 'on' option is not set or contains the current scenario value.
 *
 * And an attribute can be massively assigned if it is associated with
 * a validation rule for the current scenario.
 *
 * @return {string} the scenario that this model is in.
 */
CModel.prototype.getScenario = function() {
	return this._scenario;
};

/**
 * Sets the scenario for the model.
 * @param {string} value the scenario that this model is in.
 * @see getScenario
 */
CModel.prototype.setScenario = function(value) {
	this._scenario = value;
};