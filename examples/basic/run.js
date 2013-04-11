/**
 * To run the script use the command:
 * node --harmony run.js
 */

var Yiila = require('../../lib/index.js');

(function(){
	// enable debug mode to view trace messages into the console
	GLOBAL.YIILA_DEBUG = true;

	var config = {
		'name': 'Test application',
		'preload': ['log'],
		'components': {
			'log': {
				'class': 'CLogRouter',
				'routes': [
					{
						'class': 'CConsoleLogRoute',
						'enabled': GLOBAL.YIILA_DEBUG || false
					}
				]
			}
		}
	};

	Yiila.createApplication('CApplication', config).run();
}());
