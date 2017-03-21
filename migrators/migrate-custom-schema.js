const addCustomSchemaProperties = require('../functions/add-custom-schema-properties');
const logger = require('../util/logger');
const config = require('../util/config');

async function migrateCustomSchema(cache) {
  logger.header('Adding custom schema properties');
  return addCustomSchemaProperties(cache.customSchemaProperties);
}

module.exports = migrateCustomSchema;
