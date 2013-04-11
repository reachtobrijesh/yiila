'use strict';
/**
 * @fileoverview CHelpCommand class file.
 * @author mik.bulatov@gmail.com
 */
var Yiila = require('..');

/**
 * CHelpCommand represents a console help command.
 *
 * CHelpCommand displays the available command list or the help instructions
 * about a specific command.
 *
 * To use this command, enter the following on the command line:
 * <pre>
 * node path/to/entry_script.php help [command name]
 * </pre>
 * In the above, if the command name is not provided, it will display all
 * available commands.
 * 
 * @constructor
 * @extends {CConsoleCommand}
 */
var CHelpCommand = module.exports = function(name, runner) {
	return Yiila.CConsoleCommand.call(this,name,runner);
};
Yiila.inherits(CHelpCommand, Yiila.CConsoleCommand);

/**
 * Execute the action.
 * @param {!Array} args command line parameters specific for this command
 * @return {number} non zero application exit code after printing help
 */
CHelpCommand.prototype.run = function(args) {
	var runner = this.getCommandRunner(),
		commands = runner.commands,
		name = '', commandNames;
		
	if (args[0])
		name = args[0].toLowerCase();
	
	if (!args[0] || !commands[name]) {
		commandNames = Object.keys(commands);
		
		if(commandNames.length)
		{
			console.log("Usage: node "+runner.getScriptName()+" <command-name> [parameters...]");
			console.log("\nThe following commands are available:");
			commandNames.sort();
			console.log(' - '+commandNames.join("\n - "));
			console.log("\n\nTo see individual command help, use the following:");
			console.log("   node "+runner.getScriptName()+" help <command-name>");
		} else {
			console.log("No available commands.");
			console.log("Please define them under the following directory:");
			console.log("\t"+Yiila.app().getCommandPath());
		}
	} else
		console.log(runner.createCommand(name).getHelp());
	
	return 1;
};

/**
 * Provides the command description.
 * @return {string} the command description.
 */
CHelpCommand.prototype.getHelp = function() {
	return CHelpCommand.__superClass__.getHelp.call(this)+' [command-name]';
};