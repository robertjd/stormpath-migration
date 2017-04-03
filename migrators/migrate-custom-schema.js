const addCustomSchemaProperties = require('../functions/add-custom-schema-properties');
const logger = require('../util/logger');
const cache = require('./util/cache');

async function migrateCustomSchema() {
  logger.header('Adding custom schema properties');
  return addCustomSchemaProperties(cache.customSchemaProperties);
}

module.exports = migrateCustomSchema;
