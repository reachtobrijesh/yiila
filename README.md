Yiila
=====

I haven't a time to learn different frameworks. They grow up faster than i can view them all. That's why i ported Yii framework to nodejs to have the same syntax from php to javascript. It is simplified version of Yii framework for javascript. Remember your version of nodejs must support V8 harmony proxy to run scripts which use Yiila.

To run any script with Yiila use the command:
```bash
node --harmony [path/to/your/file]
```

**Basic usage:**

```javascript
/**
 * To run the script use the command:
 * node --harmony <path/to/file>
 */
var Yiila = require('yiila');

(function() {
	// enable debug mode to view trace messages into the console
	GLOBAL.YIILA_DEBUG = true;

	var config = {
		'name': 'Test application';
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
```

At the present time Yiila implemented:
* Base application and console application (including demonized)
* Logging system
* Base model class
* Validators
* Cache classes (Memcached only)

To learn more about components see examples and source codes. Don't forget to vist official site of Yii framework.
