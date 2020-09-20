const evm = require('./evm.js');
const core = require('./core.js');
const stored_base = require('./stored_base.js');
const stored_regex = require('./stored_regex.js');
const stored = Object.assign({}, stored_base, stored_regex);

const both = require('./both.js');
const web3 = require('./web3.js');
const js = require('./js.js');

module.exports = { evm, core, stored, both, web3, js };
