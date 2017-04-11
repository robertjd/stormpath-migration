const addUsersToGroup = require('../../functions/add-users-to-group');
const logger = require('../../util/logger');
const cache = require('./cache');

function addUsersFromDirectory(directoryId) {
  const userIds = cache.directoryUserMap[directoryId];
  const groupId = cache.directoryMap[directoryId];

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return;
  }

  logger.info(`Adding ${userIds.length} users to Group id=${groupId}`);
  return addUsersToGroup(groupId, userIds);
}

module.exports = addUsersFromDirectory;
