const Promise = require('bluebird');
const createOktaGroup = require('../functions/create-okta-group');
const logger = require('../util/logger');
const stormpathExport = require('../stormpath/stormpath-export');

function migrateGroups() {
  logger.header('Starting groups import');
  logger.warn('TODO: assign users');
  const groups = stormpathExport.getGroups();
  const pending = [];
  for (let group of groups) {
    const name = `group:${group.json.directory.id}:${group.json.name}`;
    const description = group.json.description;
    pending.push(createOktaGroup(name, description));
  }
  return Promise.all(pending);
}

module.exports = migrateGroups;
