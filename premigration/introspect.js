const logger = require('../util/logger');
const UnifiedAccounts = require('../stormpath/unified-accounts');
const SchemaProperties = require('../util/schema-properties');
const config = require('../util/config');
const stormpathExport = require('../stormpath/stormpath-export');
const cache = require('../migrators/util/cache');


async function getDirectoryProviders() {
  const directories = stormpathExport.getDirectories();
  logger.info(`Mapping ${directories.length} directories to providerIds`);
  return directories.mapToObject((directory, map) => {
    map[directory.id] = directory.provider.providerId;
  });
}

/**
 * Introspect the stormpath export and set up initial mappings:
 * 1. Custom schema definitions
 * 2. TODO: Combined user mappings
 */
async function introspect() {
  logger.header('Introspecting stormpath export');
  const directoryProviders = await getDirectoryProviders();
  const accountLinks = await stormpathExport.getAccountLinks();
  const schemaProperties = new SchemaProperties();
  const unifiedAccounts = new UnifiedAccounts(accountLinks);
  let numADLDAPAccounts = 0;
  let numDisabled = 0;

  const accounts = await stormpathExport.getAccounts();
  logger.info(`Pre-processing ${accounts.length} stormpath accounts`);
  await accounts.each((account) => {
    try {
      const providerId = directoryProviders[account.directory.id];
      if (!providerId) {
        return logger.error(`Missing directory id=${account.directory.id}. Skipping account id=${account.id}.`);
      }
      if (providerId === 'ad' || providerId === 'ldap') {
        numADLDAPAccounts++;
        return logger.verbose(`Skipping account id=${account.id}. Import using the Okta ${providerId.toUpperCase()} agent.`);
      }
      if (account.status !== 'ENABLED') {
        numDisabled++;
        return logger.verbose(`Skipping disabled account id=${account.id}`);
      }
      let unifiedAccount = unifiedAccounts.addAccount(account);
      if (unifiedAccount) {
        const customData = unifiedAccount.getCustomData();
        Object.keys(customData).forEach((key) => {
          schemaProperties.add(key, customData[key].schema);
        });
      }
    } catch (err) {
      logger.error(err);
    }
  });

  if (numADLDAPAccounts > 0) {
    logger.warn(`Skipped ${numADLDAPAccounts} AD or LDAP accounts. Import using the Okta AD or LDAP agent.`);
  }
  if (numDisabled > 0) {
    logger.warn(`Skipped ${numDisabled} disabled accounts.`);
  }

  cache.unifiedAccounts = unifiedAccounts;
  cache.customSchemaProperties = schemaProperties.getProperties();
  logger.info(`Found ${Object.keys(cache.customSchemaProperties).length} custom schema properties`);
}

module.exports = introspect;
