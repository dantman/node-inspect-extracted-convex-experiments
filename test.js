'use strict';
const { inspect } = require('./src/inspect.js');

console.log(inspect(new Error('This is a test')));
