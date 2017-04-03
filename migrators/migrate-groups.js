const createOktaGroup = require('../functions/create-okta-group');
const addUsersToGroup = require('../functions/add-users-to-group');
const logger = require('../util/logger');
const stormpathExport = require('../stormpath/stormpath-export');
const config = require('../util/config');
const addUsersFromGroup = require('./util/add-users-from-group');
const cache = require('./util/cache');

async function migrateGroup(membershipMap, stormpathGroup) {
  const lg = logger.group(`Stormpath group id=${stormpathGroup.id} name=${stormpathGroup.name}`);
  try {
    const name = `group:${stormpathGroup.directory.id}:${stormpathGroup.name}`;
    const description = stormpathGroup.description;
    const oktaGroup = await createOktaGroup(name, description);
    cache.groupMap[stormpathGroup.id] = oktaGroup.id;
    await addUsersFromGroup(stormpathGroup.id);
  } catch (err) {
    logger.error(err);
  } finally {
    lg.end();
  }
}

async function migrateGroups() {
  logger.header('Starting groups import');

  const stormpathGroups = stormpathExport.getGroups();
  logger.info(`Importing ${stormpathGroups.length} groups`);

  const membershipMap = await stormpathExport.getGroupMembershipMap();
  const migrate = migrateGroup.bind(null, membershipMap);
  return stormpathGroups.each(migrate, { limit: 1 });
}

module.exports = migrateGroups;
