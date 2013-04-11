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
 * CFileLogRoute записывает сообщения журнала в файл
 *
 * Лог-файлы сохраняются в директории {@see setLogPath} c именем файла, заданным
 * {@see setLogFile}. 
 * Если размер лог-файла больше чем {@see setMaxFileSize}, выполняется сдвиг,
 * который делает переименование текущего лог-файла на файл с суффиксом '.1' и другие существующие
 * лог-файлы также смещаются на одну позицию (например, файл с суффиксом '.2'
 * переименовывается в '.3', '.1' в '.2'). Свойство {@see setMaxLogFiles}
 * устанавливает как много таких файлов может быть создано.
 * @todo сократить блокирующие операции
 * @constructor
 * @extends {CLogRoute}
 */
var CFileLogRoute = module.exports = function()
{
	return Yiila.CLogRoute.call(this);
};
Yiila.inherits(CFileLogRoute,Yiila.CLogRoute);

/**
 * @type {number} Максимальный размер файла в килобайтах
 * @private
 */
CFileLogRoute.prototype._maxFileSize = 1024; // KB
/**
 * @type {number} Максимальное число файлов
 * @private
 */
CFileLogRoute.prototype._maxLogFiles = 5;
/**
 * @var {string} Директория сохранения файлов
 * @private
 */
CFileLogRoute.prototype._logPath = null;
/**
 * @type {string} Имя файла
 * @private
 */
CFileLogRoute.prototype._logFile = 'application.log';


/**
 * Инициализация маршрутизатора
 * Метод вызывается после того как маршрутизатор был создан менеджером.
 * @override
 */
CFileLogRoute.prototype.init = function()
{
	CFileLogRoute.__superClass__.init.call(this);
	
	if (!this.getLogPath())
		this.setLogPath(Yiila.app().getRuntimePath());
};

/**
 * @return {?string} Директория сохранения файла
 */
CFileLogRoute.prototype.getLogPath = function()
{
	return this._logPath;
};

/**
 * @param {string} path Директория для сохранения файлов.
 * @throws Error Если путь к директории неверный
 */
CFileLogRoute.prototype.setLogPath = function(path)
{
	var stat = null;
	
	this._logPath = lib.path.resolve(Yiila.app().getBasePath(), path);
	
	try {
		stat = lib.fs.lstatSync(this._logPath+'/');
	} catch (e) {}
	
	if (!stat || !stat.isDirectory())
		throw new Error(Yiila.t('core','CFileLogRoute.logPath %s does not point to a valid directory. Make sure the directory exists and is writable by the server process.', path));
};

/**
 * @return {string} Имя лог-файла. По умолчанию - 'application.log'.
 */
CFileLogRoute.prototype.getLogFile = function()
{
	return this._logFile;
};

/**
 * @param {string} value Имя лог-файла
 */
CFileLogRoute.prototype.setLogFile = function(value)
{
	this._logFile = value;
};

/**
 * @return {number} Маскимальный размер лог-файла в килобайтах. 
 *     По уолчанию - 1024 (1MB).
 */
CFileLogRoute.prototype.getMaxFileSize = function()
{
	return this._maxFileSize;
};

/**
 * @param {number} value Максимальный размер лог-файла в килобайтах (KB).
 */
CFileLogRoute.prototype.setMaxFileSize = function(value)
{
	if ((this._maxFileSize = value) < 1)
		this._maxFileSize = 1;
};

/**
 * @return {number} Максимальное число файлов. По умолчанию, 5.
 */
CFileLogRoute.prototype.getMaxLogFiles = function()
{
	return this._maxLogFiles;
};

/**
 * @param {number} value Макимальное число файлов (частей файла).
 */
CFileLogRoute.prototype.setMaxLogFiles = function(value)
{
	if ((this._maxLogFiles = value) < 1)
		this._maxLogFiles = 1;
};

/**
 * Сохраняет сообщения журнала в файле
 * @param {!Array} logs Список сообщений журнала
 */
CFileLogRoute.prototype.processLogs = function(logs)
{
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
 * Выполняет сдвиг частей лог-файла
 */
CFileLogRoute.prototype.rotateFiles = function()
{
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
		
		if (stat && stat.isFile())
		{
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