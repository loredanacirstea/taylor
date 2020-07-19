const fs = require('fs');
const { compileTaylorAndWrite } = require('./src/build_utils.js');

const BUILD_ROOT = './build/taylor';
compileTaylorAndWrite(BUILD_ROOT);
