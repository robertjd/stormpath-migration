const fs = require('fs');
const Base = require('./base');
const logger = require('../util/logger');
const config = require('../util/config');

function warn(policy, msg) {
  logger.warn(`Password policy id=${policy.id}: ${msg}`);
}

function mapToOktaPolicy(directory, policy) {
  const strength = policy.strength;
  if (strength.maxLength !== 100) {
    // Default value is 100. If they've changed it, warn them.
    warn(policy, 'maxLength policy is not supported');
  }
  if (strength.minLowerCase > 1) {
    warn(policy, 'Okta minLowerCase only requires at least 1 lowercase character');
    strength.minLowerCase = 1;
  }
  if (strength.minUpperCase > 1) {
    warn(policy, 'Okta minUpperCase only requires at least 1 uppercase character');
    strength.minUpperCase = 1;
  }
  if (strength.minNumeric > 1) {
    warn(policy, 'Okta minNumber only requires at least 1 number');
    strength.minNumeric = 1;
  }
  if (strength.minSymbol > 1) {
    warn(policy, 'Okta minSymbol only requires at least 1 symbol');
    strength.minSymbol = 1;
  }
  if (strength.minDiacritic > 0) {
    warn(policy, 'minDiacritic policy is not supported');
  }
  return {
    name: `${directory.name}-Policy`,
    description: `Imported from Stormpath passwordPolicy id=${policy.id}`,
    settings: {
      password: {
        complexity: {
          minLength: strength.minLength,
          minLowerCase: strength.minLowerCase,
          minUpperCase: strength.minUpperCase,
          minNumber: strength.minNumeric,
          minSymbol: strength.minSymbol,
          excludeUsername: false
        },
        age: {
          maxAgeDays: -1,
          expireWarnDays: 0,
          minAgeMinutes: -1,
          historyCount: strength.preventReuse
        },
        lockout: {
          maxAttempts: 10,
          autoUnlockMinutes: -1,
          showLockoutFailures: false
        }
      }
    }
  }
}

function loadPasswordPolicy(directory) {
  if (!directory.passwordPolicy) {
    logger.verbose(`No passwordPolicy for directoryId=${directory.id}`);
    return;
  }
  const policyId = directory.passwordPolicy.id;
  const filePath = `${config.stormPathBaseDir}/passwordPolicies/${policyId}.json`;
  try {
    logger.verbose(`Loading passwordPolicy id=${policyId} for directoryId=${directory.id}`);
    const policy = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return mapToOktaPolicy(directory, policy);
  } catch (err) {
    logger.error(`Failed to read passwordPolicy id=${policyId} for directoryId=${directory.id}: ${err}`);
  }
}

class Directory extends Base {

  constructor(filePath, json) {
    super(filePath, json);
    this.passwordPolicy = loadPasswordPolicy(json);
    if (json.provider.providerId === 'saml') {
      this.signingCert = this.provider.encodedX509SigningCert
        .replace('-----BEGIN CERTIFICATE-----\n', '')
        .replace('\n-----END CERTIFICATE-----', '');
    }
  }

}

module.exports = Directory;
