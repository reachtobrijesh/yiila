/**
 * This script allow to start (stop,restart) http server as daemon.
 * See console output to view how to write correct command line.
 *
 * Check runtime subdirectory to view log files after the server was started.
 * By default the server will use 8080 port to accept incoming connections.
 *
 * To run the script use the command:
 * node --harmony run.js
 */

var Yiila = require('../../lib/');

(function() {
	// This is the console application
	Yiila.createConsoleApplication('./config/console.js').run();
})();
