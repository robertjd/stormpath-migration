const path = require('path');
const fs = require('fs');
const Account = require('./account');
const Base = require('./base');

/**
 * Returns a file iterator that will read the file and return the path and
 * file contents when traversed.
 * @param {String} dir
 * @param {Class} Klass
 * @returns {Iterator} {fullPath, json}
 */
function* fileIterator(dir, Klass) {
  const files = fs.readdirSync(dir, 'utf8');
  let i = 0;
  while(i < files.length) {
    const file = files[i++];
    if (path.extname(file) !== '.json') {
      continue;
    }
    const fullPath = `${dir}/${file}`;
    const json = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    yield new Klass(fullPath, json);
  }
}

class StormpathExport {

  constructor(stormpathBaseDir) {
    this.baseDir = stormpathBaseDir;
  }

  getAccounts() {
    return fileIterator(`${this.baseDir}/accounts`, Account);
  }

  getDirectories() {
    return fileIterator(`${this.baseDir}/directories`, Base);
  }

  getGroups() {
    return fileIterator(`${this.baseDir}/groups`, Base);
  }

  getOrganizations() {
    return fileIterator(`${this.baseDir}/organizations`, Base);
  }

}

module.exports = StormpathExport;
