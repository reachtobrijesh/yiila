'use strict';
/**
 * @fileoverview Класс CStringValidator
 * @author mik.bulatov@gmail.com
 */
 
var Yiila = require('..');

/**
 * CStringValidator проверяет значение атрибута на соответствие указанной длине
 *
 * Запомните, что этот валидатор должен использоваться только со строковыми типами атрибутов.
 *
 * @constructor
 * @extends {CValidator}
 */
var CStringValidator = module.exports = function()
{
	return Yiila.CValidator.call(this);
};
Yiila.inherits(CStringValidator, Yiila.CValidator);

/**
 * @type {?number} максимальная длина. По умолчанию лимит не установлен.
 */
CStringValidator.prototype.max;
/**
 * @typr {?number} минимальная длина. По умолчанию лимит не установлен.
 */
CStringValidator.prototype.min;
/**
 * @type {?number} точная длина. По умолчанию не установлена.
 */
CStringValidator.prototype.is;
/**
 * @type {?string} сообщение об ошибке, когда длина слишком короткая.
 */
CStringValidator.prototype.tooShort;
/**
 * @type {?string} сщщбщение об ошибке, когда длина больше максимальной.
 */
CStringValidator.prototype.tooLong;

/**
 * @type {boolean} может ли быть значение атрибута пустым или null. 
 *     По умолчанию true (означает, что если значение пустое, оно валидно)
 */
CStringValidator.prototype.allowEmpty = true;

/**
 * Проверяет указанный объект.
 * @param {!Model} obj Модель, над которой производится проверка.
 * @param {Array} opt_attributes Список атрибутов, которые должны быть проверены.
 *     Если параметр не передан или = null, будут проверены все атрибуты,
 *     указанные в {@see attributes}.
 * @override
 */
CStringValidator.prototype.validateAttribute = function(obj,attribute) {

	var value = obj[attribute], message;
	
	if (this.allowEmpty && this.isEmpty(value))
		return;

	var length = value.length;

	if (this.min && length < this.min)
	{
		message = this.tooShort ? this.tooShort : '{attribute} is too short (minimum is {min} characters).';
		this.addError(obj,attribute,message,{'{min}':this.min});
	}
	if (this.max && length > this.max)
	{
		message = this.tooShort ? this.tooShort : '{attribute} is too long (maximum is {max} characters).';
		this.addError(obj,attribute,message,{'{max}':this.max});
	}
	if (this.is && length !== this.is)
	{
		message=this.tooShort ? this.tooShort : '{attribute} is of the wrong length (should be {length} characters).';
		this.addError(obj,attribute,message,{'{length}':this.is});
	}
};