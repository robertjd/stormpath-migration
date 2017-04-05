const logger = require('./logger');

function getSchemaProperty(key, type) {
  const property = {
    title: key,
    description: key,
    type,
    scope: 'SYSTEM',
    required: false,
    permissions: [{
      principal: 'SELF',
      action: 'READ_WRITE'
    }]
  };
  switch (type) {
  case 'array-string':
    property.type = 'array';
    property.items = { type: 'string' };
    property.union = 'DISABLE';
    break;
  case 'array-number':
    property.type = 'array';
    property.items = { type: 'number' };
    property.union = 'DISABLE';
    break;
  case 'boolean':
    break;
  case 'number':
    break;
  case 'string':
    property.minLength = 1;
    property.maxLength = 10000;
    break;
  default:
    throw new Error(`Unknown schema type: ${type}`);
  }
  return property;
}

function compareKeys(key1, key2) {
  const apiKey = 'stormpathApiKey_';
  if (!key1.includes(apiKey) || !key2.includes(apiKey)) {
    return key1 > key2 ? 1 : (key1 === key2 ? 0 : -1);
  }
  return Number(key1.replace(apiKey, '')) - Number(key2.replace(apiKey, ''));
}

class SchemaProperties {

  constructor() {
    this.properties = {};
  }

  add(key, type) {
    if (!this.properties[key]) {
      this.properties[key] = {};
    }
    if (!this.properties[key][type]) {
      this.properties[key][type] = 0;
    }
    this.properties[key][type]++;
  }

  /**
   * @returns {Object} { properties, schemaTypeMap }
   */
  getSchema() {
    const properties = {};
    const schemaTypeMap = {};

    Object.keys(this.properties).sort(compareKeys).forEach((key) => {
      const typeCountMap = this.properties[key];
      const types = Object.keys(typeCountMap);

      let pairs = [];
      let maxType;
      let maxCount = -1;
      for (let type of types) {
        const count = typeCountMap[type];
        pairs.push(`${type} (${count})`);
        if (count > maxCount) {
          maxCount = count;
          maxType = type;
        }
      }

      if (types.length > 1) {
        const msg = `Found multiple types for custom schema property '${key}' - ${pairs.join(' ')}.`;
        logger.warn(`${msg} Using the most common: ${maxType}.`);
      }

      schemaTypeMap[key] = maxType;
      properties[key] = getSchemaProperty(key, maxType);
    });

    return { properties, schemaTypeMap };
  }

}

module.exports = SchemaProperties;
