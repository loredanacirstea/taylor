const taylor = require('./taylor.js');
const bootstrap_functions = require('./bootstrap.js');
const deploy = require('./deploy.js');
const tests = require('../tests/json_tests/index.js');

taylor.bootstrap_functions = bootstrap_functions;
taylor.deploy = deploy.deploy;
taylor.bootstrap = deploy.bootstrap;
taylor.tests = tests;
module.exports = taylor;
