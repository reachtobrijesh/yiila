'use strict';
/**
 * @fileoverview CApplication class file.
 * @author mik.bulatov@gmail.com
 */
var Yiila = require('..');

// @namespace lib
var lib = {
	crypto: require('crypto'),
	path: require('path'),
	fs: require('fs')
};

/**
 * CApplication is the base class for all application classes.
 * It manages a set of application components that
 * provide specific functionalities to the whole application.
 * 
 * @param {(string|!Object)} the module configuration. It can be either an array or
 *     the path of a JS file returning the configuration object.
 * @constructor
 * @extends {CComponent}
 */
var CApplication = module.exports = function(opt_config) {

	var __this__ = Yiila.CComponent.call(this);
	
	Yiila.setApplication(__this__);
	
	if (typeof opt_config === 'string')
		opt_config = require(lib.path.resolve(process.cwd(), opt_config));

	// set basePath at early as possible to avoid trouble
	if (opt_config && opt_config['basePath'] !== void 0) {
		__this__.setBasePath(config['basePath']);
		delete config['basePath'];
	} else
		__this__.setBasePath(process.cwd());
	
	Yiila.setPathOfAlias('application',this.getBasePath());
	
	__this__.configure(opt_config);
	__this__.preloadComponents();
	__this__.init();
	
	return __this__;
};
Yiila.inherits(CApplication, Yiila.CComponent);

/**
 * @type {string} the application name. Defaults to 'My Application'.
 */
CApplication.prototype.name = 'My Application';

/**
 * @type {string} path to sendmail
 */
CApplication.prototype.sendmail = 'sendmail';

/**
 * @type {!Array} the IDs of the application components that should be preloaded.
 */
CApplication.prototype.preload = [];

/**
 * @type {?string}
 * @private
 */
CApplication.prototype._id = null;

/**
 * @type {?string}
 * @private
 */
CApplication.prototype._basePath = null;

/**
 * @type {Object}
 * @private
 */
CApplication.prototype._params = null;

/**
 * @type {?string}
 * @private
 */
CApplication.prototype._runtimePath = null;

/**
 * @type {!Object}
 * @private
 */
CApplication.prototype._components = {};

/**
 * @type {!Object}
 * @private
 */
CApplication.prototype._componentConfig = {};

/**
 * @type {!Object}
 * @private
 */
CApplication.prototype._processHandlers = {};

/**
 * Returns the root path of the application.
 * @return {string} the root directory of the application.
 *     Default to directory of your executable script
 */
CApplication.prototype.getBasePath = function() {
	return this._basePath;
};

/**
 * Sets the root directory of the application.
 * This method can only be invoked at the begin of the constructor.
 * @param {string} path the root directory of the application.
 * @throws Error if the directory does not exist.
 */
CApplication.prototype.setBasePath = function(path) {
	var stat = null;
	
	this._basePath = lib.path.resolve(process.cwd(), path);
	
	try {
		stat = lib.fs.lstatSync(this._basePath);
	} catch (e) {}
	
	if (!stat || !stat.isDirectory())
		throw new Error(Yiila.t('core','Application base path "{path}" is not a valid directory.',
			{'{path}':path}));
};

/**
 * Returns the unique identifier for the application.
 * @return {string} the unique identifier for the application.
 */
CApplication.prototype.getId = function() {
	if (this._id!==null)
		return this._id;
	
	var md5sum = lib.crypto.createHash('md5');
	md5sum.update(this.getBasePath()+this.name);
	return md5sum.digest('hex');
};

/**
 * Sets the unique identifier for the application.
 * @param {string} id the unique identifier for the application.
 */
CApplication.prototype.setId = function(id) {
	this._id=id;
};

/**
 * Returns the directory that stores runtime files.
 * @return {string} the directory that stores runtime files. Defaults to 'runtime' subdirectory.
 */
CApplication.prototype.getRuntimePath = function() {
	if (!this._runtimePath)
		this.setRuntimePath(lib.path.join(this.getBasePath(),'runtime'));
	
	return this._runtimePath;
};

