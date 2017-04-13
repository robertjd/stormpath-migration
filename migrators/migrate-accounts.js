const Promise = require('bluebird');
const createOktaUser = require('../functions/create-okta-user');
const logger = require('../util/logger');
const config = require('../util/config');
const ConcurrencyPool = require('../util/concurrency-pool');
const cache = require('./util/cache');

async function migrateAccounts() {
  logger.header(`Starting users import`);
  const pool = new ConcurrencyPool(config.concurrencyLimit);
  const accounts = cache.unifiedAccounts.getAccounts();
  logger.info(`Importing ${accounts.length} unified Stormpath accounts`);
  try {
    await pool.each(accounts, async (account) => {
      try {
        const profile = account.getProfileAttributes();
        const creds = account.getCredentials();
        const user = await createOktaUser(profile, creds);
        account.setOktaUserId(user.id);
        cache.userIdAccountMap[user.id] = account;
        for (let directoryId of account.directoryIds) {
          if (!cache.directoryUserMap[directoryId]) {
            cache.directoryUserMap[directoryId] = [];
          }
          cache.directoryUserMap[directoryId].push(user.id);
        }
      } catch (err) {
        logger.error(err);
        if (err.message.includes('Maximum number of users has been reached')) {
          throw new Error('Reached maximum number of users - contact support to raise this limit');
        }
      }
    });
  } catch (err) {
    logger.error(`Failed to import all accounts: ${err.message}`);
  }
}

module.exports = migrateAccounts;
