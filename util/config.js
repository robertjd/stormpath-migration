const yargs = require('yargs');
const fs = require('fs');

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
      alias: 'c',
      default: 100
    },
    logLevel: {
      description: 'Logging level',
      required: false,
      alias: 'l',
      choices: ['error', 'warn', 'info', 'verbose', 'debug', 'silly'],
      default: 'info'
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

module.exports = config;
