const Promise = require('bluebird');
const introspect = require('./premigration/introspect');
const logger = require('./util/logger');
const config = require('./util/config');

const migrateCustomSchema = require('./migrators/migrate-custom-schema');
const migrateDirectories = require('./migrators/migrate-directories');
const migrateApplications = require('./migrators/migrate-applications');
const migrateGroups = require('./migrators/migrate-groups');
const migrateOrganizations = require('./migrators/migrate-organizations');

logger.setLevel(config.logLevel);
logger.info(`Starting import...`);

async function migrate() {
  try {
    const cache = introspect();
    await migrateCustomSchema(cache);
    await migrateDirectories();
    await migrateGroups();
    await migrateApplications();
    await migrateOrganizations();

    // TODO:
    // await migratePolicies();           OKTA-118838

    // Example creating a user and mapping them to a group when we have
    // link information in the export:
    // const createOktaUser = require('./functions/create-okta-user');
    // const addUserToGroup = require('./functions/add-user-to-group');
    // const rs = require('./util/request-scheduler');
    // const stormpathExport = require('./stormpath/stormpath-export');

    // const groups = await rs.get('/api/v1/groups?q=dir:coke');
    // const accounts = stormpathExport.getAccounts();
    // for (let account of accounts) {
    //   if (account.path.indexOf('1h0nT7Qoz3H3kFFamwys6L') === -1) {
    //     continue;
    //   }
    //   const user = await createOktaUser(account.getProfileAttributes());
    //   await addUserToGroup(user.id, groups[0].id);
    // }

  } catch (err) {
    logger.error(err);
  }
}

migrate();
