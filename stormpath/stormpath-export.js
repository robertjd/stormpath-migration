const path = require('path');
const fs = require('fs');
const AccountLinks = require('./account-links');
const Account = require('./account');
const AccountStoreMapping = require('./account-store-mapping');
const Base = require('./base');
const Directory = require('./directory');
const logger = require('../util/logger');
const config = require('../util/config');
const ConcurrencyPool = require('../util/concurrency-pool');
const FileIterator = require('./file-iterator');

class StormpathExport {

  constructor() {
    this.baseDir = config.stormPathBaseDir;
  }

  async getAccountLinks() {
    const accountLinks = new AccountLinks();
    const linkFiles = new FileIterator(`${this.baseDir}/accountLinks`, Base);
    await linkFiles.each((file) => accountLinks.addLink(file));
    return accountLinks;
  }

  async getAccounts() {
    const apiKeys = new FileIterator(`${this.baseDir}/apiKeys`, Base);
    logger.verbose(`Mapping ${apiKeys.length} apiKeys to accounts`);
    const accountApiKeys = await apiKeys.mapToObject((apiKey, map) => {
      if (apiKey.status !== 'ENABLED') {
        return;
      }
      const accountId = apiKey.account.id;
      if (!map[accountId]) {
        map[accountId] = [];
      }
      map[accountId].push({ id: apiKey.id, secret: apiKey.secret });
    });
    return new FileIterator(`${this.baseDir}/accounts`, Account, { accountApiKeys });
  }

  getDirectories() {
    return new FileIterator(`${this.baseDir}/directories`, Directory);
  }

  getApplications() {
    return new FileIterator(`${this.baseDir}/applications`, Base);
  }

  getAccountStoreMappings() {
    return new FileIterator(`${this.baseDir}/accountStoreMappings`, AccountStoreMapping);
  }

  getGroups() {
    return new FileIterator(`${this.baseDir}/groups`, Base);
  }

  async getGroupMembershipMap() {
    const memberships = new FileIterator(`${this.baseDir}/groupMemberships`, Base);
    logger.verbose(`Mapping ${memberships.length} group memberships`);
    return memberships.mapToObject((membership, map) => {
      const groupId = membership.group.id;
      if (!map[groupId]) {
        map[groupId] = [];
      }
      map[groupId].push(membership.account.id);
    });
  }

  getOrganizations() {
    return new FileIterator(`${this.baseDir}/organizations`, Base);
  }

  getOrganizationAccountStoreMappings() {
    return new FileIterator(`${this.baseDir}/organizationAccountStoreMappings`, AccountStoreMapping);
  }

}

module.exports = new StormpathExport();
