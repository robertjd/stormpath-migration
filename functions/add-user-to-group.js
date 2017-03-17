const log = require('debug')('log');

async function addUserToGroup(rs, userId, groupId) {
  log(`Trying to add userId=${userId} to groupId=${groupId}`);
  const options = {
    url: `/api/v1/groups/${groupId}/users/${userId}`
  };
  try {
    await rs.put(options);
    log(`Added userId=${userId} to groupId=${groupId}`);
  } catch (err) {
    console.error(`Failed to add userId=${userId} to groupId=${groupId}: ${err}`);
  }
}

module.exports = addUserToGroup;
