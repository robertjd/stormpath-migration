const logger = require('../util/logger');

function warn(account, msg) {
  logger.warn(`Account id=${account.id} email=${account.email} ${msg}`);
}

class UnifiedAccounts {

  constructor(accountLinks) {
    this.accountLinks = accountLinks;
    this.emailMap = {};
    this.stormpathAccountIdMap = {};
  }

  addAccount(account) {
    const linkedAccountIds = this.accountLinks.getLinkedAccounts(account.id);

    // Verify account is not linked to a previously processed account with a
    // different email address
    const linkedAccounts = linkedAccountIds.map(id => this.stormpathAccountIdMap[id]);
    for (let linkedAccount of linkedAccounts) {
      if (linkedAccount && linkedAccount.email !== account.email) {
        warn(account, `is linked to id=${linkedAccount.id} email=${linkedAccount.email}, but email is different. Skipping.`);
        return;
      }
    }

    // Verify account does not have the same email as a previously processed
    // account that it is not linked to
    const emailAccount = this.emailMap[account.email];
    if (emailAccount && !linkedAccountIds.includes(emailAccount.id)) {
      warn(account, `has same email address as id=${emailAccount.id}, but is not linked. Skipping.`);
      return;
    }

    // If there is an existing account, merge it and return the merged account
    if (emailAccount) {
      emailAccount.merge(account);
      this.stormpathAccountIdMap[account.id] = emailAccount;
      logger.info(`Merged account id=${account.id} email=${account.email} into linked account id=${emailAccount.id}`);
      return emailAccount;
    }

    logger.silly(`Adding new account id=${account.id}`);
    this.emailMap[account.email] = account;
    this.stormpathAccountIdMap[account.id] = account;
    return account;
  }

  getAccounts() {
    return Object.values(this.emailMap);
  }

  getAccountsByEmail() {
    return this.emailMap;
  }

  getUserIdByAccountId(accountId) {
    const account = this.stormpathAccountIdMap[accountId];
    if (!account) {
      return null;
    }
    return account.getOktaUserId();
  }

  getMissingAccounts(accountIds) {
    return accountIds.filter(accountId => !this.getUserIdByAccountId(accountId));
  }

  getUserIdsByAccountIds(accountIds) {
    const userIds = [];
    for (let accountId of accountIds) {
      const userId = this.getUserIdByAccountId(accountId);
      if (userId) {
        userIds.push(userId);
      }
    }
    return userIds;
  }

}

module.exports = UnifiedAccounts;
