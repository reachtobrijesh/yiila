'use strict';

/**
 * @fileoverview Класс CFileLogRoute
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..');

//@namespace lib
var lib = {
	path: require('path'),
	fs: require('fs-ext')
};

/**
 * CFileLogRoute records log messages in files.
 * 
 * The log files are stored under {@see setLogPath logPath} and the file name
 * is specified by {@see setLogFile logFile}. If the size of the log file is
 * greater than {@see setMaxFileSize maxFileSize} (in kilo-bytes), a rotation
 * is performed, which renames the current log file by suffixing the file name
 * with '.1'. All existing log files are moved backwards one place, i.e., '.2'
 * to '.3', '.1' to '.2'. The property {@see setMaxLogFiles maxLogFiles}
 * specifies how many files to be kept.
 *
 * @todo exclude blocking operations
 * @constructor
 * @extends {CLogRoute}
 */
var CFileLogRoute = module.exports = function() {
	return Yiila.CLogRoute.call(this);
};
Yiila.inherits(CFileLogRoute,Yiila.CLogRoute);

/**
 * @type {number} maximum log file size
 * @private
 */
CFileLogRoute.prototype._maxFileSize = 1024; // KB
/**
 * @type {number} number of log files used for rotation
 * @private
 */
CFileLogRoute.prototype._maxLogFiles = 5;
/**
 * @var {string} directory storing log files
 * @private
 */
CFileLogRoute.prototype._logPath = null;
/**
 * @type {string} log file name
 * @private
 */
CFileLogRoute.prototype._logFile = 'application.log';


/**
 * Initializes the route.
 * This method is invoked after the route is created by the route manager.
 * @override
 */
CFileLogRoute.prototype.init = function() {
	CFileLogRoute.__superClass__.init.call(this);
	
	if (!this.getLogPath())
		this.setLogPath(Yiila.app().getRuntimePath());
};

/**
 * @return {?string} directory storing log files. Defaults to application runtime path.
 */
CFileLogRoute.prototype.getLogPath = function() {
	return this._logPath;
};

/**
 * @param {string} path directory for storing log files.
 * @throws {Error} if the path is invalid
 */
CFileLogRoute.prototype.setLogPath = function(path) {
	var stat = null;
	
	this._logPath = lib.path.resolve(Yiila.app().getBasePath(), path);
	
	try {
		stat = lib.fs.lstatSync(this._logPath+'/');
	} catch (e) {}
	
	if (!stat || !stat.isDirectory())
		throw new Error(Yiila.t('core','CFileLogRoute.logPath %s does not point to a valid directory. Make sure the directory exists and is writable by the server process.', path));
};

/**
 * @return {string} log file name. Defaults to 'application.log'.
 */
CFileLogRoute.prototype.getLogFile = function() {
	return this._logFile;
};

/**
 * @param {string} value log file name
 */
CFileLogRoute.prototype.setLogFile = function(value) {
	this._logFile = value;
};

/**
 * @return {number} maximum log file size in kilo-bytes (KB). Defaults to 1024 (1MB).
 */
CFileLogRoute.prototype.getMaxFileSize = function() {
	return this._maxFileSize;
};

/**
 * @param {number} value maximum log file size in kilo-bytes (KB).
 */
CFileLogRoute.prototype.setMaxFileSize = function(value) {
	if ((this._maxFileSize = value) < 1)
		this._maxFileSize = 1;
};

/**
 * @return {number} number of files used for rotation. Defaults to 5.
 */
CFileLogRoute.prototype.getMaxLogFiles = function() {
	return this._maxLogFiles;
};

/**
 * @param {number} value number of files used for rotation.
 */
CFileLogRoute.prototype.setMaxLogFiles = function(value) {
	if ((this._maxLogFiles = value) < 1)
		this._maxLogFiles = 1;
};

/**
 * Saves log messages in files.
 * @param {!Array} logs list of log messages
 */
CFileLogRoute.prototype.processLogs = function(logs) {
	
	var logFile = lib.path.join(this.getLogPath(),this.getLogFile());
	var stat = null;
	
	try {
		stat = lib.fs.lstatSync(logFile);		
	} catch(e) {}
	
	if (stat && stat.size > this.getMaxFileSize()*1024)
		this.rotateFiles();

	try {
		var fd = lib.fs.openSync(logFile,'a');
		// эксклюзивная блокировка, не тестировал это расширение...
		lib.fs.flockSync(fd, 'ex');
		logs.forEach(function(log) {
			lib.fs.writeSync(fd,this.formatLogMessage(log[0],log[1],log[2],log[3]));
		}, this);
		
		lib.fs.closeSync(fd);
	} catch (e) {}
};

/**
 * Rotates log files.
 */
CFileLogRoute.prototype.rotateFiles = function() {
	var file = lib.path.join(this.getLogPath(),this.getLogFile());
	var max = this.getMaxLogFiles();
	var rotateFile, stat;
	
	for (var i = max; i > 0; --i)
	{
		rotateFile = file+'.'+i;
		
		try {
			stat = lib.fs.lstatSync(rotateFile);
		} catch(e) {
			stat = null;
		}
		
		if (stat && stat.isFile()) {
			try {
				// suppress errors because it's possible multiple processes enter into this section
				if (i===max)
					lib.fs.unlinkSync(rotateFile);
				else
					lib.fs.renameSync(rotateFile,file+'.'+(i+1));
			} catch (e) {}
		}
	}

	try {
		stat = lib.fs.lstatSync(file);
		
		if (stat.isFile(file)) {
			lib.fs.renameSync(file,file+'.1'); // suppress errors because it's possible multiple processes enter into this section
		}
	} catch(e) {}
};