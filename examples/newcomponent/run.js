/**
 * The example of using your own component with Yiila
 *
 * To run the script use the command:
 * node --harmony run.js
 */

var Yiila = require('../../lib/'),
	path = require('path');

(function() {
	
	GLOBAL.YIILA_DEBUG = true;
	
	var config = {
		'name': 'Test of new component',
		'preload': ['log'],
		'import': ['mycomps.*'],
		'components': {
			'log': {
				'class': 'CLogRouter',
				'routes': [
					{
						'class': 'CConsoleLogRoute',
						'enabled': GLOBAL.YIILA_DEBUG || false
					}
				]
			},
			'webpage': {
				'class': 'mycomps.WebPage'
			}
		}
	};

	Yiila.setPathOfAlias('mycomps', path.resolve(__dirname,'./components'));

	var app = Yiila.createApplication('CApplication', config);
	
	var logger = Yiila.getLogger();
	logger.autoDump = true;
	if (GLOBAL.YIILA_DEBUG)
		logger.autoFlush = 1;
	
	app.run();
	
	var webpage = app.getComponent('webpage');

	webpage.load('http://sphinxsearch.com/', function(err, response, document) {
		if (err) {
			Yiila.log(err.message, 'error', 'examples');
		} else {
			// do some work with DOM
			Yiila.log('The page was loaded and Dom structure is ready', 'info');
			webpage.close();
		}
	});
}());
