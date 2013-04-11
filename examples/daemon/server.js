/**
 * Http server example
 *
 * To run the script use the command:
 * node --harmony run.js
 */

var Yiila = require('../../lib/'), 
	http = require('http'),
	path = require('path');

(function() {
	
	var logger = Yiila.getLogger();
	logger.autoFlushTimer = 60*1000;
	logger.autoDump = true;
	
	var app = Yiila.createApplication('CApplication', path.resolve(__dirname,'./config/server'));
	
	if (GLOBAL.YIILA_DEBUG)
		logger.autoFlush = 1;
	
	app.run();
	
	var params = app.getParams();
	
	var server = http.createServer(function (req, res) {
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.write('Yep, i am here');
		res.end();
		Yiila.trace('Got a request');
	});
	
	server.on('close', function() { 
		Yiila.log('Server closed', Yiila.CLogger.LEVEL_ERROR, 'server'); 
	});

	server.on('error', function(error) { 
		Yiila.log(error.message, Yiila.CLogger.LEVEL_ERROR, 'sever'); 
	});
	
	server.listen(params.port ? params.port : 8080);
}());
