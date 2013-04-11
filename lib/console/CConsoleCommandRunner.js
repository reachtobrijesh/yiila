'use strict';
/**
 * @fileoverview CConsoleCommandRunner class file.
 * @author mik.bulatov@gmail.com
 */
var Yiila = require('..');

//@namespace lib
var lib = {
	path: require('path'),
	fs: require('fs')
};

/**
 * CConsoleCommandRunner manages commands and executes the requested command.
 * 
 * @constructor
 * @extends {CComponent}
 */
var CConsoleCommandRunner = module.exports = function() {
	return Yiila.CComponent.call(this);
};
Yiila.inherits(CConsoleCommandRunner, Yiila.CComponent);

/**
 * @type {Object} list of all available commands (command name=>command configuration).
 * Each command configuration can be either a string or an array.
 * If the former, the string should be the class name or
 * {@see Yiila.getPathOfAlias class path alias} of the command.
 * If the latter, the array must contain a 'class' element which specifies
 * the command's class name or {@see Yiila.getPathOfAlias class path alias}.
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
CConsoleCommandRunner.prototype.commands = {};

/** @private */
CConsoleCommandRunner.prototype._scriptName = null;

/**
 * Executes the requested command.
 * @param {Array} args list of user supplied parameters (including the entry script name and the command name).
 * @return integer|null application exit code returned by the command.
 * if null is returned, application will not exit explicitly. See also {@see CConsoleApplication.processRequest()}.
 */
CConsoleCommandRunner.prototype.run = function(args) {	
	this._scriptName = lib.path.basename(args.shift());
	
	var name, command;
	
	name = args.length ? args.shift() : 'help';
	command = this.createCommand(name);
	
	if (!command)
		command = this.createCommand('help');
	
	command.init();
	return command.run(args);
};

/**
 * @return {string} the entry script name
 */
CConsoleCommandRunner.prototype.getScriptName = function() {
	return this._scriptName;
};

/**
 * Searches for commands under the specified directory.
 * @param {string} path the directory containing the command class files.
 * @return {!Object} list of commands (command name=>command class file)
 */
CConsoleCommandRunner.prototype.findCommands = function(path) {
	var names, file, commands = {};
	
	try {
		names = lib.fs.readdirSync(path)
	} catch(e) {
		return commands;
	}
	
	names.forEach(function(name) {
		file = lib.path.join(path,name);

		if (name.length > 10 && name.substr(name.length-10) == 'Command.js')
			commands[name.substr(0, name.length-10).toLowerCase()] = file	
	});
	
	return commands;
}

/**
 * Adds commands from the specified command path.
 * If a command already exists, the new one will be ignored.
 * @param {string} path the alias of the directory containing the command class files.
 */
CConsoleCommandRunner.prototype.addCommands = function(path) {
	var commands = this.findCommands(path);
	
	for (var name in commands) {
		if (!this.commands[name])
			this.commands[name]=commands[name];
	}
};

/**
 * @param {string} name command name (case-insensitive)
 * @return {Object} the command object (instance of CConsoleCommand). Null if the name is invalid.
 */
CConsoleCommandRunner.prototype.createCommand = function(name) {
	name=name.toLowerCase();

	var command=null, className;
	
	if (this.commands[name])
		command=this.commands[name];
	
	if (command) {
		if (typeof command == 'string') {
			if (command.indexOf('/')!==-1 || command.indexOf('\\')!==-1) {
				className = require(lib.path.resolve(process.cwd(),command));
			} else // an alias
				className = Yiila[Yiila.import(command)];
			
			return new className(name,this);
		}

		return Yiila.createComponent(command,name,this);
	} else if(name=='help')
		return new Yiila.CHelpCommand('help',this);

	return null;
};