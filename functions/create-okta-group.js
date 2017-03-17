const log = require('debug')('log');

const GROUPS_PATH = '/api/v1/groups';

async function getExistingGroup(rs, name) {
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

async function updateExistingGroup(rs, group, description) {
  log(`Existing group found with name '${group.profile.name}' id=${group.id}`);

  if (description === group.profile.description) {
    log('Same description, no action');
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
    log(`Updated Okta group '${group.profile.name}' (id=${group.id})`);
    return group;
  } catch (err) {
    throw new Error(`Failed to update Okta Group '${group.profile.name}' (id=${group.id}): ${err}`);
  }
}

async function createNewGroup(rs, name, description) {
  log(`No groups found with name '${name}', creating`);
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
    log(`Created new Okta group '${name}' (id=${group.id})`);
    return group;
  } catch (err) {
    throw new Error(`Failed to create new group '${name}' ${err}`);
  }
}

async function createOktaGroup(rs, name, description) {
  log(`Trying to create okta group ${name}`);
  try {
    const group = await getExistingGroup(rs, name);
    return group
      ? await updateExistingGroup(rs, group, description)
      : await createNewGroup(rs, name, description);
  } catch (err) {
    console.error(err);
  }
}

module.exports = createOktaGroup;
