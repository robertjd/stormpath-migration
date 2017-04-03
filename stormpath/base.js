class Base {
  constructor(filePath, json, options) {
    this.filePath = filePath;
    Object.assign(this, json);
    Object.assign(this, options);
  }
}

module.exports = Base;
