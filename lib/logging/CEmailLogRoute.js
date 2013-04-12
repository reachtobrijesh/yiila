'use strict';

/**
 * @fileoverview CEmailLogRoute class file.
 * @author mik.bulatov@gmail.com
 */

var Yiila = require('..'),
	wrap = require('wordwrap')(70),
	spawn = require('child_process').spawn;

/**
 * CEmailLogRoute sends selected log messages to email addresses.
 *
 * The target email addresses may be specified via {@see setEmails} property.
 * Optionally, you may set the email {@see setSubject}, the
 * {@see setSentFrom} address and any additional {@see setHeaders}.
 * 
 * @constructor
 * @extends {CLogRoute}
 */
var CEmailLogRoute = module.exports = function() {
	return Yiila.CLogRoute.call(this);
};
Yiila.inherits(CEmailLogRoute,Yiila.CLogRoute);

/**
 * @type {boolean} set this property to true value in case log data you're going to send through emails contains
 */
CEmailLogRoute.prototype.utf8=false;
/**
 * @type {!Array} list of destination email addresses.
 * @private
 */
CEmailLogRoute.prototype._email=[];
/**
 * @type {?string} email subject
 */
CEmailLogRoute.prototype._subject=null;
/**
 * @var {?string} email sent from address
 */
CEmailLogRoute.prototype._from=null;

/**
 * Sends log messages to specified email addresses.
 * @param {!Array} logs list of log messages
 */
CEmailLogRoute.prototype.processLogs = function(logs) {
	var message='', subject, self = this;
	
	logs.forEach((function(log) {
		message += this.formatLogMessage(log[0],log[1],log[2],log[3]);
	}).bind(this));

	message = wrap(message);
	subject = this.getSubject();
	
	if (!subject)
		subject = Yiila.t('yiila', Yiila.app().name+' log');
	
	this.getEmails().forEach(function(email){
		self.sendEmail(email,subject,message);
	});
};

/**
 * Sends an email.
 * @param {string} email single email address
 * @param {string} subject email subject
 * @param {string} message email content
 */
CEmailLogRoute.prototype.sendEmail = function(email,subject,message) {
	var from, sendmail;
	
	var headers = [
   	 	"MIME-Version: 1.0",
   	 	"Date: "+new Date().toUTCString(),
   	 	"To: "+email,
   	 	"Subject: "+ (this.utf8 ? "=?UTF-8?B?"+new Buffer(subject).toString('base64')+"?=" : subject),
   	 	"Content-Type: text/plain; charset=utf-8"
   	];
	
	if (from=this.getSentFrom())
	{
		var matches = from.match(/([^<]*)<([^>]*)>/);
		if (matches.length == 3) {
			var name=this.utf8 ? '=?UTF-8?B?'+new Buffer(matches[1].trim()).toString('base64')+'?=' : matches[1].trim();
			from=matches[2].trim();
			headers.push("From: "+name+" <"+from+">");
		} else
			headers.push("From: "+from);
		
		headers.push("Reply-To: "+from);
	}
	
	sendmail = spawn(Yiila.app().sendmail, ['-t', '-i']);
	sendmail.stdin.setEncoding = 'utf-8';
	sendmail.stdin.write(headers.join("\r\n")+"\r\n\r\n");
	sendmail.stdin.write(message); 
	sendmail.stdin.end();
};

/**
 * @return {!Array} list of destination email addresses
 */
CEmailLogRoute.prototype.getEmails = function() {
	return this._email;
};

/**
 * @param {!Array|string} value list of destination email addresses. If the value is
 * a string, it is assumed to be comma-separated email addresses.
 */
CEmailLogRoute.prototype.setEmails = function(value) {
	if(Array.isArray(value))
		this._email=value;
	else
		this._email=value.split(/[\s,]+/);
};

/**
 * @return {string} email subject. Defaults to CEmailLogRoute::DEFAULT_SUBJECT
 */
CEmailLogRoute.prototype.getSubject = function() {
	return this._subject;
};

/**
 * @param {string} value email subject.
 */
CEmailLogRoute.prototype.setSubject = function(value) {
	this._subject=value;
};

/**
 * @return {?string} send from address of the email
 */
CEmailLogRoute.prototype.getSentFrom = function() {
	return this._from;
};

/**
 * @param {string} value Send from address of the email
 */
CEmailLogRoute.prototype.setSentFrom = function(value) {
	this._from = value;
};

/**
 * @return {!Array} additional headers to use when sending an email.
 */
CEmailLogRoute.prototype.getHeaders = function() {
	return this._headers;
};

/**
 * @param {Array|string} value List of additional headers to use when sending an email.
 * If the value is a string, it is assumed to be line break separated headers.
 */
CEmailLogRoute.prototype.setHeaders = function(value) {
	this._headers=Array.isArray(value) ? value : value.split(/\r\n|\n/);
};