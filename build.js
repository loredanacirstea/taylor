const fs = require('fs');
const { compileTaylor } = require('./src/build_utils.js');

const BUILD_ROOT = './build/taylor';

const build = (buildRoot) => {
  const compiled = compileTaylor();
  fs.promises.writeFile(buildRoot + '.js', `const Taylor = ${JSON.stringify(compiled.evm)}

module.exports = Taylor;
  `);
}

build(BUILD_ROOT);
