const logger = require('../util/logger');
const rs = require('../util/request-scheduler');

const CLIENTS_PATH = '/oauth2/v1/clients';

async function getOAuthClient(name) {
  logger.verbose(`Getting existing OAuth Client client_name=${name}`);
  const clients = await rs.get({
    url: CLIENTS_PATH,
    qs: {
      q: name
    }
  });
  const exactMatches = clients.filter(client => client.client_name === name);
  if (exactMatches.length > 1) {
    throw new Error(`Found too many OAuth Clients matching client_name=${name}`);
  }
  return exactMatches.length === 1 ? exactMatches[0] : null;
}

async function updateOAuthClient(client) {
  logger.exists(`Found matching OAuth Client client_id=${client.client_id} client_name=${client.client_name}`);
  return client;
}

async function createNewOAuthClient(name) {
  logger.verbose(`No OAuth clients found with client_name=${name}`);
  try {
    // Question: Is it possible to create a client without specifying
    // redirect_uris, or asking for implicit/code flows? Do we need these?
    const client = await rs.post({
      url: CLIENTS_PATH,
      body: {
        'client_name': name,
        'response_types': [
          'code',
          'token',
          'id_token'
        ],
        'grant_types': [
          'authorization_code',
          'implicit',
          'password',
          'refresh_token'
        ],
        'redirect_uris': ['https://www.okta.com/redirect-not-provided'],
        'token_endpoint_auth_method': 'client_secret_basic',
        'application_type': 'web'
      }
    });
    logger.created(`OAuth Client client_id=${client.client_id} client_name=${name}`);
    return client;
  } catch (err) {
    throw new Error(`Failed to create OAuth Client client_name=${name}: ${err}`);
  }
}

async function createOAuthClient(name) {
  const client = await getOAuthClient(name);
  return client ? updateOAuthClient(client) : createNewOAuthClient(name);
}

module.exports = createOAuthClient;
