const addUsersToGroup = require('../../functions/add-users-to-group');
const logger = require('../../util/logger');
const stormpathExport = require('../../stormpath/stormpath-export');
const cache = require('./cache');

async function addUsersFromGroup(stormpathGroupId) {
  if (!cache.groupMembershipMap) {
    cache.groupMembershipMap = await stormpathExport.getGroupMembershipMap();
  }
  const oktaGroupId = cache.groupMap[stormpathGroupId];
  const accountIds = cache.groupMembershipMap[stormpathGroupId];
  if (!accountIds || accountIds.length === 0) {
    return;
  }
  logger.info(`Adding ${accountIds.length} users to Okta group id=${oktaGroupId}`);
  const missing = cache.unifiedAccounts.getMissingAccounts(accountIds);
  for (let accountId of missing) {
    logger.error(`No Okta user for Stormpath accountId=${accountId}, skipping map to Okta groupId=${oktaGroupId}`);
  }
  const userIds = cache.unifiedAccounts.getUserIdsByAccountIds(accountIds);
  cache.groupUserMap[stormpathGroupId] = userIds;
  return addUsersToGroup(oktaGroupId, userIds);
}

module.exports = addUsersFromGroup;
