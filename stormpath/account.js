const fs = require('fs');
const Base = require('./base');
const logger = require('../util/logger');
const config = require('../util/config');

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

/**
 * Sets default 'not_provided' value for required attributes
 * @param {Object} profileAttributes
 */
function addRequiredAttributes(profile) {
  const missing = [];
  ['firstName', 'lastName'].forEach((attr) => {
    if (!profile[attr]) {
      profile[attr] = 'not_provided';
      missing.push(attr);
    }
  });
  if (missing.length > 0) {
    const attrs = missing.join(',');
    logger.warn(`Setting required attributes ${attrs} to 'not_provided' for email=${profile.email}`);
  }
  return profile;
}

class Account extends Base {

  constructor(filePath, json, options) {
    super(filePath, json);
    this.apiKeys = options.accountApiKeys[this.id] || [];
    this.accountIds = [this.id];
    this.directoryIds = [this.directory.id];
  }

  /**
   * Merges properties from another account into this account.
   * @param {Account} account
   */
  merge(account) {
    // 1. Base stormpath properties - only overrides properties that aren't already set
    const mergeableProperties = [
      'username',
      'givenName',
      'middleName',
      'surName',
      'fullName'
    ];
    mergeableProperties.forEach((prop) => {
      if (!this[prop]) {
        this[prop] = account[prop];
      }
    });

    // 2. Custom data properties - only overrides properties that aren't already set
    Object.keys(account.customData).forEach((key) => {
      if (!this.customData[key]) {
        this.customData[key] = account.customData[key];
      }
    });

    // 3. ApiKeys - merges both apiKeys together
    this.apiKeys = this.apiKeys.concat(account.apiKeys);

    // 4. Keep a record of which accounts have been merged
    this.accountIds.push(account.id);
    this.directoryIds.push(account.directory.id);
  }

  getProfileAttributes() {
    // Note: firstName and lastName are required attributes. If these are not
    // available, default to "not_provided"
    const profileAttributes = addRequiredAttributes({
      login: this.username,
      email: this.email,
      firstName: this.givenName,
      middleName: this.middleName,
      lastName: this.surname,
      displayName: this.fullName
    });

    const customData = this.getCustomData();
    Object.keys(customData).forEach((key) => {
      profileAttributes[key] = customData[key].val;
    });
    return profileAttributes;
  }

  getCustomData() {
    const customData = {};

    if (config.isCustomDataStringify) {
      customData['customData'] = transform(JSON.stringify(this.customData));
    }
    else if (config.isCustomDataSchema) {
     const skip = ['createdAt', 'modifiedAt', 'href'];
     const keys = Object.keys(this.customData).filter(key => skip.indexOf(key) === -1);
     keys.forEach((key) => {
        // We store apiKeys/secrets under the stormpathApiKey_ namespace, throw
        // an error if they try to create a custom property with this key
        if (key.indexOf('stormpathApiKey_') === 0) {
          throw new Error(`${key} is a reserved property name`);
        }
        customData[key] = transform(this.customData[key]);
      });
    }

    // Add apiKeys to custom data with the special keys stormpathApiKey_*
    this.apiKeys.forEach((key, i) => {
      if (i < 10) {
        customData[`stormpathApiKey_${i+1}`] = transform(`${key.id}:${key.secret}`);
      }
    });
    const numApiKeys = this.apiKeys.length;
    if (numApiKeys > 10) {
      logger.warn(`Account id=${this.id} has ${numApiKeys} apiKeys, but max is 10. Dropping ${numApiKeys - 10} keys.`);
    }

    return customData;
  }

  setOktaUserId(oktaUserId) {
    this.oktaUserId = oktaUserId;
  }

  getOktaUserId() {
    return this.oktaUserId;
  }

}

module.exports = Account;
