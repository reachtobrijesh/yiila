'use strict';
/**
 * @fileoverview CConsoleApplication class file.
 * @author mik.bulatov@gmail.com
 */
var Yiila = require('..');

//@namespace lib
var lib = {
	path: require('path'),
	fs: require('fs')
};

/**
 * CConsoleApplication represents a console application.
 * 
 * @param {(string|!Object)} the module configuration. It can be either an array or
 *     the path of a JS file returning the configuration object.
 * @constructor
 * @extends {CApplication}
 */
var CConsoleApplication = module.exports = function(opt_config) {
	return Yiila.CApplication.call(this, opt_config);
};
Yiila.inherits(CConsoleApplication, Yiila.CApplication);

/**
 * @type {Object} list of all available commands (command name=>command configuration).
 * Each command configuration can be either a string or an array.
 * If the former, the string should be the class name.
 * If the latter, the array must contain a 'class' element which specifies
 * the command's class name or {@see YiiBase.getPathOfAlias class path alias}.
 * The rest name-value pairs in the array are used to initialize
 * the corresponding command properties. For example,
 * <pre>
 * {
 *   'email': {
 *      'class':'path.to.Mailer',
 *      'interval':3600,
 *   },
 *   'log':'path/to/LoggerCommand.js',
 * }
 * </pre>
 */
CConsoleApplication.prototype.commandMap = {};

/**
 * @private
 */
CConsoleApplication.prototype._commandPath = null;

/**
 * @private
 */
CConsoleApplication.prototype._runner = null;

/**
 * Initializes the application by creating the command runner.
 */
CConsoleApplication.prototype.init = function() {
	CConsoleApplication.__superClass__.init.call(this);
	this._runner = this.createCommandRunner();
	this._runner.commands = this.commandMap;
	this._runner.addCommands(this.getCommandPath());
};

/**
 * Processes the user request.
 * This method uses a console command runner to handle the particular user command.
 */
CConsoleApplication.prototype.processRequest = function() {
	var exitCode = this._runner.run(process.argv.slice(1));
	if (typeof exitCode == 'number')
		this.end(exitCode);
};

/**
 * Creates the command runner instance.
 * @return {Object} the command runner (CConsoleCommandRunner)
 */
CConsoleApplication.prototype.createCommandRunner = function() {
	return new Yiila.CConsoleCommandRunner;
};

/**
 * @return {string} the directory that contains the command classes. Defaults to 'commands'.
 */
CConsoleApplication.prototype.getCommandPath = function() {
	var applicationCommandPath = lib.path.resolve(this.getBasePath(), 'commands');
	if (!this._commandPath && lib.fs.existsSync(applicationCommandPath))
		this.setCommandPath(applicationCommandPath);
	return this._commandPath;
};

/**
 * @param {string} value the directory that contains the command classes.
 * @throws {Error} if the directory is invalid
 */
CConsoleApplication.prototype.setCommandPath = function(value) {
	var stat = null, path = lib.path.resolve(this.getBasePath(), value);
	
	try {
		stat = lib.fs.lstatSync(path);
	} catch (e) {}
	
	if (!stat || !stat.isDirectory())
		throw new Error(Yiila.t('yiila','The command path "%s" is not a valid directory.',value));
	
	this._commandPath = path;
};

/**
 * Returns the command runner.
 * @return {Object} the command runner (CConsoleCommandRunner).
 */
CConsoleApplication.prototype.getCommandRunner = function() {
	return this._runner;
};