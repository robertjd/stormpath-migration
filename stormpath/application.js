const parseIsoDuration = require('parse-iso-duration');
const fs = require('fs');
const Base = require('./base');
const logger = require('../util/logger');
const config = require('../util/config');

function warn(policy, msg) {
  logger.warn(`OAuth policy id=${policy.id}: ${msg}`);
}

function isoToMin(isoDuration) {
  const ms = parseIsoDuration(isoDuration);
  return Math.floor(ms / 1000 / 60);
}

function loadOAuthPolicy(application) {
  const oktaPolicy = {
    accessTokenLifetimeMinutes: 60, // 1 hour
    refreshTokenLifetimeMinutes: 144000, // 100 days

    // Expires the refresh token if it is not used in X minutes. Since this is
    // not a Stormpath feature, set to 0 (unlimited).
    refreshTokenWindowMinutes: 0
  };

  if (!application.oAuthPolicy) {
    logger.verbose(`No oAuthPolicy for applicationId=${application.id}`);
    return oktaPolicy;
  }

  const policyId = application.oAuthPolicy.id;
  const filePath = `${config.stormPathBaseDir}/oAuthPolicies/${policyId}.json`;

  try {
    logger.verbose(`Loading oAuthPolicy id=${policyId} for applicationId=${application.id}`);
    const policy = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (policy.idTokenTtL !== 'PT0H' && policy.idTokenTtl !== 'PT1H') {
      warn(policy, 'Okta ID Token lifetime is fixed to 1 hour');
    }

    oktaPolicy.accessTokenLifetimeMinutes = isoToMin(policy.accessTokenTtl);
    oktaPolicy.refreshTokenLifetimeMinutes = isoToMin(policy.refreshTokenTtl);
    return oktaPolicy;
  } catch (err) {
    logger.error(`Failed to read oAuthPolicy id=${policyId} for applicationId=${application.id}: ${err}`);
    return oktaPolicy;
  }
}

class Application extends Base {

  constructor(filePath, json) {
    super(filePath, json);
    this.tokenLimits = loadOAuthPolicy(json);
  }

}

module.exports = Application;
