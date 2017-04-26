#!/usr/bin/env node

const Promise = require('bluebird');
const introspect = require('../premigration/introspect');
const logger = require('../util/logger');
const config = require('../util/config');

const migrateCustomSchema = require('../migrators/migrate-custom-schema');
const migrateAccounts = require('../migrators/migrate-accounts');
const migrateDirectories = require('../migrators/migrate-directories');
const migrateApplications = require('../migrators/migrate-applications');
const migrateGroups = require('../migrators/migrate-groups');
const migrateOrganizations = require('../migrators/migrate-organizations');

logger.setLevel(config.logLevel);
logger.info(`Starting import...`);

async function migrate() {
  try {
    console.time('migrate');

    await introspect();
    await migrateCustomSchema();
    await migrateAccounts();
    await migrateDirectories();
    await migrateGroups();
    await migrateOrganizations();
    await migrateApplications();

    logger.header('Done');
    console.timeEnd('migrate');
  } catch (err) {
    logger.error(err);
  }
}

migrate();
