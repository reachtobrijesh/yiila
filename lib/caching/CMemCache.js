'use strict';
/**
 * @fileoverview CMemCache class file.
 * @author mik.bulatov@gmail.com
 */
var Yiila = require('..'),
	Memcached = require('memcached');

/**
 * @constructor
 * @extend {CComponent}
 */
var CMemCache = module.exports = function() {
	return Yiila.CCache.call(this);
};
Yiila.inherits(CMemCache, Yiila.CCache);

/**
 * @type {string} memcache server hostname or IP address
 */
CMemCache.prototype.host='127.0.0.1';

/**
 * @type {number} memcache server port
 */
CMemCache.prototype.port=11211;

/**
 * @type {Object} the Memcache instance
 * @private
 */
CMemCache.prototype._cache=null;

/**
 * @type {!Array} list of memcache server configurations
 */
CMemCache.prototype._servers=[];

/**
 * Initializes this application component.
 * This method is required by the {@link IApplicationComponent} interface.
 * It creates the memcache instance and adds memcache servers.
 * @throws CException if memcache extension is not loaded
 */
CMemCache.prototype.init = function() {
	CMemCache.__superClass__.init.call(this);
	this.getMemCache();
};

/**
 * @throws CException if extension isn't loaded
 * @return Memcache|Memcached the memcache instance (or memcached if {@link useMemcached} is true) used by this component.
 */
CMemCache.prototype.getMemCache = function() {
	if (this._cache!==null)
		return this._cache;

	return this._cache = new Memcached(this.host+':'+this.port);
};

/**
 * Retrieves a value from cache with a specified key.
 * This is the implementation of the method declared in the parent class.
 * @param {string} key a unique key identifying the cached value
 */
CMemCache.prototype.getValue = function(key, callback) {
	this._cache.get(key,callback);
};

/**
 * Stores a value identified by a key in cache.
 * This is the implementation of the method declared in the parent class.
 *
 * @param {string} key the key identifying the value to be cached
 * @param {string} value the value to be cached
 * @param {number} expire the number of seconds in which the cached value will expire. 0 means never expire.
 * @param {function(Error, *)=} callback a function to be executed
 *     The second parameter of the callback function will have true value if key has been saved
 */
CMemCache.prototype.setValue = function(key,value,expire,callback) {
	if (expire>0)
		expire+=Math.round(Date.now() / 1000);
	else
		expire=0;

	this._cache.set(key,value,expire,callback);
};

/**
 * Stores a value identified by a key into cache if the cache does not contain this key.
 * This is the implementation of the method declared in the parent class.
 *
 * @param {string} key the key identifying the value to be cached
 * @param {string} value the value to be cached
 * @param {number} expire the number of seconds in which the cached value will expire. 0 means never expire.
 * @param {function(Error, *)=} callback a function to be executed
 *     The second parameter of the callback function will have true value if key has been added
 */
CMemCache.prototype.addValue = function(key,value,expire,callback) {
	if (expire>0)
		expire+=Math.round(Date.now() / 1000);
	else
		expire=0;

	this._cache.add(key,value,expire,callback);
};

/**
 * Deletes a value with the specified key from cache
 * This is the implementation of the method declared in the parent class.
 * @param {string} key the key of the value to be deleted
 * @param {function(Error, *)=} callback a function to be executed
 *     The second parameter of the callback function will have true value if key has been deleted otherwise false
 */
CMemCache.prototype.deleteValue = function(key,callback){
	this._cache.del(key, callback);
};