const SchemaProperties = require('../util/schema-properties');

/**
 * Introspect the stormpath export and set up initial mappings:
 * 1. Custom schema definitions
 * 2. TODO: Combined user mappings
 * @param {Object} options
 * @param {Boolean} options.excludeCustomData
 * @param {StormpathExport} options.stormpathExport
 */
function introspect(options) {
  const schemaProperties = new SchemaProperties();

  const accounts = options.stormpathExport.getAccounts();
  for (let account of accounts) {
    if (!options.excludeCustomData) {
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
