'use strict';
/**
 * @fileoverview Класс CRequiredValidator
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..');

/**
 * CRequiredValidator проверяет не содержит ли указанный атрибут пустое значение или
 * значение null
 *
 * @constructor
 * @extends {CValidator}
 */
var CRequiredValidator = module.exports = function()
{
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CRequiredValidator, Yiila.CValidator);

/**
 * @type {*} значение, которое должен иметь атрибут.
 * Если свойство не задано или установлено в null, валидатор будет проверять
 * атрибут, чтобы последний не был null или не имел пустое значение.
 * Если свойство корректно задано, валидатор будет сравнивать значение на соответствие этому значению.
 * По умолчанию не задано.
 */
CRequiredValidator.prototype.requiredValue;

/**
 * @type {boolean} нужно ли использовать строгое сравнение со значением {@see requiredValue}.
 * Если это свойство имеет значение true, тогда и значение и тип атрибута должны совпадать с {@see requiredValue}.
 * По умолчанию - false, то есть проверяется только значение, без проверки типов.
 * Это свойство импользуется, только если {@see requiredValue} установлено и не равно null.
 */
CRequiredValidator.prototype.strict = false;

/**
 * Проверяет указанный объект.
 * @param {!Model} obj Модель, над которой производится проверка.
 * @param {Array} opt_attributes Список атрибутов, которые должны быть проверены.
 *     Если параметр не передан или = null, будут проверены все атрибуты,
 *     указанные в {@see attributes}.
 * @override
 */
CRequiredValidator.prototype.validateAttribute = function(obj,attribute) 
{
	var value = obj[attribute] ? obj[attribute] : null;
	var message;
	
	if (this.requiredValue)
	{
		if (!this.strict && value != this.requiredValue || this.strict && value !== this.requiredValue)
		{
			message = this.message ? this.message : '{attribute} must be {value}.';
			this.addError(obj,attribute,message,{'{value}':this.requiredValue});
		}
	}
	else if(this.isEmpty(value,true))
	{
		message = this.message ? this.message : '{attribute} cannot be blank.';
		this.addError(obj,attribute,message);
	}
};