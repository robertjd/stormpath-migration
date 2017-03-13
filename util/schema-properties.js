function getSchemaProperty(key, schema) {
  const property = {
    key: key,
    val: {
      title: key,
      description: key,
      type: schema.type,
      scope: 'SYSTEM',
      required: false,
      permissions: [{
        principal: 'SELF',
        action: 'READ_WRITE'
      }]
    }
  };
  switch (schema.type) {
  case 'array':
    property.val.items = { type: schema.itemType };
    property.val.union = 'DISABLE';
    break;
  case 'boolean':
    break;
  case 'number':
    break;
  case 'string':
    property.val.minLength = 1;
    property.val.maxLength = 10000;
    break;
  }
  return property;
}

class SchemaProperties {

  constructor() {
    this.properties = {};
  }

  add(key, schema) {
    // If the property doesn't exist yet, add it
    if (!this.properties[key]) {
      this.properties[key] = schema;
    }

    // Validate that new properties share the same schema as properties that
    // have already been added.
    const existing = this.properties[key];
    if (schema.type !== existing.type) {
      throw new Error(`Type mismatch for ${key} - expected ${existing.type}, but got ${schema.type}`);
    }
    if (schema.itemType !== existing.itemType) {
      throw new Error(`ItemType mismatch for ${key} - expected ${existing.itemType}, but got ${schema.itemType}`);
    }
  }

  /**
   * @returns {Object} Object of User Profile Schema Properties
   */
  getProperties() {
    const properties = {};
    Object.keys(this.properties).sort().forEach((key) => {
      const property = getSchemaProperty(key, this.properties[key]);
      properties[property.key] = property.val;
    });
    return properties;
  }

}

module.exports = SchemaProperties;
