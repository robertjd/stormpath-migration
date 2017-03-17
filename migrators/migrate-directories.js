const Promise = require('bluebird');
const log = require('debug')('log');
const warn = require('debug')('warn');
const createOktaGroup = require('../functions/create-okta-group');

function migrateCloudDirectory(rs, directory) {
  const name = `dir:${directory.name}`;
  const description = directory.description;
  return createOktaGroup(rs, name, description);
}

function migrateSamlDirectory(rs, directory) {
  log(`Not implemented yet: ${directory.provider.providerId}`);
  return Promise.resolve();
}

function migrateSocial(rs, directory) {
  log(`Not implemented yet: ${directory.provider.providerId}`);
  return Promise.resolve();
}

function migrate(rs, stormpathExport) {
  const directories = stormpathExport.getDirectories();
  const pending = [];
  for (let directory of directories) {
    const json = directory.json;
    const providerName = json.provider.providerId;
    switch (providerName) {
    case 'stormpath':
      pending.push(migrateCloudDirectory(rs, json));
      break;
    case 'saml':
      pending.push(migrateSamlDirectory(rs, json));
      break;
    case 'facebook':
    case 'google':
    case 'linkedin':
      pending.push(migrateSocialDirectory(rs, json));
      break;
    case 'ad':
    case 'ldap':
      // We should include a link to some documentation they can use to setup
      // the AD agent the run the import.
      warn('${providerName} directories must be imported with the Okta agent');
      break;
    default:
      // github, twitter
      warn(`We do not support migrating the '${providerName}' directory type`);
      break;
    }
  }
  return Promise.all(pending);
}

module.exports = migrate;
