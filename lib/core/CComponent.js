'use strict';

/**
 * @fileoverview Класс CComponent
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..');
var events = require('events');

/**
 * CComponent is the base class for all components.
 *
 * CComponent implements the protocol of defining, using properties and events.
 * All derived classes must return the result of calling the constructor 
 * of the class in their constructors:
 * <pre>
 *     function ChildClass() {
 *         return Yiila.CComponent.call(this);
 *     }
 * </pre>
 * This is due to the implementation of the getter and settter methods through harmony proxy.
 * Thus, if the constructed object of this class and its prototype chain 
 * does not have the property X, it will attempt to call the setX (value) or getX, 
 * if you attempt to create(set) or get the value of the property respectively.
 * 
 * A property is defined by a getter method, and/or a setter method.
 * Properties can be accessed in the way like accessing normal object members.
 * Reading or writing a property will cause the invocation of the corresponding
 * getter or setter method, e.g
 * <pre>
 * vara=component.text;     // equivalent to var a=component.getText();
 * component.text='abc';  // equivalent to component.setText('abc');
 * </pre>
 * The signatures of getter and setter methods are as follows,
 * <pre>
 * // getter, defines a readable property 'text'
 * Component.prototype.getText = function() { ... }
 * // setter, defines a writable property 'text' with $value to be set to the property
 * Component.prototype.setText = function(value) { ... }
 * </pre>
 * @constructor
 * @extends {EventEmitter}
 */
var CComponent = module.exports = function() {
	events.EventEmitter.call(this);
	// @see http://wiki.ecmascript.org/doku.php?id=harmony:reflect_api
	return Proxy(this, {
		get: function(target, name, receiver) {
			if (name in target)
				return target[name];

			var getter = 'get'+name.charAt(0).toUpperCase() + name.slice(1);
			
			if (getter in target && typeof target[getter] == 'function')
				return target[getter].call(target);
		},
		set: function(target, name, value, receiver) {
			if (name in target) {
				target[name] = value;
				return true;
			}
			
			var setter = 'set'+name.charAt(0).toUpperCase() + name.slice(1);
			
			if (setter in target && typeof target[setter] == 'function')
			{
				target[setter].call(target, value);
				return true;
			}
			
			return false;
		}
	});
};
Yiila.inherits(CComponent, events.EventEmitter);

/**
 * @type {boolean}
 * @private
 */
CComponent.prototype._initialized = false;
 
/**
 * Initializes the application component.
 * This method is invoked by application.
 * If you override this method, make sure to call the parent implementation
 * so that the application component can be marked as initialized.
 */
CComponent.prototype.init = function() {
	this._initialized = true;
};

/**
 * Checks if this application component bas been initialized.
 * @return {boolean} whether this application component has been initialized 
 *     (ie, {@see init()} is invoked).
 */
CComponent.prototype.getIsInitialized = function() {
	return this._initialized;
};