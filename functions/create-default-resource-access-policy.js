const logger = require('../util/logger');
const rs = require('../util/request-scheduler');
const ApiError = require('../util/api-error');

async function getDefaultResource(as) {
  logger.verbose(`Getting default resource for asId=${as.id}`);
  const resources = await rs.get(`/api/v1/as/${as.id}/resources`);
  const defaultResource = resources.find(resource => {
    return resource.default && resource.status === 'ACTIVE';
  });
  if (!defaultResource) {
    throw new Error(`No default resource for asId=${as.id}`);
  }
  return defaultResource;
}

async function getDefaultPolicy(as, resource) {
  logger.verbose(`Getting default policy for asId=${as.id} resourceId=${resource.id}`);
  try {
    const policies = await rs.get({
      url: `/api/v1/as/${as.id}/resources/${resource.id}/policies`,
      query: {
        type: 'OAUTH_AUTHORIZATION_POLICY'
      }
    });
    return policies.find(policy => policy.name === 'Default Policy');
  } catch (err) {
    throw new ApiError(`Failed to get default policy for asId=${as.id} resourceId=${resource.id}`, err);
  }
}

async function createDefaultPolicy(as, resource, client) {
  logger.verbose(`Creating default resource policy for asId=${as.id} resourceId=${resource.id}`);
  try {
    const policy = await rs.post({
      url: `/api/v1/as/${as.id}/resources/${resource.id}/policies`,
      body: {
        name: 'Default Policy',
        type: 'OAUTH_AUTHORIZATION_POLICY',
        conditions: {
          clients: {
            include: [client.client_id]
          }
        }
      }
    });
    logger.created(`Default policy id=${policy.id} for asId=${as.id} resourceId=${resource.id}`);
    return policy;
  } catch (err) {
    throw new ApiError(`Failed to create default resource policy for asId=${as.id} resourceId=${resource.id}`, err);
  }
}

async function getDefaultRule(as, resource, policy) {
  logger.verbose(`Getting default rule for asId=${as.id} resourceId=${resource.id} policyId=${policy.id}`);
  try {
    const rules = await rs.get(`/api/v1/as/${as.id}/resources/${resource.id}/policies/${policy.id}/rules`);
    return rules.find(rule => rule.name === 'Default Rule');
  } catch (err) {
    throw new ApiError(`Failed to get default rule for asId=${as.id} resourceId=${resource.id} policyId=${policy.id}`, err);
  }
}

async function updateDefaultRule(as, resource, policy, rule, tokenLimits) {
  logger.verbose(`Updating existing default policy rule id=${rule.id}`);
  try {
    // Only token limits can be updated (i.e. accessTokenLifetimeMinutes, etc)
    rule.actions.token = tokenLimits;
    const updated = await rs.put({
      url: `/api/v1/as/${as.id}/resources/${resource.id}/policies/${policy.id}/rules/${rule.id}`,
      body: rule
    });
    logger.updated(`Default policy rule id=${rule.id} for asId=${as.id} policyId=${policy.id}`);
    return updated;
  } catch (err) {
    throw new ApiError(`Failed to update default resource policy rule id=${rule.id}`, err);
  }
}

async function createDefaultRule(as, resource, policy, tokenLimits) {
  logger.verbose(`Creating default resource policy rule for asId=${as.id} resourceId=${resource.id} policyId=${policy.id}`);
  try {
    const rule = await rs.post({
      url: `/api/v1/as/${as.id}/resources/${resource.id}/policies/${policy.id}/rules`,
      body: {
        name: 'Default Rule',
        type: 'RESOURCE_ACCESS',
        status: 'ACTIVE',
        system: false,
        conditions: {
          grantTypes: {
            include: [
              'authorization_code',
              'password'
            ]
          },
          people: {
            users: {
              include: [],
              exclude: []
            },
            groups: {
              include: ['EVERYONE'],
              exclude: []
            }
          }
        },
        actions: {
          scopes: {
            include: [{
              name: '*',
              access: 'ALLOW'
            }]
          },
          token: tokenLimits
        }
      }
    });
    logger.created(`Default policy rule id=${rule.id} for asId=${as.id} policyId=${policy.id}`);
    return policy;
  } catch (err) {
    throw new ApiError(`Failed to create default resource policy rule for asId=${as.id} policyId=${policy.id}`, err);
  }
}

async function createDefaultResourceAccessPolicy(as, client, tokenLimits) {
  logger.verbose(`Trying to create default resource access policy for asId=${as.id} and clientId=${client.client_id}`);
  const defaultResource = await getDefaultResource(as);

  let defaultPolicy = await getDefaultPolicy(as, defaultResource);
  if (defaultPolicy) {
    logger.exists(`Found default policy id=${defaultPolicy.id} for asId=${as.id} resourceId=${defaultResource.id}`);
  } else {
    defaultPolicy = await createDefaultPolicy(as, defaultResource, client);
  }

  let defaultRule = await getDefaultRule(as, defaultResource, defaultPolicy);
  if (defaultRule) {
    await updateDefaultRule(as, defaultResource, defaultPolicy, defaultRule, tokenLimits);
  } else {
    await createDefaultRule(as, defaultResource, defaultPolicy, tokenLimits);
  }
}

module.exports = createDefaultResourceAccessPolicy;
