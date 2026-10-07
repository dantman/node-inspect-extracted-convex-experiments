'use strict';
const { query } = require('./_generated/server.js');
const { inspect } = require('../src/inspect.js');

export const test = query({
  args: {},
  handler: async () => {
    return inspect(new Error('This is a test'));
  },
});
