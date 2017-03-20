const Promise = require('bluebird');
const createOAuthClient = require('../functions/create-oauth-client');
const createAuthorizationServer = require('../functions/create-authorization-server');
const addAuthorizationServerToOAuthClient = require('../functions/add-authorization-server-to-oauth-client');
const stormpathExport = require('../stormpath/stormpath-export');
const logger = require('../util/logger');

async function migrateApplications() {
  logger.header('Starting applications import');
  logger.warn('TODO: assign users');
  const applications = stormpathExport.getApplications();
  for (let application of applications) {
    try {
      const name = `app:${application.json.name}`;
      const [client, as] = await Promise.all([
        createOAuthClient(name),
        createAuthorizationServer(name)
      ]);
      await addAuthorizationServerToOAuthClient(as, client);
    } catch (err) {
      logger.error(err);
    }
  }
}

module.exports = migrateApplications;
