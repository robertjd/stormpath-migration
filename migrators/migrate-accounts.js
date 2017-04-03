const Promise = require('bluebird');
const createOktaUser = require('../functions/create-okta-user');
const logger = require('../util/logger');
const config = require('../util/config');
const ConcurrencyPool = require('../util/concurrency-pool');
const cache = require('./util/cache');

function migrateAccounts() {
  logger.header(`Starting users import`);
  const pool = new ConcurrencyPool(config.concurrencyLimit);
  const accounts = cache.unifiedAccounts.getAccounts();
  logger.info(`Importing ${accounts.length} unified Stormpath accounts`);
  return pool.each(accounts, async (account) => {
    try {
      const profile = account.getProfileAttributes();
      const user = await createOktaUser(profile);
      account.setOktaUserId(user.id);
      for (let directoryId of account.directoryIds) {
        if (!cache.directoryUserMap[directoryId]) {
          cache.directoryUserMap[directoryId] = [];
        }
        cache.directoryUserMap[directoryId].push(user.id);
      }
    } catch (err) {
      logger.error(err);
    }
  });
}

module.exports = migrateAccounts;
