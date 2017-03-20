const logger = require('../util/logger');
const rs = require('../util/request-scheduler');

const GROUPS_PATH = '/api/v1/groups';

async function getExistingGroup(name) {
  logger.verbose(`Getting existing group name=${name}`);
  const groups = await rs.get({
    url: GROUPS_PATH,
    qs: {
      q: name
    }
  });
  const exactMatches = groups.filter(group => group.profile.name === name);
  if (exactMatches.length > 1) {
    throw new Error(`Found too many Okta groups matching name=${name}`);
  }
  return exactMatches.length === 1 ? exactMatches[0] : null;
}

async function updateExistingGroup(group, description) {
  logger.verbose(`Existing group found with name '${group.profile.name}' id=${group.id}`);

  if (description === group.profile.description) {
    logger.exists(`Found matching Group id=${group.id} name=${group.profile.name}`);
    return;
  }

  try {
    const group = await rs.put({
      url: `${GROUPS_PATH}/${group.id}`,
      body: {
        profile: {
          name: group.profile.name,
          description
        }
      }
    });
    logger.updated(`Group id=${group.id} name=${group.profile.name}`);
    return group;
  } catch (err) {
    throw new Error(`Failed to update okta group name=${group.profile.name} id=${group.id}: ${err}`);
  }
}

async function createNewGroup(name, description) {
  logger.verbose(`No groups found with name=${name}`);
  try {
    const group = await rs.post({
      url: GROUPS_PATH,
      body: {
        profile: {
          name,
          description
        }
      }
    });
    logger.created(`Group id=${group.id} name=${name}`);
    return group;
  } catch (err) {
    throw new Error(`Failed to create Group name=${name}: ${err}`);
  }
}

async function createOktaGroup(name, description) {
  logger.verbose(`Trying to create okta group ${name}`);
  try {
    const group = await getExistingGroup(name);
    return group
      ? updateExistingGroup(group, description)
      : createNewGroup(name, description);
  } catch (err) {
    logger.error(err);
  }
}

module.exports = createOktaGroup;
