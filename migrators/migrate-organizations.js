const Promise = require('bluebird');
const createOktaGroup = require('../functions/create-okta-group');
const logger = require('../util/logger');
const stormpathExport = require('../stormpath/stormpath-export');
const config = require('../util/config');
const addUsersFromOrganization = require('./util/add-users-from-organization');
const cache = require('./util/cache');

async function migrateOrg(org) {
  const lg = logger.group(`Stormpath organization id=${org.id} name=${org.name}`);
  try {
    const name = `org:${org.name}`;
    const description = org.nameKey;
    const group = await createOktaGroup(name, description);
    cache.organizationMap[org.id] = group.id;
    await addUsersFromOrganization(org.id);
  } catch (err) {
    logger.error(err);
  } finally {
    lg.end();
  }
}

function migrateOrganizations() {
  logger.header('Starting organizations import');
  const organizations = stormpathExport.getOrganizations();
  logger.info(`Importing ${organizations.length} organizations`);
  return organizations.each(migrateOrg, { limit: 1 });
}

module.exports = migrateOrganizations;
