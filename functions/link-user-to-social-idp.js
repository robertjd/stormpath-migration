const ApiError = require('../util/api-error');
const logger = require('../util/logger');
const rs = require('../util/request-scheduler');
const config = require('../util/config');

function idpUsers(idpId) {
  return `/api/v1/idps/${idpId}/users`;
}

async function isLinked(userId, idpId) {
  logger.verbose(`Getting existing social link userId=${userId} idpId=${idpId}`);
  try {
    const users = await rs.get(idpUsers(idpId));
    return users.find(link => userId === link.id) ? true : false;
  } catch (err) {
    throw new ApiError(`Failed to get idps for userId=${userId}`, err);
  }
}

async function createLink(userId, idpId, externalId) {
  logger.verbose(`Creating new social link userId=${userId} idpId=${idpId} externalId=${externalId}`);
  try {
    await rs.post({
      url: `${idpUsers(idpId)}/${userId}`,
      body: { externalId }
    });
    logger.created(`Social link idpId=${idpId} userId=${userId} externalId=${externalId}`);
  } catch (err) {
    throw new ApiError(`Failed to link userId=${userId} idpId=${idpId}`, err);
  }
}

async function linkUserToSocialIdp(userId, idpId, externalId) {
  logger.verbose(`Trying to create social link idpId=${idpId} userId=${userId}`);
  const linkExists = await isLinked(userId, idpId);
  if (linkExists) {
    logger.exists(`Found matching social link idpId=${idpId} userId=${userId}`);
    return;
  }
  return createLink(userId, idpId, externalId);
}

module.exports = linkUserToSocialIdp;
