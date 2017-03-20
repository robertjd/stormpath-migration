const Promise = require('bluebird');
const logger = require('../util/logger');
const rs = require('../util/request-scheduler');
const stormpathExport = require('../stormpath/stormpath-export');
const createOktaGroup = require('../functions/create-okta-group');

function migrateCloudDirectory(directory) {
  const name = `dir:${directory.name}`;
  const description = directory.description;
  return createOktaGroup(name, description);
}

function migrateSamlDirectory(directory) {
  logger.error(`Not implemented yet: ${directory.provider.providerId}`);
  return Promise.resolve();
}

function migrateSocial(directory) {
  logger.error(`Not implemented yet: ${directory.provider.providerId}`);
  return Promise.resolve();
}

function migrateDirectories() {
  logger.header('Starting directories import');
  logger.warn('TODO: assign users');
  logger.warn('TODO: social import');
  logger.warn('TODO: saml import');
  const directories = stormpathExport.getDirectories();
  const pending = [];
  for (let directory of directories) {
    const json = directory.json;
    const providerName = json.provider.providerId;
    switch (providerName) {
    case 'stormpath':
      pending.push(migrateCloudDirectory(json));
      break;
    case 'saml':
      pending.push(migrateSamlDirectory(json));
      break;
    case 'facebook':
    case 'google':
    case 'linkedin':
      pending.push(migrateSocialDirectory(json));
      break;
    case 'ad':
    case 'ldap':
      // We should include a link to some documentation they can use to setup
      // the AD agent the run the import.
      logger.warn('${providerName} directories must be imported with the Okta agent');
      break;
    default:
      // github, twitter
      logger.warn(`We do not support migrating the '${providerName}' directory type`);
      break;
    }
  }
  return Promise.all(pending);
}

module.exports = migrateDirectories;
