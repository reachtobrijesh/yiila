yiila
=====

I haven't a time to learn different frameworks. They grow up faster than i can view them all. That's why i ported Yii framework to nodejs to have the same syntax from php to javascript. It is simplified version of Yii framework for javascript. Remember your version of nodejs must support V8 harmony proxy to run scripts which use Yiila.

**Basic usage:**

```javascript
var Yiila = require('yiila');

(function() {
	var config = {
		'name': 'Test application';
		'preload': ['log'],
		'components': {
			'log': {
				'class': 'CLogRouter',
				'routes': [
					'class': 'CConsoleLogRoute'
				]
			}
		}
	};

	Yiila.createApplication('CApplication', config).run();
}())
```
