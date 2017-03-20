const logger = require('../util/logger');
const SchemaProperties = require('../util/schema-properties');
const config = require('../util/config');
const stormpathExport = require('../stormpath/stormpath-export');

/**
 * Introspect the stormpath export and set up initial mappings:
 * 1. Custom schema definitions
 * 2. TODO: Combined user mappings
 */
function introspect() {
  logger.header('Introspecting stormpath export');
  const schemaProperties = new SchemaProperties();

  const accounts = stormpathExport.getAccounts();
  for (let account of accounts) {
    if (!config.excludeCustomData) {
      const customData = account.getCustomData();
      Object.keys(customData).forEach((key) => {
        schemaProperties.add(key, customData[key].schema);
      });
    }
  }

  return {
    customSchemaProperties: schemaProperties.getProperties()
  };
}

module.exports = introspect;
