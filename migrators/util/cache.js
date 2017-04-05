module.exports = {

  unifiedAccounts: null,
  customSchemaProperties: null,
  customSchemaTypeMap: null,

  // Stormpath applicationId -> [Okta groupIds]
  accountStoreMap: null,

  // Stormpath directoryId -> Okta groupId
  directoryMap: {},

  // Stormpath directoryId -> [Okta userIds]
  directoryUserMap: {},

  // Stormpath groupId -> Okta groupId
  groupMap: {},

  // Stormpath groupId -> [Okta userIds]
  groupUserMap: {},

  // Stormpath organizationId -> Okta groupId
  organizationMap: {}

};
