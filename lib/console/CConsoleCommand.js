'use strict';
/**
 * @fileoverview CConsoleCommand class file.
 * @author mik.bulatov@gmail.com
 */
var Yiila = require('..');

/**
 * CConsoleCommand represents an executable console command.
 *
 * It works by parsing command line options and dispatching
 * the request to a specific action with appropriate option values.
 *
 * Users call a console command via the following command format:
 * <pre>
 * node scriptName CommandName ActionName --Option1=Value1 --Option2=Value2 ...
 * </pre>
 *
 * Child classes mainly needs to implement various action methods whose name must be
 * prefixed with "action". The parameters to an action method are considered as options
 * for that specific action. The action specified as {@see defaultAction} will be invoked
 * when a user does not specify the action name in his command.
 *
 * Options are bound to action parameters via parameter names. For example, the following
 * action method will allow us to run a command with <code>node ourscriptName sitemap --type=News</code>:
 * <pre>
 * function SitemapCommand(name, runner) {
 *     return Yiila.CConsoleCommand.call(this,name,runner);
 * };
 * Yiila.inherits(SitemapCommand, Yiila.CConsoleCommand);
 * 
 * SitemapCommand.prototype.actionIndex(type) {
 *     ....
 * };
 * </pre>
 *
 * @param {string} name name of the command
 * @param {!Object} runner the command runner (instance of CConsoleCommandRunner)
 * @abstract
 * @constructor
 * @extends {CComponent}
 */
var CConsoleCommand = module.exports = function(name, runner) {
	var __this__ = Yiila.CComponent.call(this);
	__this__._name=name;
	__this__._runner=runner;
	return __this__;
};
Yiila.inherits(CConsoleCommand, Yiila.CComponent);

/**
 * @type {string} the name of the default action. Defaults to 'index'.
 */
CConsoleCommand.prototype.defaultAction='index';

/** @private */
CConsoleCommand.prototype._name = null;
/** @private */
CConsoleCommand.prototype._runner = null;

/**
 * Executes the command.
 * The default implementation will parse the input parameters and
 * dispatch the command request to an appropriate action with the corresponding
 * option values
 * @param {!Array} args command line parameters for this command.
 * @return {number} application exit code, which is returned by the invoked action. 0 if the action did not return anything.
 */
CConsoleCommand.prototype.run = function(args) {
	var p = this.resolveRequest(args), 
		action = p[0],
		options = p[1],
		keys;
	
	args = p[2];
	
	var methodName = 'action'+action.charAt(0).toUpperCase() + action.slice(1);
	if (!action.match(/^\w+$/) || !this[methodName])
		this.usageError("Unknown action: "+action);

	var params = [];
	var funcArgs = this._getParamNames(this[methodName]);
	
	// named and unnamed options
	funcArgs.forEach(function(name) {
		if (options[name]) {
			params.push(options[name]);
			delete options[name];
		} else if(name==='args')
			params.push(args);
		else
			params.push(null);
	});

	keys = Object.keys(options);
	
	// try global options
	if (keys.length) {
		for (var name in options) {
			if (name in this) {
				this[name]=options[name];
				delete options[name];
			}
		}
	}

	keys = Object.keys(options);
	
	if (keys.length)
		this.usageError("Unknown options: "+keys.join(', '));
	
	return this[methodName].apply(this, params);
};

/**
 * Parses the command line arguments and determines which action to perform.
 * @param {!Array} args command line arguments
 * @return {!Array} the action name, named options (name=>value), and unnamed options
 */
CConsoleCommand.prototype.resolveRequest = function(args) {
	var options=[];	// named parameters
	var params=[];	// unnamed parameters
	var matches, name, value, action = null;
	
	args.forEach(function(arg) {
		matches = arg.match(/^--(\w+)(=(.*))?$/); // an option
		if (matches && matches.length) {
			name = matches[1];
			value = matches[3] ? matches[3] : true;
			if (options[name]) {
				// convert to array if name is the same
				if(!Array.isArray(options[name]))
					options[name]=[options[name]];
				options[name].push(value);
			} else
				options[name]=value;
		} else if(action)
			params.push(arg);
		else
			action = arg;
	});
	
	if (!action)
		action = this.defaultAction;
	
	return [action,options,params];
};

/**
 * @return {string} the command name.
 */
CConsoleCommand.prototype.getName = function(){
	return this._name;
};

/**
 * @return {Object} the command runner. Instance of CConsoleCommandRunner
 */
CConsoleCommand.prototype.getCommandRunner = function() {
	return this._runner;
};

/**
 * Provides the command description.
 * This method may be overridden to return the actual command description.
 * @return {string} the command description. Defaults to 'Usage: node entry-script.js command-name'.
 */
CConsoleCommand.prototype.getHelp = function() {
	var help = 'Usage: node '+this.getCommandRunner().getScriptName()+' '+this.getName();
	var options = this.getOptionHelp();
	
	if (!options.length)
		return help;
	
	if (options.length===1)
		return help+' '+options[0];
	
	help += " <action>\nActions:\n";
	options.forEach(function(option) {
		help += '    '+option+"\n";
	});
	
	return help;
};

/**
 * Provides the command option help information.
 * The default implementation will return all available actions together with their
 * corresponding option information.
 * @return {!Array} the command option help information. Each array element describes
 * the help information for a single action.
 */
CConsoleCommand.prototype.getOptionHelp = function()
{
	var options = [], help;

	for (var method in this) {
		if (typeof this[method] != 'function')
			continue;
		
		if (method.length > 6 && method.substr(0,6) == 'action') {
			help = method.substr(6).toLowerCase();
			
			this._getParamNames(this[method]).forEach(function(param){
				help+=" --"+param+"=value";
			});
			
			options.push(help);
		}
	}
	return options;
};

/**
 * Displays a usage error.
 * This method will then terminate the execution of the current application.
 * @param {string} message the error message
 */
CConsoleCommand.prototype.usageError = function(message) {
	process.stderr.write("Error: "+message+"\n\n"+this.getHelp()+"\n");
	process.exit(1);
};

/**
 * The following method returns an array of parameter names of any function passed in.
 * @param {Function} func function to parse
 * @return {!Array} array of parameter
 * @private
 */
CConsoleCommand.prototype._getParamNames = function(func) {
    var funStr = func.toString();
    funStr = funStr.slice(funStr.indexOf('(')+1, funStr.indexOf(')'));
    
    if (funStr.trim() == '')
    	return [];
    
    return funStr.match(/([^\s,]+)/g);
};