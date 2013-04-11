'use strict';
/**
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..'),
	_ = require('underscore');

/**
 * Абстрактный класс валидатора модели
 * @constructor
 * @extends {CComponent}
 */
var CValidator = module.exports = function() {
	return Yiila.CComponent.call(this);
};
Yiila.inherits(CValidator, Yiila.CComponent);

/**
 * Список атрибутов, которые должны быть проверены валидатором
 * @type {Array}.
 */
CValidator.prototype.attributes = null;

/**
 * @type {boolean} Нужно ли пропустить эту проверку,
 *     если уже есть ошибка по текущему атрибуту. По умолчанию пропуск отключен.
 */
CValidator.prototype.skipOnError = false;
	
/**
 * @type {Object} Список сценариев, для которых валидатор может быть применен.
 * Каждое значение содержит имя сценария, которое также выступает ключом элемента.
 */
CValidator.prototype.on = null;

/**
 * @type {Object} Список сценариев, для которых валидатор не может быть применен.
 * Каждое значение содержит имя сценария, которое также выступает ключом элемента.
 */
CValidator.prototype.except = null;
	
/**
 * @type {?string} Сообщение об ошибке 
 */
CValidator.prototype.message = null;
	
/**
 * Выполнить проверку по указанному атрибуту.
 * Этот метод должен быть переопределен в классе наследнике.
 * @param {!Model} obj Модель, над которой производится проверка.
 * @param {string} attribute Имя атрибута, по которому производится проверка.
 * @abstract
 * @protected
 */
CValidator.prototype.validateAttribute = function(obj,attribute) {};

/**
 * Проверяет указанный объект.
 * @param {!Model} obj Модель, над которой производится проверка.
 * @param {Array=} opt_attributes Список атрибутов, которые должны быть проверены.
 *     Если параметр не передан или = null, будут проверены все атрибуты,
 *     указанные в {@see attributes}.
 */
CValidator.prototype.validate = function(obj,opt_attributes)
{
	var self = this;

	if (opt_attributes)
		opt_attributes = _.intersection(this.attributes,opt_attributes);
	else
		opt_attributes = this.attributes  ? this.attributes : [];
	
	opt_attributes.forEach(function(attribute) {
		if (!self.skipOnError || !obj.hasErrors(attribute))
			self.validateAttribute(obj,attribute);
	});
};

/**
 * Возвращает значение, характеризующее может ли быть применен валидатор
 * к указанному сценарию.
 * Валидатор может быть применен к сценарию при следующих условиях:
 * <ul>
 * <li>свойство валидатора "except" не содержит указанный сценарий</li>
 * <li>свойство валидатора "on" пустое</li>
 * <li>свойство валидатора "on" содержит указанный сценарий</li>
 * </ul>
 * @param {?string} scenario Имя сценария
 * @return {boolean} Может ли валидатор применен к указанному сценарию
 */
CValidator.prototype.applyTo = function(scenario)
{			
	if (this.except && this.except.hasOwnProperty(scenario))
		return false;

	return !this.on || this.on.hasOwnProperty(scenario);
};

/**
 * Добавляет сообщение об ошибке в модель
 * Это вспомогательный метод.
 * @param {!CModel} obj модель, над которой провидится валидация
 * @param {string} attribute Имя атрибута
 * @param {string} message Текст сообщения об ошибке
 * @param {Object=} opt_params "Заполнители"
 * @protected
 */
CValidator.prototype.addError = function(obj,attribute,message,opt_params)
{
	if (typeof opt_params !== 'object')
		opt_params = {};
	
	opt_params['{attribute}']=obj.getAttributeLabel(attribute);
	obj.addError(attribute,Yiila.t('validator',message, opt_params));
}

/**
 * Проверяет, не является ли переданное значение пустым.
 * Значение считается пустым, если оно null, пустой массив 
 * или очищенный trim результат не пустая строка.
 * @param {*} value Значение, которое должно быть проверено
 * @param {boolean=} opt_trim Нужно ли выполнить trim перед проверкой строковых значений.
 *     По умолчанию - false.
 * @return {boolean} Является ли значение пустым
 * @protected
 */
CValidator.prototype.isEmpty = function(value,opt_trim)
{
	return value===null || (Array.isArray(value) && value.length===0) || value==='' || 
		opt_trim && typeof value == 'string' && value.trim()==='';
};

/**
 * @type {!Object} список встроенных валидаторов
 */
CValidator.builtInValidators = {
	'required':'CRequiredValidator',
	'url':'CUrlValidator',
	'length':'CStringValidator',
	'numerical':'CNumberValidator',
	'boolean':'CBooleanValidator',
	'in':'CRangeValidator',
	'ip': 'CIpValidator'
};

/**
 * Creates a validator object.
 * @param {string} name the name or class of the validator
 * @param {!Object} obj the data object being validated that may contain the inline validation method
 * @param {(!Array|string)} attributes list of attributes to be validated. This can be either an array of
 * the attribute names or a string of comma-separated attribute names.
 * @param {Object=} opt_params initial values to be applied to the validator properties
 * @return {CValidator} the validator
 */
CValidator.createValidator = function(name,obj,attributes,opt_params)
{
	var on, except, validator, className;
	
	if (typeof attributes === 'string')
		attributes = attributes.split(/[\s,]+/);

	if (!opt_params)
		opt_params = {};
	
	if (opt_params.hasOwnProperty('on'))
	{
		if (typeof params['on'] === 'string')
			on =  params['on'].split(/[\s,]+/);
		else
			on = params['on'];
	}
	else
		on = new Array();

	if (opt_params.hasOwnProperty('except'))
	{
		if (typeof params['except'] === 'string')
			except =  params['except'].split(/[\s,]+/);
		else
			except = params['except'];
	}
	else
		except = new Array();

	if (typeof name == 'string')
	{
		if (typeof obj[name] == 'function')
		{	
			validator = new Yiila.CInlineValidator();
			validator.attributes = attributes;
			validator.method = name;

			validator.params = opt_params;
			
			if (opt_params.hasOwnProperty('skipOnError'))
				validator.skipOnError = opt_params['skipOnError'];
				
		} else {
			if (this.builtInValidators[name] !== void 0)
				className=Yiila.import(this.builtInValidators[name],true);
			else
				className=Yiila.import(name,true);
			validator = new Yiila[className];
			
			opt_params['attributes'] = attributes;	
			for (var pname in opt_params)
				validator[pname] = opt_params[pname];
		}
		
	} else {
		validator = new name();
		
		opt_params['attributes'] = attributes;	
		for (var pname in opt_params)
			validator[pname] = opt_params[pname];
	}

	validator.on = !on.length ? null : _.object(on,on);
	validator.except = !except.length ? null : _.object(except,except);

	return validator;
};