const logger = require('../util/logger');
const rs = require('../util/request-scheduler');

const APPS_PATH = '/api/v1/apps';

function getAppIdFromClient(client) {
  const parts = client._links.app.href.split('/');
  return parts[parts.length - 1];
}

async function addAuthorizationServerToOAuthClient(as, client) {
  logger.verbose(`Trying to add authorization server to OAuth Client app as_id=${as.id} client_id=${client.client_id}`);
  try {
    const appId = getAppIdFromClient(client);
    const app = await rs.get(`${APPS_PATH}/${appId}`);
    if (app.settings.notifications.vpn.message === as.id) {
      logger.exists(`Authorization server is already mapped to OAuth Client app as_id=${as.id} client_id=${client.client_id}`);
      return;
    }
    logger.verbose('No map, creating');
    app.settings.notifications.vpn.message = as.id;
    const res = await rs.put({
      url: `${APPS_PATH}/${appId}`,
      body: app
    });
    logger.created(`Mapping between Authorization Server and OAuth Client app as_id=${as.id} client_id=${client.client_id}`);
  } catch (err) {
    logger.error(err);
  }
}

module.exports = addAuthorizationServerToOAuthClient;
