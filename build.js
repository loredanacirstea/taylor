const fs = require('fs');
const { compileTaylor } = require('./src/build_utils.js');

const BUILD_ROOT = './build/maltay';

const build = (buildRoot) => {
  const compiled = compileTaylor();
  fs.promises.writeFile(buildRoot + '.json', JSON.stringify(compiled.evm));
}

build(BUILD_ROOT);
