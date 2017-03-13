const Base = require('./base');
const warn = require('debug')('warn');

/**
 * Transforms custom data value to an object with:
 *   schema:
 *     type: array, boolean, number, string
 *     itemType: string, number
 *   val: coerced value
 * If the type is an object, stringifies the object and stores as a string. If
 * the type is an array, will also include the item type - string or number.
 * @param {*} val custom data value
 * @return {Object} type, val, itemType
 */
function transform(original) {
  const schema = {};
  let val;

  if (Array.isArray(original)) {
    schema.type = 'array';
    // There are three array types - string, number, and integer. If the array
    // is empty, or its first value is anything other than a number, use
    // the string array.
    schema.itemType = original.length > 0 && typeof original[0] === 'number'
      ? 'number'
      : 'string';
    val = original.map((item) => {
      return schema.itemType === 'string' ? JSON.stringify(item) : item;
    });
  }
  else if (typeof original === 'boolean') {
    schema.type = 'boolean';
    val = original;
  }
  else if (typeof original === 'number') {
    schema.type = 'number';
    val = original;
  }
  else if (typeof original === 'string') {
    schema.type = 'string';
    val = original;
  }
  else {
    schema.type = 'string';
    val = JSON.stringify(original);
  }

  return { schema, val };
}

class Account extends Base {

  getCustomData() {
    const skip = ['createdAt', 'modifiedAt', 'href'];
    const keys = Object.keys(this.json.customData).filter(key => skip.indexOf(key) === -1);
    const customData = {};

    keys.forEach((key) => {
      // We store apiKeys/secrets under the stormpathApiKey_ namespace, throw
      // an error if they try to create a custom property with this key
      if (key.indexOf('stormpathApiKey_') === 0) {
        throw new Error(`${key} is a reserved property name`);
      }
      customData[key] = transform(this.json.customData[key]);
    });

    // Add apiKeys to custom data with the special keys stormpathApiKey_*
    this.json.apiKeys.forEach((key, i) => {
      if (i < 10) {
        customData[`stormpathApiKey_${i+1}`] = transform(`${key.id}:${key.secret}`);
      }
    });
    const numApiKeys = this.json.apiKeys.length;
    if (numApiKeys > 10) {
      warn(`User has ${numApiKeys} apiKeys, but max is 10. Dropping ${numApiKeys - 10} keys`);
    }

    return customData;
  }
}

module.exports = Account;

