const evmjs = require('./evm_js.js');
const evmwjs = require('./evmw_js.js');
const core = require('./core_js.js');
const jsBackend = require('../mal_backend.js');

const evmjs_ = {};

Object.keys(evmjs).forEach(fname => {
    evmjs_[fname + '_'] = evmjs[fname];
});

jsBackend.extend(evmjs_);
jsBackend.extend(evmwjs);
jsBackend.extend(core);

module.exports = jsBackend;
