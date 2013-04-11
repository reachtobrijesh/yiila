'use strict';

require('harmony-reflect');

//@namespace lib
var lib = {
	path: require('path'),
	util: require('util'),
	fs: require('fs')
};
		
/**
 * @type {Object} Core classes.
 */
var _coreClasses = {
	'CApplication': 'core/CApplication',
	'CComponent': 'core/CComponent',
	'CModel': 'core/CModel',
	'CConsoleApplication': 'console/CConsoleApplication',
	'CConsoleCommandRunner': 'console/CConsoleCommandRunner',
	'CConsoleCommand': 'console/CConsoleCommand',
	'CHelpCommand': 'console/CHelpCommand',
	'CDaemonCommand': 'console/CDaemonCommand',
	'CLogger': 'logging/CLogger',
	'CLogRoute': 'logging/CLogRoute',
	'CLogRouter': 'logging/CLogRouter',
	'CConsoleLogRoute': 'logging/CConsoleLogRoute',
	'CEmailLogRoute': 'logging/CEmailLogRoute',
	'CFileLogRoute': 'logging/CFileLogRoute',
	'CTaskQueue': 'tasks/CTaskQueue',
	'CGearmanTaskQueue': 'tasks/CGearmanTaskQueue',
	'CCache': 'caching/CCache',
	'CCacheDependency': 'caching/CCacheDependency',
	'CMemCache': 'caching/CMemCache',
	'CWebPage': 'net/CWebPage',
	'CNetworkProxy': 'net/CNetworkProxy',
	'CDomHelper': 'utils/CDomHelper',
	'CValidator': 'validators/CValidator',
	'CBooleanValidator': 'validators/CBooleanValidator',
	'CEmailValidator': 'validators/CEmailValidator',
	'CInlineValidator': 'validators/CInlineValidator',
	'CIpValidator': 'validators/CIpValidator',
	'CNumberValidator': 'validators/CNumberValidator',
	'CRangeValidator': 'validators/CRangeValidator',
	'CRequiredValidator': 'validators/CRequiredValidator',
	'CStringValidator': 'validators/CStringValidator',
	'CUrlValidator': 'validators/CUrlValidator'
};

var _classMap = {}, _includePaths = null;

