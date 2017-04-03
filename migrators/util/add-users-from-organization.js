const addUsersToGroup = require('../../functions/add-users-to-group');
const logger = require('../../util/logger');
const stormpathExport = require('../../stormpath/stormpath-export');
const config = require('../../util/config');
const cache = require('./cache');

async function getOrganizationAccountStoreMap() {
  const mappings = stormpathExport.getOrganizationAccountStoreMappings();
  return mappings.mapToObject((mapping, map) => {
    const type = mapping.accountStoreType;
    const id = mapping.accountStoreId;
    let userIds;
    switch (type) {
    case 'groups':
      userIds = cache.groupUserMap[id];
      break;
    case 'directories':
      userIds = cache.directoryUserMap[id];
      break;
    default:
      throw new Error(`Unknown organization account store mapping type: ${type}`);
    }

    const orgId = mapping.organization.id;
    if (!map[orgId]) {
      map[orgId] = [];
    }
    if (userIds && userIds.length > 0) {
      map[orgId] = map[orgId].concat(userIds);
    }
  }, { limit: config.concurrencyLimit });
}

async function addUsersFromOrganization(orgId) {
  if (!cache.organizationAccountStoreMappings) {
    cache.organizationAccountStoreMap = await getOrganizationAccountStoreMap();
  }

  const groupId = cache.organizationMap[orgId];
  const userIds = cache.organizationAccountStoreMap[orgId];

  if (!userIds || userIds.length == 0) {
    return;
  }

  logger.info(`Adding ${userIds.length} users to Group id=${groupId}`);
  return addUsersToGroup(groupId, userIds);
}

module.exports = addUsersFromOrganization;
