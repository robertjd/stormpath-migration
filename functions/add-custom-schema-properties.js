const util = require('util');
const debug = require('debug');
const log = debug('log');
const verbose = debug('verbose');

const SCHEMA_PATH = '/api/v1/meta/schemas/user/default';

async function getCurrentProperties(rs) {
  log('Getting current schema properties');
  const res = await rs.get(SCHEMA_PATH);

  // Note: Base properties are also unique, so we must not try to add a
  // custom property with the same name.
  const baseProperties = res.definitions.base.properties;
  const customProperties = res.definitions.custom.properties;
  const allProperties = Object.assign({}, baseProperties, customProperties);
  verbose('Current Okta schema properties');
  verbose(allProperties);
  return allProperties;
}

async function createProperties(rs, properties) {
  log('Found new custom schema properties, adding');
  verbose(properties);
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
  log('Successfully updated Okta User custom schema');
}

async function addCustomSchemaProperties(rs, customProperties) {
  log('Adding custom schema properties');
  try {
    const currentProperties = await getCurrentProperties(rs);

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
      log('No custom schema properties to add, continuing');
      return;
    }

    return await createProperties(rs, propertiesToAdd);
  } catch (err) {
    // Errors when creating custom schema properties are unrecoverable - if
    // this happens, stop the script
    console.error('Failed to add custom schema properties, aborting script');
    console.error(err);
    process.exit(1);
  }
}

module.exports = addCustomSchemaProperties;
