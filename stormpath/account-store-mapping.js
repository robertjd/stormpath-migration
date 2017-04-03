const Base = require('./base');

class AccountStoreMapping extends Base {

  get accountStoreType() {
    const parts = this.accountStore.href.split('/');
    return parts[parts.length - 2];
  }

  get accountStoreId() {
    return this.accountStore.id;
  }

}

module.exports = AccountStoreMapping;
