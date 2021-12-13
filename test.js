const forever = require('forever-monitor');
var nativeFile = new(forever.Monitor)('./test.js');

console.log('Test');

nativeFile.start();
nativeFile.stop();
