const logger = require('../util/logger');

class AccountLinks {

  /** Constructor */
  constructor(accountLinks) {
    this.links = {};
  }

  /**
   * Add account link
   */
  addLink(link) {
    const leftAccountId = link.leftAccount.id;
    const rightAccountId = link.rightAccount.id;

    // There are different scenarios for accounts that are linked:
    // 1. Neither account has been previously linked
    // 2. One of the accounts has been previously linked
    // 3. Both accounts have been linked, and need to be merged
    //
    // To simplify, first consolidate down to the 3rd case:
    let leftRef = this.links[leftAccountId];
    if (!leftRef) {
      leftRef = [leftAccountId];
      this.links[leftAccountId] = leftRef;
    }
    let rightRef = this.links[rightAccountId];
    if (!rightRef) {
      rightRef = [rightAccountId];
      this.links[rightAccountId] = rightRef;
    }

    // And then merge all accountIds from the right to the left, updating
    // all references to point to the left.
    for (let accountId of rightRef) {
      leftRef.push(accountId);
      this.links[accountId] = leftRef;
    }
  }

  /**
   * Returns linked account ids
   * @param {String} accountId
   * @returns {Array} linked account ids
   */
  getLinkedAccounts(accountId) {
    return this.links[accountId] || [];
  }

}

module.exports = AccountLinks;
