const ConcurrencyPool = require('../util/concurrency-pool');
const ApiError = require('../util/api-error');
const config = require('../util/config');
const rs = require('../util/request-scheduler');
const logger = require('../util/logger');

async function addGroupsToApp(appInstanceId, groupIds) {
  logger.verbose(`Adding groupIds=${groupIds} to appInstanceId=${appInstanceId}`);
  const pool = new ConcurrencyPool(config.concurrencyLimit);
  return pool.each(groupIds, async (groupId) => {
    logger.verbose(`Adding groupId=${groupId} to appInstanceId=${appInstanceId}`);
    try {
      await rs.put({ url: `/api/v1/apps/${appInstanceId}/groups/${groupId}` });
      logger.created(`Assigned groupId=${groupId} to appInstanceId=${appInstanceId}`);
    } catch (err) {
      logger.error(new ApiError(`Failed to assign groupId=${groupId} to appInstanceId=${appInstanceId}`, err));
    }
  });
}

module.exports = addGroupsToApp;
