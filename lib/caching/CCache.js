'use strict';
/**
 * @fileoverview CCache class file.
 * @author mik.bulatov@gmail.com
 */
var Yiila = require('..'),
	crypto = require('crypto');

/**
 * CCache is the base class for cache classes with different cache storage implementation.
 *
 * A data item can be stored in cache by calling {@see set} and be retrieved back
 * later by {@see get}. In both operations, a key identifying the data item is required.
 * An expiration time and/or a dependency can also be specified when calling {@see set}.
 * If the data item expires or the dependency changes, calling {@see get} will not
 * return back the data item.
 *
 * Note, by definition, cache does not ensure the existence of a value
 * even if it does not expire. Cache is not meant to be a persistent storage.
 *
 * CCache implements the interface {@see ICache} with the following methods:
 * <ul>
 * <li>{@see get} : retrieve the value with a key (if any) from cache</li>
 * <li>{@see set} : store the value with a key into cache</li>
 * <li>{@see add} : store the value only if cache does not have this key</li>
 * <li>{@see delete} : delete the value with the specified key from cache</li>
 * <li>{@see flush} : delete all values from cache</li>
 * </ul>
 *
 * Child classes must implement the following methods:
 * <ul>
 * <li>{@see getValue}</li>
 * <li>{@see setValue}</li>
 * <li>{@see addValue}</li>
 * <li>{@see deleteValue}</li>
 * <li>{@see getValues} (optional)</li>
 * <li>{@see flushValues} (optional)</li>
 * <li>{@see serializer} (optional)</li>
 * </ul>
 *
 * @constructor
 * @extend {CComponent}
 */
var CCache = module.exports = function() {
	return Yiila.CComponent.call(this);
};
Yiila.inherits(CCache, Yiila.CComponent);

/**
 * @type {?string} a string prefixed to every cache key so that it is unique. Defaults to null which means
 * to use the {@see CApplication.getId()}. If different applications need to access the same
 * pool of cached data, the same prefix should be set for each of the applications explicitly.
 */
CCache.prototype.keyPrefix=null;
/**
 * @type {boolean} whether to md5-hash the cache key for normalization purposes. Defaults to true. Setting this property to false makes sure the cache
 * key will not be tampered when calling the relevant methods {@see get()}, {@see set()}, {@see add()} and {@see delete()}. This is useful if a Yii
 * application as well as an external application need to access the same cache pool (also see description of {@see keyPrefix} regarding this use case).
 * However, without normalization you should make sure the affected cache backend does support the structure (charset, length, etc.) of all the provided
 * cache keys, otherwise there might be unexpected behavior.
 **/
CCache.prototype.hashKey=true;
/**
 * @type {Array|boolean} the functions used to serialize and unserialize cached data. Defaults to null, meaning
 * using JSON serialization. If you want to use some more efficient
 * serializer, you may configure this property with
 * a two-element array. The first element specifies the serialization function, and the second the deserialization
 * function. If this property is set false, data will be directly sent to and retrieved from the underlying
 * cache component without any serialization or deserialization. You should not turn off serialization if
 * you are using {@see CCacheDependency cache dependency}, because it relies on data serialization.
 */
CCache.prototype.serializer=null;

/**
 * Initializes the application component.
 * This method overrides the parent implementation by setting default cache key prefix.
 * @override
 */
CCache.prototype.init = function() {
	CCache.__superClass__.init.call(this);
	
	if (this.keyPrefix===null)
		this.keyPrefix=Yiila.app().getId();
};

/**
 * @param {string} key a key identifying a value to be cached
 * @return {string} a key generated from the provided key which ensures the uniqueness across applications
 * @protected
 */
CCache.prototype.generateUniqueKey = function(key) {
	if (this.hashKey) {
		var md5sum = crypto.createHash('md5');
		md5sum.update(this.keyPrefix+key);
		return md5sum.digest('hex');		
	}
	
	return this.keyPrefix+key;
};

/**
 * Retrieves a value from cache with a specified key.
 * @param {string} id a key identifying the cached value
 * @param {function(Error, *)} callback
 */
CCache.prototype.get = function(id, callback) {
	var self = this;
	this.getValue(this.generateUniqueKey(id), function(err, value) {
		if (!err) {
			if (value===false || self.serializer===false)
				callback(null,value);
			else {		
				if (self.serializer===null)
					value = JSON.parse(value);
				else
					value = self.serializer[1](value);
				
				if (Array.isArray(value) && value.length > 1 && (!(value[1] instanceof Yiila.CCacheDependency) || !value[1].getHasChanged())) {
					Yiila.trace('Serving "'+id+'" from cache','system.caching');
					callback(null,value[0]);
				} else
					callback(null,false);
			}
		} else
			callback(err,null)
	});
};