var Base = function()
{
	var _app = null, _logger = null, _imports={}, _aliases = {'system':__dirname};
	
	return {
		/**
		 * @return {СApplication} Возвращает синглтон объект приложения или null, если синглтон еще не был создан.
		 */
		app: function() {
			return _app;
		},
		/**
		 * Создает приложение
		 * @param {string|Function} app Строка с именем доступного для автозагрузки класса
		 *     или функция-конструктор класса
		 * @param {string|Object=} opt_config Конфигурация, которая применяется к классу
		 * @return {Object} Ссылка на экземпляр класса или null, если класс
		 *     не найден
		 */
		createApplication: function(app,opt_config) {
			if (typeof app === 'string') {
				app = this[app];
			}
			
			if (typeof app !== 'function')
				return null;
			
			return new app(opt_config);
		},
		/**
		 * Creates a console application instance.
		 * @param {string|Object=} opt_config application configuration.
		 * If a string, it is treated as the path of the file that contains the configuration;
		 * If an object, it is the actual configuration information.
		 * Please make sure you specify the {@see CApplication.basePath} property in the configuration,
		 * which should point to the directory containing all application logic, template and data.
		 * @return {Object}
		 */
		createConsoleApplication: function(opt_config) {
			return this.createApplication('CConsoleApplication',opt_config);
		},
		/**
		 * Сохраняет ссылку на экземпляр класса приложения в статической переменной.
		 * Позволяет обеспечить синглтон паттерн для приложения.
		 * @param {Application} app Ссылка на экземпляр класса приложения. Если передано null,
		 *     синглтон будет сброшен
		 * @throws Error При повторной попытке зарегистрировать приложение
		 */
		setApplication: function(app) {
			if (_app === null || app === null) {
				if (app === null && _app)
					_app.dispose();
				_app = app;
			} else
				throw new Error('Application can only be created once.');
		},
		/**
		 * Creates an object and initializes it based on the given configuration.
		 *
		 * The specified configuration can be either a string or an array.
		 * If the former, the string is treated as the object type which can
		 * be either the class name or {@see getPathOfAlias class path alias}.
		 * If the latter, the 'class' element is treated as the object type,
		 * and the rest of the name-value pairs in the array are used to initialize
		 * the corresponding object properties.
		 *
		 * Any additional parameters passed to this method will be
		 * passed to the constructor of the object being created.
		 *
		 * @param {!Object|string} config the configuration. It can be either a string or an array.
		 * @return {Object} the created object
		 * @throws Error if the configuration does not have a 'class' element.
		 */
		createComponent: function(config) {
			var type, obj;
			
			if (typeof config === 'string') {
				type = this[config];
				config = new Object();
			} else if(config.hasOwnProperty('class')) {
				type = config['class'];
				delete config['class'];
			} else
				throw new Error('Object configuration must be an array containing a "class" element.');
			
			if (!this[type])
				type = this.import(type, true);
			
			obj = (function construct(constructor, args) {
			    function F() {
			        return constructor.apply(this, args);
			    }
			    F.prototype = constructor.prototype;
			    return new F();
			})(this[type], Array.prototype.slice.call(arguments, 1));
			
			for (var key in config) {
				if (key != 'class')
					obj[key] = config[key];
			}
			return obj;
		},
		/**
		 * Translates an alias into a file path.
		 * Note, this method does not ensure the existence of the resulting file path.
		 * It only checks if the root alias is valid or not.
		 * @param {string} alias alias (e.g. system.core.CApplication)
		 * @return {string|boolean} file path corresponding to the alias, false if the alias is invalid.
		 */
		getPathOfAlias: function(alias) {
			var pos, rootAlias, args;
			
			if (_aliases[alias])
				return _aliases[alias];
			else if ((pos=alias.indexOf('.')) !== -1) {
				rootAlias=alias.substring(0,pos);
				
				if (_aliases[rootAlias]) {
					args = alias.substring(pos+1).split('.');
					
					if (args[args.length-1] == '*')
						delete args[args.length-1];
					
					args.unshift(_aliases[rootAlias]);
					return _aliases[alias]=lib.path.join.apply(null,args);
				}
			}
			return false;
		},
		/**
		 * Create a path alias.
		 * Note, this method neither checks the existence of the path nor normalizes the path.
		 * @param {string} alias alias to the path
		 * @param {string} path the path corresponding to the alias. If this is null, the corresponding
		 * path alias will be removed.
		 */
		setPathOfAlias: function(alias,path) {
			if (!path)
				delete _aliases[alias];
			else
				_aliases[alias] = lib.path.resolve(process.cwd(),path);
		},
		/**
		 * Imports a class or a directory.
		 *
		 * Importing a class is like including the corresponding class file.
		 * The main difference is that importing a class is much lighter because it only
		 * includes the class file when the class is referenced the first time.
		 *
		 * Path aliases are used to import a class or directory. For example,
		 * <ul>
		 *   <li><code>application.components.GoogleMap</code>: import the <code>GoogleMap</code> class.</li>
		 *   <li><code>application.components.*</code>: import the <code>components</code> directory.</li>
		 * </ul>
		 *
		 * @param {string} alias path alias to be imported
		 * @param {boolean=} opt_forceInclude whether to include the class file immediately. 
		 *     If false, the class file will be included only when the class is being used. 
		 *     This parameter is used only when the path alias refers to a class.
		 *     Defaults to false.
		 * @return {string} the class name or the directory that this alias refers to
		 * @throws Error if the alias is invalid
		 */
		import: function(alias,opt_forceInclude) {
			
			opt_forceInclude = opt_forceInclude || false;
			
			var pos, className, isClass, path, stat = null;
			
			if (_imports[alias]) // previously imported
				return _imports[alias];

			// a simple class name
			if ((pos = alias.lastIndexOf('.')) === -1) {
				if (opt_forceInclude && this[alias])
					_imports[alias]=alias;
				return alias;
			}

			className = alias.substring(pos+1);
			isClass = className!=='*';

			if ((path=this.getPathOfAlias(alias))!==false) {

				if (isClass) {
					if (opt_forceInclude) {
						try {
							stat = lib.fs.statSync(path+'.js');
						} catch(e) {}
						
						if (stat && stat.isFile())
							this[className] = require(path+'.js');
						else
							throw new Error(this.t('yiila','Alias "{alias}" is invalid. Make sure it points to an existing PHP file and the file is readable.',{'{alias}':alias}));
						_imports[alias] = className;
					} else
						_classMap[className] = path+'.js';
					
					return className;
				}
				// a directory
				
				if (!Array.isArray(_includePaths))
					_includePaths = [process.cwd()];

				if (_includePaths.indexOf(path) === -1)
					_includePaths.push(path);

				return _imports[alias]=path;
			}
			
			throw new Error(this.t('yiila','Alias "{alias}" is invalid. Make sure it points to an existing directory or file.',
				{'{alias}':alias}));
		},
		/**
		 * @return {CLogger} экземпляр класса CLogger
		 */
		getLogger: function() {
			if (!_logger)
				_logger = new this['CLogger']();
			
			return _logger;
		},	
		/**
		 * Записывает сообщение в журнал
		 * Сообщения, записанные этим методом, могут быть получены {@see CLogger::getLogs}
		 * и могут быть сохранены в различные источники(файл, БД, эл.почта и т.п.)
		 * {@see CLogRouter}.
		 * @param {string} msg Текст сообщения
		 * @param {string=} level Уровень сообщения (например, 'trace', 'warning', 'error').
		 *     Не чувствительно к регистру.
		 * @param {string=} category Категория сообщения (например, 'system.web').
		 *     Не чувствительно к регистру.
		 */
		log: function(msg,opt_level,opt_category)
		{
			opt_level = opt_level || this['CLogger'].LEVEL_INFO;
			opt_category = opt_category || 'application';
			
			if (!_logger)
				_logger = new this['CLogger']();

			_logger.log(msg,opt_level,opt_category);
		},
		/**
		 * Writes a trace message.
		 * This method will only log a message when the application is in debug mode.
		 * @param {string} msg message to be logged
		 * @param {string} category category of the message
		 * @see log
		 */
		trace: function(msg,opt_category)
		{
			if (GLOBAL.YIILA_DEBUG)
				this.log(msg,'trace',opt_category);
		},
		/**
		 * Форматирует сообщение.
		 * Примеры использования:
		 * <pre>
		 *     Yiila.t('component', 'My name is %s', 'John Patrick');
		 *     Yiila.t('component', 'My name is %s and i am %d years old', ['John', 12]);
		 *     Yiila.t('component', 'My name is {name} and i am {age} years old', 
		 *         {'{name}':'John', '{age}':12}
		 *     );
		 * </pre>
		 * Осторожно, при передаче в качестве параметра объекта используйте только
		 * тривиальные ключи, так как в этом случае производится поиск по регулярному 
		 * выражению, что может привести к неожиданному поведению.
		 * Рекомендуемый паттерн для объекта: {'{variable}': value}.
		 *  
		 * @param {string} category Категория сообщения. Оставлено для
		 *     для возможности дальнейшей интернационализации
		 * @param {string} message Текст сообщения
		 * @param {(Array|Object|string)=} opt_params Опционально. 
		 *     Если передана строка или массив, будет применен шаблон из util.format,
		 *     в противном случае будет произведена глобальная замена по всем ключам объекта.
		 * @return {string} сформированное сообщение
		 */
		t: function(category, message, opt_params) {
			
			if (!opt_params)
				return message;
			
			if (Array.isArray(opt_params))
			{
				var args = opt_params.slice();
				args.unshift(message);
				return lib.util.format.apply(null, args);
			}
			
			if (typeof opt_params == 'string') 
				return lib.util.format(message, opt_params);
			
			var str = '('+Object.keys(opt_params).join('|')+')';		
			return message.replace(new RegExp(str, 'g'), function(key) {
				return opt_params[key];
			});
		},
		/**
		 * Создает мягкую копию объекта (клонирование). Ссылки остаются ссылками.
		 * ECMAScript 5.
		 * @param {!Object} obj Объект, копию которого нужно создать
		 * @returns {!Object} Новый объект
		 */
		clone: function(obj) {
			var copyObj = Object.create(Object.getPrototypeOf(obj));
			Object.getOwnPropertyNames(obj).forEach(function(pName){
				Object.defineProperty(copyObj, pName, Object.getOwnPropertyDescriptor(obj, pName));
			});
			return copyObj;	
		},
		/**
		 * Объединяет объекты. Порядок следования объектов при передаче для копирования
		 * имеет значение, так как каждый следующий изменяет свойства предыдущего, если они пересекаются.
		 * ECMAScript 5.
		 * Пример использования:
		 * <pre>
		 *     var train = {'number': 123};
		 *     var air = {'name': 'airbus', 'number': 737};
		 *     var obj = Yiila.extend(train, air);
		 * </pre>
		 * @returns {!Object} Новый объект, объединивший свойства переданных объектов
		 */
		extend: function() {
			var target = new Object();
			var sources = Array.prototype.slice.call(arguments);
	        sources.forEach(function (source) {
	            Object.getOwnPropertyNames(source).forEach(function(propName) {
	                Object.defineProperty(target, propName,
	                    Object.getOwnPropertyDescriptor(source, propName));
	            });
	        });
	        return target;	
		},
		/**
		 * Наследует класс child от класса parent
		 * Основано на ECMAScript 5.
		 * Может быть расширено, например для сохранения имени класса.
		 */
		inherits: function(child, parent) {
			child.prototype = Object.create(parent.prototype, {
				constructor: { value: child, enumerable: false }
			});
			child.__superClass__ = parent.prototype;	
		}
	};
}();

