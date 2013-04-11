GLOBAL.YIILA_DEBUG = true;

module.exports = {
	'name': 'Test server',
	'preload': ['log'],
	'components': {
		'log': {
			'class': 'CLogRouter',
			'routes': [
				{
					'class': 'CFileLogRoute',
					'logPath': './runtime',
					'logFile': 'server.error.log',
					'levels': 'error'
				},
				{
					'class': 'CFileLogRoute',
					'logPath': './runtime',
					'logFile': 'server.info.log',
					'levels': 'trace,warning,info'
				}
			]
		}
	},
	'params': {
		'port': 8080
	}
};
