const path = require('path');
const fs = require('fs');
const Account = require('./account');
const Base = require('./base');

/**
 * Returns a file iterator that will read the file and return the path and
 * file contents when traversed.
 * @param {String} dir
 * @param {Class} Klass
 * @param {Object} config
 * @returns {Iterator} {fullPath, json}
 */
function* fileIterator(dir, Klass, config) {
  const files = fs.readdirSync(dir, 'utf8');
  let i = 0;
  while(i < files.length) {
    const file = files[i++];
    if (path.extname(file) !== '.json') {
      continue;
    }
    const fullPath = `${dir}/${file}`;
    const json = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    yield new Klass(fullPath, json, config);
  }
}

class StormpathExport {

  constructor(config) {
    this.baseDir = config.stormPathBaseDir;
    this.config = config;
  }

  getAccounts() {
    return fileIterator(`${this.baseDir}/accounts`, Account, this.config);
  }

  getDirectories() {
    return fileIterator(`${this.baseDir}/directories`, Base, this.config);
  }

  getGroups() {
    return fileIterator(`${this.baseDir}/groups`, Base, this.config);
  }

  getOrganizations() {
    return fileIterator(`${this.baseDir}/organizations`, Base, this.config);
  }

}

module.exports = StormpathExport;
