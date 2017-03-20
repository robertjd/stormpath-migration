const util = require('util');
const logger = require('../util/logger');
const rs = require('../util/request-scheduler');

const SCHEMA_PATH = '/api/v1/meta/schemas/user/default';

async function getCurrentProperties() {
  logger.verbose('Getting current schema properties');
  const res = await rs.get(SCHEMA_PATH);

  // Note: Base properties are also unique, so we must not try to add a
  // custom property with the same name.
  const baseProperties = res.definitions.base.properties;
  const customProperties = res.definitions.custom.properties;
  const allProperties = Object.assign({}, baseProperties, customProperties);
  logger.silly('Current Okta schema properties', allProperties);
  return allProperties;
}

async function createProperties(properties) {
  logger.verbose('Found new custom schema properties, adding', properties);
  await rs.post({
    url: SCHEMA_PATH,
    body: {
      definitions: {
        custom: {
          id: '#custom',
          type: 'object',
          properties,
          required: []
        }
      }
    }
  });
  logger.created(`Custom schema properties`, Object.keys(properties).map((key, index) => {
    const property = properties[key];
    const type = property.type === 'array'
      ? `${property.items.type} ${property.type}`
      : property.type;
    return { index, property: property.title, type };
  }));
}

async function addCustomSchemaProperties(customProperties) {
  logger.verbose('Adding custom schema properties');
  try {
    const currentProperties = await getCurrentProperties();

    // Filter out properties that have already been created, or exist as
    // base properties.
    const propertiesToAdd = {};
    Object.keys(customProperties).forEach((key) => {
      const currentProperty = currentProperties[key];
      const customProperty = customProperties[key];
      if (!currentProperty) {
        propertiesToAdd[key] = customProperty;
      }
      // Do an additional type check to verify that we are not trying to change
      // the type with the new schemas.
      else if (currentProperty.type !== customProperty.type) {
        const msg = 'Trying to add existing property "%s", but its type "%s" does not match existing "%s"';
        throw new Error(util.format(msg, key, customProperty.type, currentProperty.type));
      }
      else if (currentProperty.type === 'array' && currentProperty.items.type !== customProperty.items.type) {
        const msg = 'Trying to add existing array property "%s", but its itemType "%s" does not match existing "%s"';
        throw new Error(util.format(msg, key, customProperty.items.type, currentProperty.items.type));
      }
    });

    if (Object.keys(propertiesToAdd).length === 0) {
      logger.exists('No new custom schema properties to add');
      return;
    }

    return await createProperties(propertiesToAdd);
  } catch (err) {
    // Errors when creating custom schema properties are unrecoverable - if
    // this happens, stop the script
    logger.error('Failed to add custom schema properties, aborting script', err);
    process.exit(1);
  }
}

module.exports = addCustomSchemaProperties;