/**
 * Sets the directory that stores runtime files.
 * @param {string} path the directory that stores runtime files.
 * @throws Error if the directory does not exist
 */
CApplication.prototype.setRuntimePath = function(path) {
	var stat = null;
	var runtimePath = lib.path.resolve(this.getBasePath(), path);
	
	try {
		stat = lib.fs.lstatSync(runtimePath);
	} catch (e) {}
	
	if (!stat || !stat.isDirectory())
		throw new Error(Yiila.t('core','Application runtime path "{path}" is not valid. Please make sure it is a directory writable by the Web server process.',
			{'{path}':path}));
	
	this._runtimePath=runtimePath;
};

/**
 * Configures the module with the specified configuration.
 * @param {!Object} config the configuration array
 */
CApplication.prototype.configure = function(config) {
	if (config) {
		for (var key in config) {
			this[key] = config[key];
		}
	}
};

/**
 * Runs the application.
 * Derived classes usually overrides this
 * method to do more application-specific tasks.
 * Remember to call the parent implementation so that static application components are loaded.
 */
CApplication.prototype.run = function(){
	this._addHandler('SIGHUP',function () {process.exit(1);});
	this._addHandler('SIGINT',function() {process.exit(2);});
	this._addHandler('SIGTERM',function() {process.exit(15);});
	this._addHandler('uncaughtException',function(error) {
		Yiila.log(error.stack, Yiila.CLogger.LEVEL_ERROR, 'yiila.exception.uncaught');
		console.error(error.stack);
		process.exit(6);
	});
	this._addHandler('exit',this.onEnd.bind(this));
	
	Yiila.trace('Application started');
	this.processRequest();
};

/**
 * Internal
 * @param {string} event
 * @param {Function} handler
 * @protected
 */
CApplication.prototype._addHandler = function(event, handler) {
	this._processHandlers[event] = handler;
	process.on(event, handler);
};

/**
 * Internal
 */
CApplication.prototype.dispose = function() {
	Yiila.getLogger().flush();
	for (var event in this._processHandlers) {
		process.removeListener(event, this._processHandlers[event]);
	}
	this._processHandlers = {};
	this.removeAllListeners();
};

/**
 * Processes the request.
 * This is the place where the actual request processing work is done.
 * Derived classes should override this method.
 */
CApplication.prototype.processRequest = function(){};

/**
 * Sets the additional components that are used in the application.
 * @param {Array} aliases list of paths to be imported to include additional components
 */
CApplication.prototype.setImport = function(aliases) {
	if (Array.isArray(aliases)) {
		var len = aliases.length;
		for (var i = 0; i < len; i++) {
			Yiila.import(aliases[i]);
		}
	}
};

/**
 * Returns the cache component.
 * @return {CCache} the cache application component. Null if the component is not enabled.
 */
CApplication.prototype.getCache = function() {
	return this.getComponent('cache');
};

/**
 * Puts a component under the management of the application.
 * The component will be initialized by calling its {@see CComponent.init()}
 * method if it has not done so.
 * @param {string} id component ID
 * @param {Object|CComponent} component application component
 * (either configuration object or instance). If this parameter is null,
 * component will be unloaded from the module.
 * @param {boolean=} opt_merge whether to merge the new component configuration
 * with the existing one. Defaults to true, meaning the previously registered
 * component configuration with the same ID will be merged with the new configuration.
 * If set to false, the existing configuration will be replaced completely.
 */
