'use strict';
/**
 * @fileoverview CCacheDependency class file.
 * @author mik.bulatov@gmail.com
 */
var Yiila = require('..');

/**
 * CCacheDependency is the base class for cache dependency classes.
 *
 * CCacheDependency implements the {@see ICacheDependency} interface.
 * Child classes should override its {@see generateDependentData} for
 * actual dependency checking.
 * 
 * @constructor
 * @extends {CComponent}
 */
var CCacheDependency = module.exports = function() {
	return Yiila.CComponent.call(this);
};
Yiila.inherits(CCacheDependency, Yiila.CComponent);

/**
 * @type {*}
 * @private
 */
CCacheDependency.prototype._data = null;

/**
 * Evaluates the dependency by generating and saving the data related with dependency.
 * This method is invoked by cache before writing data into it.
 */
CCacheDependency.prototype.evaluateDependency = function() {
	this._data=this.generateDependentData();
};

/**
 * @return {boolean} whether the dependency has changed.
 */
CCacheDependency.prototype.getHasChanged = function() {
	return this.generateDependentData()!=this._data;
};

/**
 * @return {*} the data used to determine if dependency has been changed.
 * This data is available after {@see evaluateDependency} is called.
 */
CCacheDependency.prototype.getDependentData = function() {
	return this._data;
};

/**
 * Generates the data needed to determine if dependency has been changed.
 * Derived classes should override this method to generate actual dependent data.
 * @return {*} the data needed to determine if dependency has been changed.
 */
CCacheDependency.prototype.generateDependentData = function() {
	return null;
};