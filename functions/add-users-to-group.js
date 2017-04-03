const ConcurrencyPool = require('../util/concurrency-pool');
const ApiError = require('../util/api-error');
const logger = require('../util/logger');
const rs = require('../util/request-scheduler');
const config = require('../util/config');

async function addUsersToGroup(groupId, userIds) {
  const pool = new ConcurrencyPool(config.concurrencyLimit);
  return pool.each(userIds, async (userId) => {
    try {
      await rs.put({ url: `/api/v1/groups/${groupId}/users/${userId}` });
      logger.created(`Group Membership uid=${userId} gid=${groupId}`);
    } catch (err) {
      logger.error(new ApiError(`Failed to add uid=${userId} to gid=${groupId}`, err));
    }
  });
}

module.exports = addUsersToGroup;
