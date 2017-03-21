const logger = require('../util/logger');
const rs = require('../util/request-scheduler');

const AS_PATH = '/api/v1/as';

async function getExistingAuthorizationServer(name) {
  logger.verbose(`Getting existing authorization server name=${name}`);
  try {
    const authorizationServers = await rs.get({
      url: AS_PATH,
      qs: {
        q: name
      }
    });
    return authorizationServers.find(as => as.name === name);
  } catch (err) {
    throw new Error(`Failed to get authorization servers: ${err}`);
  }
}

async function updateExistingAuthorizationServer(as) {
  logger.exists(`Found matching Authorization Server id=${as.id} name=${as.name}`);
  return as;
}

async function createNewAuthorizationServer(name, defaultResourceUri) {
  logger.verbose(`No authorization servers found with name=${name}`);
  try {
    const as = await rs.post({
      url: AS_PATH,
      body: {
        name,
        defaultResourceUri,
      }
    });
    logger.created(`AuthorizationServer id=${as.id} name=${name}`);
    return as;
  } catch (err) {
    throw new Error(`Failed to create authorization server name=${name}: ${err}`);
  }
}

async function createAuthorizationServer(name, defaultResourceUri) {
  logger.verbose(`Trying to create authorization server`);
  const as = await getExistingAuthorizationServer(name);
  return as
    ? updateExistingAuthorizationServer(as)
    : createNewAuthorizationServer(name, defaultResourceUri);
}

module.exports = createAuthorizationServer;
