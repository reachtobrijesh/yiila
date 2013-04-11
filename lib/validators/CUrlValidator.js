'use strict';
/**
 * @fileoverview Класс CUrlValidator
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..'),
	url = require('url');

/**
 * CUrlValidator проверяет является ли значение атрибута валидным адресом URL
 *
 * @constructor
 * @extends {CValidator}
 */
var CUrlValidator = module.exports = function()
{
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CUrlValidator, Yiila.CValidator);

/**
 * @type {(!Array|!RegExp)} регулярное выражение, используемое для проверки значения атрибута.
 * Это может быть экземпляром класса RegExp либо массивом (первый элемент - выражение, 
 * второй - опционально флаги, передаваемые в конструктор RegExp)
 * Шаблон может содежать в себе {schemes}, которое будет заменено на схемы из {@see validSchemes}. 
 */
CUrlValidator.prototype.pattern = ['^{schemes}:\\/\\/(([A-Z0-9][A-Z0-9_-]*)(\\.[A-Z0-9][A-Z0-9_-]*)+)', 'i'];

/**
 * @type {!Array} URI схемы, которые считаются валидными. По усолчанию http и https
 * считаются валидными
 **/
CUrlValidator.prototype.validSchemes = ['http','https'];

/**
 * @type {string} URI схема по умолчанию. Если значение атрибута не содержит часть со схемой,
 * схема по умолчанию будет добавлена к значению. Если свойство не установлено или null,
 * атрибут считается невалидным, если не содержит схемы.
 *
 * ВАЖНО: Если значение атрибута не содержит схему и это свойство установлено, 
 * значение атрибута будет изменено с учетом этой схемы.
 **/
CUrlValidator.prototype.defaultScheme;

/**
 * @type {boolean} следует ли при валидации учитывать IDN. По умолчанию - false, в этом случае
 * URL адрес, содержащий IDN, будет признан невалидным.
 */
CUrlValidator.prototype.validateIDN=false;
	

/**
 * @type {boolean} может ли быть значение атрибута пустым или null.
 * По усолчанию true, то есть если значение атрибута пустое, оно считается валидным.
 */
CUrlValidator.prototype.allowEmpty = true;

/**
 * Проверяет указанный объект.
 * @param {!Model} obj Модель, над которой производится проверка.
 * @param {Array} opt_attributes Список атрибутов, которые должны быть проверены.
 *     Если параметр не передан или = null, будут проверены все атрибуты,
 *     указанные в {@see attributes}.
 * @override
 */
CUrlValidator.prototype.validateAttribute = function(obj,attribute) {

	var value = obj[attribute], message;
	
	if (this.allowEmpty && this.isEmpty(value))
		return;
		
	if ((value = this.validateValue(value))!==false)
		obj[attribute] = value;
	else
	{
		message = this.message ? this.message : '{attribute} is not a valid URL.';
		this.addError(obj,attribute,message);
	}	
};

/**
 * Проверяет является ли переданное значение валидным адресом URL.
 * Этот метод можно использовать отдельно от модели.
 * @return {(string|boolean}} Возвращает false, если значение не является корректным адресом URL,
 *     в противном случае возвращается строка с адресом URL, 
 *     дополненная при необходимости схемой {@see defaultScheme}
 */
CUrlValidator.prototype.validateValue = function(value)
{
	if (typeof value == 'string' && value.length < 2000)  // make sure the length is limited to avoid DOS attacks
	{
		var pattern, source, flags = '', tValue;

		if (this.defaultScheme && value.indexOf('://') < 0)
			value = this.defaultScheme+'://'+value;

		tValue = this.validateIDN ? url.format(url.parse(value)) : value;
			
		if (this.pattern instanceof RegExp) {
			source = this.pattern.source;
			
			if (this.pattern.global)
				flags +='g';
			if (this.pattern.ignoreCase)
				flags +='i';				
			if (this.pattern.multiline)
				flags +='m';
		} else {
			source = this.pattern[0];
			
			if (this.pattern[1])
				flags = this.pattern[1];
		}
		
		if (source.indexOf('{schemes}') >= 0)
			source = source.replace('{schemes}','('+this.validSchemes.join('|')+')');
		
		pattern = new RegExp(source, flags);
		
		if (tValue.match(pattern))
			return value;
	}
	
	return false;
};