/**
 * Отложенные автозагрузки классов библиотеки
 * Вы можете использовать доступ к классам библиотеки следующим образом:
 * <pre>
 *     var Yiila = require('yiila');
 *     var app = new Yiila.CApplication();
 * </pre>
 */
module.exports = Proxy(Base, {
	get: function(target, name) {
		if (!target.hasOwnProperty(name)) {
			if (_coreClasses.hasOwnProperty(name))
				target[name] = require(lib.path.join(__dirname, _coreClasses[name]));
			else if (_classMap.hasOwnProperty(name))
				target[name] = require(_classMap[name]);
			else if (Array.isArray(_includePaths)) {

				var classFile,
					path,
					stat = null,
					length = _includePaths.length;
				
				for (var i = 0; i < length; i++) {
					
					path = _includePaths[i];
					classFile = lib.path.join(path, name+'.js');
					
					try {
						stat = lib.fs.statSync(classFile);
					} catch (e) {}
					
					if (stat && stat.isFile()) {
						target[name] = require(classFile);

						if (GLOBAL.YIILA_DEBUG && lib.path.basename(classFile)!==name+'.js')
							throw new Error(target.t('yiila','Class name "{class}" does not match class file "{file}".',
								{
									'{class}': name,
									'{file}': classFile
								}
							));
						break;
					}
				}				
			}
		}
		return target[name];
	}
});