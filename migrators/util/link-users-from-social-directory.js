const ConcurrencyPool = require('../../util/concurrency-pool');
const linkUserToSocialIdp = require('../../functions/link-user-to-social-idp');
const logger = require('../../util/logger');
const cache = require('./cache');
const config = require('../../util/config');

function error(userId, idpId, msg) {
  logger.error(`Unable to link userId=${userId} to idpId=${idpId} - ${msg}`);
}

function linkUsersFromSocialDirectory(directoryId) {
  const userIds = cache.directoryUserMap[directoryId];
  const idpId = cache.directoryIdpMap[directoryId];

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return;
  }

  logger.info(`Linking ${userIds.length} users to Social IdP id=${idpId}`);
  const pool = new ConcurrencyPool(config.concurrencyLimit);
  return pool.each(userIds, async (userId) => {
    try {
      const account = cache.userIdAccountMap[userId]
      if (!account) {
        return error(userId, idpId, 'No unified account for user');
      }

      const externalId = account.getExternalIdForDirectory(directoryId);
      if (!externalId) {
        return error(userId, idpId, `No externalId found`);
      }
      await linkUserToSocialIdp(userId, idpId, externalId);
    } catch (err) {
      logger.error(err);
    }
  });
}

module.exports = linkUsersFromSocialDirectory;
