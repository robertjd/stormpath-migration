const logger = require('../util/logger');
const rs = require('../util/request-scheduler');
const ApiError = require('../util/api-error');

const POLICY_PATH = '/api/v1/policies';

// Cache the existing password policies since the list policies endpoint does
// now allow for filtering by name.
let passwordPolicies;

async function createDefaultRule(policy) {
  logger.verbose(`Trying to create default rule for password policy id=${policy.id}`);
  const url = `${POLICY_PATH}/${policy.id}/rules`;
  const existing = await rs.get(url);
  if (existing.length > 0) {
    logger.exists(`Found default rule for password policy id=${policy.id}`);
    return;
  }
  const created = await rs.post({
    url,
    body: {
      type: 'PASSWORD',
      name: 'Default Rule',
      conditions: {
        network: {
          connection: 'ANYWHERE'
        }
      },
      actions: {
        passwordChange: {
          access: 'ALLOW'
        },
        selfServicePasswordReset: {
          access: 'ALLOW'
        },
        selfServiceUnlock: {
          access: 'ALLOW'
        }
      }
    }
  });
  logger.created(`Password policy rule id=${created.id} name=${created.name}`);
}

function getPolicyJson(groupId, policy) {
  const json = {
    type: 'PASSWORD',
    conditions: {
      people: {
        groups: {
          include: [groupId]
        }
      }
    }
  };
  Object.assign(json, policy);
  return json;
}

async function getPasswordPolicy(name) {
  logger.verbose(`Getting existing passwordPolicy name=${name}`);
  if (!passwordPolicies) {
    logger.verbose('Getting and caching all existing password policies');
    try {
      const policies = await rs.get(`${POLICY_PATH}?type=PASSWORD`);
      passwordPolicies = {};
      for (let policy of policies) {
        passwordPolicies[policy.name] = policy;
      }
    } catch (err) {
      throw new ApiError(`Failed to get existing password policies name=${name}`, err);
    }
  }
  return passwordPolicies[name];
}

async function updatePasswordPolicy(groupId, policyId, policy) {
  logger.verbose(`Updating existing password policy with name=${policy.name} id=${policyId}`);
  try {
    const updated = await rs.put({
      url: `${POLICY_PATH}/${policyId}`,
      body: getPolicyJson(groupId, policy)
    });
    logger.updated(`Password policy id=${policyId}`);
    await createDefaultRule(updated);
    return updated;
  } catch (err) {
    throw new ApiError(`Failed to update password policy id=${policyId}`, err);
  }
}

async function createNewPasswordPolicy(groupId, policy) {
  logger.verbose(`Creating password policy name=${policy.name} for groupId=${groupId}`);
  try {
    const created = await rs.post({
      url: POLICY_PATH,
      body: getPolicyJson(groupId, policy)
    });
    logger.created(`Password policy id=${created.id} name=${created.name}`);
    await createDefaultRule(created);
    return created;
  } catch (err) {
    throw new ApiError(`Failed to create password policy name=${policy.name}`, err);
  }
}

async function createGroupPasswordPolicy(groupId, policy) {
  logger.verbose(`Trying to create password policy name=${policy.name} for groupId=${groupId}`);
  const existing = await getPasswordPolicy(policy.name);
  return existing
    ? updatePasswordPolicy(groupId, existing.id, policy)
    : createNewPasswordPolicy(groupId, policy);
}

module.exports = createGroupPasswordPolicy;