/**
 * Stores a value identified by a key into cache.
 * If the cache already contains such a key, the existing value and
 * expiration time will be replaced with the new ones.
 *
 * @param {string} id the key identifying the value to be cached
 * @param {*} value the value to be cached
 * @param {number=} opt_expire the number of seconds in which the cached value will expire. 0 means never expire.
 * @param {Object=} opt_dependency dependency of the cached item. If the dependency changes, the item is labeled invalid.
 * @param {function(Error, *)=} opt_callback
 */
CCache.prototype.set = function(id,value,opt_expire,opt_dependency,opt_callback) {
	Yiila.trace('Saving "'+id+'" to cache','system.caching');

	if (opt_dependency && this.serializer !== false)
		opt_dependency.evaluateDependency();

	if (this.serializer === null)
		value = JSON.stringify([value,opt_dependency]);
	else if (this.serializer !== false)
		value = this.serializer[0]([value,opt_dependency]);

	this.setValue(this.generateUniqueKey(id),value,opt_expire || 0,opt_callback || function() {});
};

/**
 * Stores a value identified by a key into cache if the cache does not contain this key.
 * Nothing will be done if the cache already contains the key.
 * 
 * @param {string} id the key identifying the value to be cached
 * @param {*} value the value to be cached
 * @param {number=} opt_expire the number of seconds in which the cached value will expire. 0 means never expire.
 * @param {Object=} opt_dependency dependency of the cached item. If the dependency changes, the item is labeled invalid.
 * @param {function(Error, *)=} opt_callback optional callback function
 */
CCache.prototype.add = function(id,value,opt_expire,opt_dependency,opt_callback) {
	Yiila.trace('Adding "'+id+'" to cache','system.caching');

	if (opt_dependency && this.serializer !== false)
		opt_dependency.evaluateDependency();

	if (this.serializer === null)
		value = JSON.stringify([value,opt_dependency]);
	else if (this.serializer !== false)
		value = this.serializer[0]([value,opt_dependency]);

	return this.addValue(this.generateUniqueKey(id),value,opt_expire || 0,opt_callback || function() {});
};

/**
 * Deletes a value with the specified key from cache
 * @param {string} id the key of the value to be deleted
 * @param {function(Error, *)=} opt_callback optional callback function
 */
CCache.prototype.del = function(id, opt_callback) {
	Yiila.trace('Deleting "'+id+'" from cache','system.caching');
	this.deleteValue(this.generateUniqueKey(id),opt_callback || function() {});
};

/**
 * Retrieves a value from cache with a specified key.
 * This method should be implemented by child classes to retrieve the data
 * from specific cache storage. The uniqueness and dependency are handled
 * in {@see get()} already. So only the implementation of data retrieval
 * is needed.
 * @param {string} key a unique key identifying the cached value
 * @param {function(Error, *)} callback
 * @throws {Error} if this method is not overridden by child classes
 * @protected
 */
CCache.prototype.getValue = function(key,callback) {
	throw new Error(Yiila.t('yiila','Cache class does not support get() functionality.'));
};

/**
 * Stores a value identified by a key in cache.
 * This method should be implemented by child classes to store the data
 * in specific cache storage. The uniqueness and dependency are handled
 * in {@see set()} already. So only the implementation of data storage
 * is needed.
 *
 * @param {string} key the key identifying the value to be cached
 * @param {string} value the value to be cached
 * @param {number} expire the number of seconds in which the cached value will expire. 0 means never expire.
 * @param {function(Error, *)=} callback a function to be executed
 *     The second parameter of the callback function will have true value if key has been saved
 * @throws {Error} if this method is not overridden by child classes
 * @protected
 */
CCache.prototype.setValue = function(key,value,expire,callback) {
	throw new Error(Yiila.t('yiila','Cache class does not support set() functionality.'));
};

/**
 * Stores a value identified by a key into cache if the cache does not contain this key.
 * This method should be implemented by child classes to store the data
 * in specific cache storage. The uniqueness and dependency are handled
 * in {@see add()} already. So only the implementation of data storage
 * is needed.
 *
 * @param {string} key the key identifying the value to be cached
 * @param {string} value the value to be cached
 * @param {number} expire the number of seconds in which the cached value will expire. 0 means never expire.
 * @param {function(Error, *)=} callback a function to be executed
 *     The second parameter of the callback function will have true value if key has been added
 * @throws {Error} if this method is not overridden by child classes
 * @protected
 */
CCache.prototype.addValue = function(key,value,expire,callback) {
	throw new Error(Yiila.t('yiila','Cache class does not support add() functionality.'));
};

/**
 * Deletes a value with the specified key from cache
 * This method should be implemented by child classes to delete the data from actual cache storage.
 * @param {string} key the key of the value to be deleted
 * @param {function(Error, *)} callback a function to be executed
 *     The second parameter of the callback function will have true value if key has been deleted otherwise false
 * @throws {Error} if this method is not overridden by child classes
 * @protected
 */
CCache.prototype.deleteValue = function(key,callback) {
	throw new Error(Yiila.t('yiila','Cache class does not support delete() functionality.'));
};