CApplication.prototype.setComponent = function(id,component,opt_merge) {
	if (component===null && this._components[id] !== void 0) {
		delete this._components[id];
		return;
	} else if(component instanceof Yiila.CComponent) {
		this._components[id] = component;

		if (!component.getIsInitialized())
			component.init();

		return;
	} else if(this._components[id] !== void 0) {
		if (component['class'] !== void 0 && Yiila.getClassName(this._components[id])!==component['class']) {
			delete this._components[id];
			this._componentConfig[id] = component; //we should ignore merge here
			return;
		}

		for (var key in component) {
			if (key!=='class')
				this._components[id][key] = component[key];
		}
	} else if (this._componentConfig[id] !== void 0
		&& 'class' in this._componentConfig[id] && 'class' in component
		&& this._componentConfig[id]['class'] !== component['class'])
	{
		this._componentConfig[id] = component; //we should ignore merge here
		return;
	}

	if (typeof opt_merge != 'boolean')
		opt_merge = true;
		
	if (this._componentConfig[id] !== void 0 && opt_merge)
		this._componentConfig[id] = Yiila.extend(this._componentConfig[id],component);
	else
		this._componentConfig[id] = component;
};

/**
 * Retrieves the named application component.
 * @param {string} id application component ID (case-sensitive)
 * @param {boolean=} opt_createIfNull whether to create the component if it doesn't exist yet.
 * @return CComponent the application component instance, null if the application component 
 *     is disabled or does not exist.
 */
CApplication.prototype.getComponent = function(id,opt_createIfNull) {
	if (typeof opt_createIfNull !== 'boolean')
		opt_createIfNull = true;
	
	if (this._components[id] !== void 0)
	{
		return this._components[id];
	} else if(this._componentConfig[id] !== void 0 && opt_createIfNull)
	{
		var config = Yiila.clone(this._componentConfig[id]);
		if (!config['enabled'] !== void 0 || config['enabled'])
		{
			delete config['enabled'];
			var component = Yiila.createComponent(config);
			component.init();
			return this._components[id] = component;
		}
	}
	
	return null;
};

/**
 * Sets the application components.
 *
 * When a configuration is used to specify a component, it should consist of
 * the component's initial property values (name-value pairs). Additionally,
 * a component can be enabled (default) or disabled by specifying the 'enabled' value
 * in the configuration.
 *
 * If a configuration is specified with an ID that is the same as an existing
 * component or configuration, the existing one will be replaced silently.
 *
 * The following is the configuration for two components:
 * <pre>
 * {
 *     'db': {
 *         'class': 'CDbConnection',
 *         'connectionString': 'sqlite:path/to/file.db'
 *     },
 *     'cache': {
 *         'class': 'CDbCache',
 *         'connectionID': 'db'
 *     }
 * }
 * </pre>
 * @param {!Object} components application components(id=>component configuration or instances)
 * @param {boolean=} opt_merge whether to merge the new component configuration with the existing one.
 * Defaults to true, meaning the previously registered component configuration of the same ID
 * will be merged with the new configuration. If false, the existing configuration will be replaced completely.
 */
CApplication.prototype.setComponents = function(components,opt_merge) {
	if (typeof opt_merge != 'boolean')
		opt_merge = true;
	
	for (var id in components)
		this.setComponent(id,components[id],opt_merge);
};

/**
 * Loads static application components.
 * @protected
 */
CApplication.prototype.preloadComponents = function() {
	var len = this.preload.length;
	for (var i = 0; i < len; i++) {
		this.getComponent(this.preload[i]);
	}	
};

/**
 * Returns user-defined parameters.
 * @return {!Object} the list of user-defined parameters
 */
CApplication.prototype.getParams = function() {
	if (this._params)
		return this._params;

	this._params = {};
	return this._params;
};

/**
 * Sets user-defined parameters.
 * @param {!Object} value user-defined parameters. This should be in name-value pairs.
 */
CApplication.prototype.setParams = function(value) {
	var params=this.getParams();
	for (var key in value)
		params[key] = value[key];
};

/**
 * Terminates the application.
 * @param {number=} opt_code exit status (value 0 means normal exit while other values mean abnormal exit).
 */
CApplication.prototype.end = function(opt_code) {
	process.exit(opt_code || 0);
};

/**
 * This method is called before the end of the application.
 * Here you can perform the necessary operations to
 * complete the application correctly.
 */
CApplication.prototype.onEnd = function() {
	Yiila.trace('Application closed');
	this.emit('end');
};