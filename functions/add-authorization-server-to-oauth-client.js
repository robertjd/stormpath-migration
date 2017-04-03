const logger = require('../util/logger');
const rs = require('../util/request-scheduler');
const ApiError = require('../util/api-error');

const APPS_PATH = '/api/v1/apps';

function getAppIdFromClient(client) {
  const parts = client._links.app.href.split('/');
  return parts[parts.length - 1];
}

async function addAuthorizationServerToOAuthClient(as, client) {
  const details = `Authorization Server id=${as.id} to OAuth Client client_id=${client.client_id}`;
  logger.verbose(`Trying to add ${details}`);
  try {
    const appId = getAppIdFromClient(client);
    const app = await rs.get(`${APPS_PATH}/${appId}`);
    if (app.settings.notifications.vpn.message === as.id) {
      logger.exists(details);
      return;
    }
    logger.verbose('No map, creating');
    app.settings.notifications.vpn.message = as.id;
    const res = await rs.put({
      url: `${APPS_PATH}/${appId}`,
      body: app
    });
    logger.created(details);
  } catch (err) {
    throw new ApiError(`Failed to map ${details}`, err);
  }
}

module.exports = addAuthorizationServerToOAuthClient;
