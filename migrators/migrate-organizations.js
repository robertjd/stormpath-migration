const Promise = require('bluebird');
const createOktaGroup = require('../functions/create-okta-group');
const logger = require('../util/logger');
const stormpathExport = require('../stormpath/stormpath-export');

function migrateOrganizations() {
  logger.header('Starting organizations import');
  logger.warn('TODO: assign users');
  const orgs = stormpathExport.getOrganizations();
  const pending = [];
  for (let org of orgs) {
    const name = `org:${org.json.name}`;
    const description = org.json.nameKey;
    pending.push(createOktaGroup(name, description));
  }
  return Promise.all(pending);
}

module.exports = migrateOrganizations;
