const logger = require('../util/logger');
const rs = require('../util/request-scheduler');
const ApiError = require('../util/api-error');

const IDP_PATH = '/api/v1/idps';

function getIdpJson(options) {
  return {
    type: options.type,
    name: options.name,
    protocol: {
      type: 'OAUTH2',
      scopes: options.scopes,
      credentials: {
        client: {
          client_id: options.creds.clientId,
          client_secret: options.creds.clientSecret
        }
      }
    },
    policy: {
      provisioning: {
        action: 'AUTO',
        profileMaster: true,
        groups: {
          action: 'NONE'
        }
      },
      accountLink: {
        filter: null,
        action: 'AUTO'
      },
      subject: {
        userNameTemplate: {
          template: 'idpuser.email',
          type: null
        },
        filter: null,
        matchType: 'EMAIL'
      },
      maxClockSkew: 0
    }
  };
}

async function getExistingIdp(name) {
  logger.verbose(`GET existing OAuth2 IDP name=${name}`);
  const idps = await rs.get({
    url: IDP_PATH,
    qs: {
      q: name
    }
  });
  const exactMatches = idps.filter(idp => idp.name === name);
  return exactMatches.length > 0 ? exactMatches[0] : null;
}

async function updateExistingIdp(id, json) {
  logger.verbose(`Updating existing OAuth2 IDP id=${id} name=${json.name}`);
  try {
    const updated = await rs.put({
      url: `${IDP_PATH}/${id}`,
      body: json
    });
    logger.updated(`OAuth2 IDP id=${id} name=${updated.name}`);
    return updated;
  } catch (err) {
    throw new ApiError(`Failed to update OAuth2 IDP id=${id} name=${json.name}`, err);
  }
}

async function createNewIdp(json) {
  logger.verbose(`Creating OAuth2 IDP name=${json.name}`);
  try {
    const created = await rs.post({
      url: IDP_PATH,
      body: json
    });
    logger.created(`OAuth2 IDP id=${created.id} name=${created.name}`);
    return created;
  } catch (err) {
    throw new ApiError(`Failed to create OAuth2 IDP name=${json.name}`, err);
  }
}

/**
 * Creates or updates OAuth2 IDP
 * @param {Object} options
 * @param {String} options.name
 * @param {String} options.type GOOGLE, FACEBOOK, LINKEDIN
 * @param {Object} options.creds
 * @param {String} options.creds.clientId
 * @param {String} options.creds.clientSecret
 * @param {Array} options.scopes
 */
async function createOAuth2Idp(options) {
  logger.verbose(`Trying to create OAuth2 IDP name=${options.name}`);
  const json = getIdpJson(options);
  const idp = await getExistingIdp(json.name);
  return idp
    ? updateExistingIdp(idp.id, json)
    : createNewIdp(json);
}

module.exports = createOAuth2Idp;
