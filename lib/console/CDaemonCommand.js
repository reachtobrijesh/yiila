'use strict';

/**
 * @fileoverview CDaemonCommand class file.
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..'),
	path = require('path'),
	spawn = require('child_process').spawn,
	forever = require('forever'),
	fs = require('fs'),
	crypto = require('crypto');

/**
 * CDaemonCommand represents a console command to execute or demonize a script.
 * 
 * @constructor
 * @extends {CConsoleCommand}
 */
var CDaemonCommand = module.exports = function(name, runner) {
	return Yiila.CConsoleCommand.call(this,name,runner);
};
Yiila.inherits(CDaemonCommand, Yiila.CConsoleCommand);

/**
 * @type {string} Script name to demonize or execute once
 */
CDaemonCommand.prototype.script = 'index.js';

/**
 * @type {?string} Path to directoty with executable script
 */
CDaemonCommand.prototype.path = null;

/**
 * @type {Object} forever-monitor options {@link https://github.com/nodejitsu/forever-monitor}
 */
CDaemonCommand.prototype.options = {};

/**
 * @type {boolean} whether to allow the start multiple daemons the script. Defaults to false.
 */
CDaemonCommand.prototype.allowMulti = false;

/**
 * Action to execute the script once
 */
CDaemonCommand.prototype.actionIndex = function() {
	var dir = path.resolve(process.cwd, this.path || ''),
		pathToSource = path.resolve(dir, this.script);
	// close the console application
	Yiila.setApplication(null);
	
	if (this._sourceExists(pathToSource))
	{
		process.chdir(dir);
		require(pathToSource);
	}
};

/**
 * Action to start the script as daemon
 * @param {string} signal POSIX signal to sent to the demonized process on exit.
 *     Note: SIGKILL and SIGSTOP cannot be caught, blocked, or ignored.
 *     Defaults to SIGTERM.
 */
CDaemonCommand.prototype.actionStart = function(signal) {
	var options = this.options, self = this;
	
	if (this.path)
		options.sourceDir = path.resolve(process.cwd, this.path);
	
	options.sourceDir = options.cwd = options.sourceDir || process.cwd();
	options.killSignal = signal || options.killSignal || 'SIGTERM';
	options.uid = options.uid || this.getUID();
	options.command = options.command || 'node --harmony';

	
	// We want to "forever" kill the process with desired signal, 
	// so we need changes of the code "forever-monitor", which still is not in a separate version.
	// @todo Remove this code when the version of forever-monitor will be grater than 1.1.0
	function startDaemon(script, options) {
		options.logFile = forever.logFilePath(options.logFile || options.uid + '.log');
		options.pidFile = forever.pidFilePath(options.pidFile || options.uid + '.pid');
		
		var monitor, outFD, errFD, monitorPath;
		
		outFD = fs.openSync(options.logFile, 'a');
		errFD = fs.openSync(options.logFile, 'a');
		monitorPath = path.resolve(__dirname, '..', '..', 'bin', 'monitor');
		
		monitor = spawn(process.execPath, [monitorPath, script], {
			stdio: ['ipc', outFD, errFD],
			detached: true
		});
		
		monitor.on('exit', function (code) {
			console.error('Monitor died unexpectedly with exit code %d', code);
		});
		
		monitor.send(JSON.stringify(options));
		monitor.unref();
	}
	
	console.log('Starting the daemon...'.grey);
	
	if (!this._sourceExists(path.resolve(options.sourceDir, this.script)))
		return;
	
	if (!this.allowMulti)
	{
		forever.list(false, function (err,processes) {
			var procs = forever.findByUid(options.uid, processes);
			
			if (procs && procs.length) {
				console.error('Daemon already started');
				return;
			} 
			
			startDaemon(self.script, options);
		});
		
	} else
		startDaemon(this.script, options);
};

/**
 * Action to stop previously demonized script
 */
CDaemonCommand.prototype.actionStop = function() {	
	var uid = this.getUID(),
		runner = forever.stop(uid, true);

	runner.on('stop', function (process) {
		console.log('Stopped the daemon'.grey);
		return 0;
	});

	runner.on('error', function (err) {
		console.error('Cannot find process with index: ' + uid);
		return 1;
	});
};

/**
 * Action to restop previously demonized script
 */
CDaemonCommand.prototype.actionRestart = function() {	
	var uid = this.getUID(),
		runner = forever.restart(uid, true);

	runner.on('restart', function (processes) {
		if (processes) {
			console.log('Forever restarted process(es):'.grey);
			processes.split('\n').forEach(function (line) {
				console.log(line);
			});
		}
		else {
			console.log('No forever processes running');
		}
	});

	runner.on('error', function (err) {
		console.error('Error restarting process with index: ' + uid);
		console.error(err.message);
	});
};

/**
 * @return {string} unique identifier of the script
 */
CDaemonCommand.prototype.getUID = function() {
	var md5sum = crypto.createHash('md5');
	md5sum.update(path.resolve(process.cwd(), this.path, this.script));
	return md5sum.digest('hex');
};

/**
 * Test whether or not the given source script exists by checking with the file system.
 * @return {boolean}
 * @protected
 */
CDaemonCommand.prototype._sourceExists = function(source) {
	if (!fs.existsSync(source))
	{
		console.error('Source "'+source+'" does not exists');
		return false;
	}
	return true;
};