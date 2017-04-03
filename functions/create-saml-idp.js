const logger = require('../util/logger');
const rs = require('../util/request-scheduler');
const ApiError = require('../util/api-error');

const IDP_PATH = '/api/v1/idps';
const KEY_PATH = `${IDP_PATH}/credentials/keys`;

async function addCertToKeyStore(signingCert) {
  logger.verbose(`Trying to add cert for SAML IDP to keyStore`);
  const keys = await rs.get(KEY_PATH);
  for (let key of keys) {
    if (signingCert === key.x5c[0]) {
      logger.exists(`Signing cert for SAML IDP kid=${key.kid}`);
      return key.kid;
    }
  }
  const res = await rs.post({
    url: KEY_PATH,
    body: {
      x5c: [signingCert]
    }
  });
  logger.created(`Signing cert for SAML IDP kid=${res.kid}`);
  return res.kid;
}

function getIdpJson(options, kid) {
  // TODO: Verify that these are the correct properties to post
  return {
    type: 'SAML2',
    name: options.name,
    protocol: {
      type: 'SAML2',
      endpoints: {
        sso: {
          url: options.ssoLoginUrl,
          binding: 'HTTP-REDIRECT'
        },
        acs: {
          binding: 'HTTP-POST',
          type: 'INSTANCE'
        }
      },
      algorithms: {
        request: {
          signature: {
            algorithm: options.requestSignatureAlgorithm,
            scope: 'REQUEST'
          }
        },
        response: {
          signature: {
            algorithm: 'SHA-256',
            scope: 'ANY'
          }
        }
      },
      credentials: {
        trust: {
          issuer: options.ssoLoginUrl,
          kid
        }
      }
    },
    policy: {
      accountLink: {
        action: 'AUTO'
      },
      maxClockSkew: 120000,
      provisioning: {
        action: 'AUTO',
        groups: {
          action: 'NONE'
        }
      },
      subject: {
        filter: '',
        matchType: 'EMAIL',
        userNameTemplate: {
          template: 'idpuser.subjectNameId'
        }
      }
    }
  };
}

async function getExistingIdp(name) {
  logger.verbose(`GET existing SAML IDP name=${name}`);
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
  logger.verbose(`Updating existing SAML IDP id=${id} name=${json.name}`);
  try {
    const updated = await rs.put({
      url: `${IDP_PATH}/${id}`,
      body: json
    });
    logger.updated(`SAML IDP id=${id} name=${updated.name}`);
    return updated;
  } catch (err) {
    throw new ApiError(`Failed to update SAML IDP id=${id} name=${json.name}`, err);
  }
}

async function createNewIdp(json) {
  logger.verbose(`Creating SAML IDP name=${json.name}`);
  try {
    const created = await rs.post({
      url: IDP_PATH,
      body: json
    });
    logger.created(`SAML IDP id=${created.id} name=${created.name}`);
    return created;
  } catch (err) {
    throw new ApiError(`Failed to create SAML IDP name=${json.name}`, err);
  }
}

async function createSamlIdp(options) {
  logger.verbose(`Trying to create SAML IDP name=${options.name}`);
  const kid = await addCertToKeyStore(options.signingCert);
  const json = getIdpJson(options, kid);
  const idp = await getExistingIdp(json.name);
  return idp
    ? updateExistingIdp(idp.id, json)
    : createNewIdp(json);
}

module.exports = createSamlIdp;
