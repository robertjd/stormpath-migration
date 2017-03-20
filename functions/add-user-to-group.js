const logger = require('../util/logger');
const rs = require('../util/request-scheduler');

async function addUserToGroup(userId, groupId) {
  logger.verbose(`Trying to add uid=${userId} to gid=${groupId}`);
  try {
    await rs.put({ url: `/api/v1/groups/${groupId}/users/${userId}` });
    logger.created(`Group Membership uid=${userId} gid=${groupId}`);
  } catch (err) {
    logger.error(`Failed to add uid=${userId} to gid=${groupId}: ${err}`);
  }
}

module.exports = addUserToGroup;
