const yargs = require('yargs');
const fs = require('fs');
const Promise = require('bluebird');
const RequestScheduler = require('./util/request-scheduler');
const StormpathExport = require('./stormpath/stormpath-export');
const addCustomSchemaProperties = require('./functions/add-custom-schema-properties');
const introspect = require('./premigration/introspect');
const migrateDirectories = require('./migrators/migrate-directories');

const usage = `
Migration tool to import Stormpath data into an Okta tenant

Usage:
  node $0 \\
     --stormPathBaseDir {/path/to/export/data} \\
     --oktaBaseUrl {https://your-org.okta.com} \\
     --oktaApiToken {token}
`;

const config = yargs
  .usage(usage)
  .options({
    stormPathBaseDir: {
      description: 'Root directory where Stormpath export data lives',
      required: true,
      alias: 'b'
    },
    oktaBaseUrl: {
      description: 'Base URL of your Okta tenant',
      required: true,
      alias: 'u'
    },
    oktaApiToken: {
      description: 'API token for your Okta tenant (SSWS token)',
      required: true,
      alias: 't'
    },
    excludeCustomData: {
      description: 'Skip importing of custom data from Stormpath Accounts.',
      required: false,
      type: 'boolean',
      default: false,
      alias: 'x'
    },
    concurrencyLimit: {
      description: 'Max number of concurrent requests to Okta',
      required: false,
      alias: 'l',
      default: 100
    }
  })
  .example('\t$0 --stormPathBaseDir /path/to/export/data --oktaBaseUrl https://your-org.okta.com --oktaApiToken 5DSfsl4x@3Slt6', '')
  .check(function(argv, aliases) {
      if (!fs.existsSync(argv.stormPathBaseDir)) {
        return `'${argv.stormPathBaseDir} is not a valid stormpath base directory'`;
      }
      return true;
  })
  .argv;

async function migrate() {
  const stormpathExport = new StormpathExport(config);
  const rs = new RequestScheduler(config);

  const cache = introspect({
    excludeCustomData: config.excludeCustomData,
    stormpathExport
  });

  if (!config.excludeCustomData) {
    await addCustomSchemaProperties(rs, cache.customSchemaProperties);
  }

  await migrateDirectories(rs, stormpathExport);

  // Example creating a user and mapping them to a group when we have
  // link information in the export:
  // const createOktaUser = require('./functions/create-okta-user');
  // const addUserToGroup = require('./functions/add-user-to-group');

  // const groups = await rs.get('/api/v1/groups?q=dir:coke');
  // const accounts = stormpathExport.getAccounts();
  // for (let account of accounts) {
  //   if (account.path.indexOf('1h0nT7Qoz3H3kFFamwys6L') === -1) {
  //     continue;
  //   }
  //   const user = await createOktaUser(rs, account.getProfileAttributes());
  //   await addUserToGroup(rs, user.id, groups[0].id);
  // }

  //TODO:
  //require('./migrators/migrateGroups');             OKTA-118834
  //require('./migrators/migrateApplications');       OKTA-118835
  //require('./migrators/migrationOrganizations');    OKTA-118836
  //require('./migrators/migratePolicies');           OKTA-118838
}

migrate();
