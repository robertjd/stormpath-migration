const fs = require('fs');
const path = require('path');
const util = require('util');
const Promise = require('bluebird');

const createOktaUser = Promise.promisify(require('../functions/createOktaUser'));
const createOktaGroup = Promise.promisify(require('../functions/createOktaGroup'));
const addUserToGroup = Promise.promisify(require('../functions/addUserToGroup'));
const addCustomSchemaProperties = Promise.promisify(require('../functions/addCustomSchemaProperties'));

const directoriesPath = path.join(global.stormPathBaseDir, 'directories');
const providersPath = path.join(global.stormPathBaseDir, 'providers');

var directoryFiles = fs.readdirSync(directoriesPath, 'utf8');

directoryFiles.forEach(function(file, index) {
    if (path.extname(file) !== '.json') {
        return;
    }

    var directoryId = path.basename(file, '.json');
    console.log('Processing Stormpath Directory \'%s\'...', directoryId);

    var fullDirectoryPath = path.join(directoriesPath, file);
    var fullProviderPath = path.join(providersPath, file);

    var directoryJson = JSON.parse(fs.readFileSync(fullDirectoryPath, 'utf8'));
    var providerJson = JSON.parse(fs.readFileSync(fullProviderPath, 'utf8'));

    if (providerJson.providerType === 'stormpath') {
        var groupName = util.format('dir:%s', directoryJson.name);
        var groupDescription = directoryJson.description;
        createOktaGroup(groupName, groupDescription)
            .then(function(groupId) {
                createUsersForDirectory(directoryId, groupId);
            });
    } else {
        //TODO: handle social directory types
        return;
    }
});

function createUsersForDirectory(directoryId, groupId) {
    var accountsPath = path.join(global.stormPathBaseDir, 'accounts', directoryId);
    var accountFiles = fs.readdirSync(accountsPath, 'utf8');
    console.log('\tAbout to import %d Accounts for Stormpath Directory \'%s\'...', accountFiles.length, directoryId);

    accountFiles.forEach(function (file, index) {
        if (path.extname(file) !== '.json') {
            return;
        }

        var accountId = path.basename(file, '.json');
        console.log('\tProcessing Stormpath Account \'%s\'...', accountId);

        var fullAccountPath = path.join(accountsPath, file);
        var accountJson = JSON.parse(fs.readFileSync(fullAccountPath, 'utf8'));

        var profileAttributes = {
            login: accountJson.username,
            email: accountJson.email,
            firstName: accountJson.givenName,
            middleName: accountJson.middleName,
            lastName: accountJson.surname,
            displayName: accountJson.fullName
        };

        if (!global.excludeCustomData) {
            addCustomSchemaProperties(directoryId, file)
                .then(function(customProfileAttrs) {
                    Object.assign(profileAttributes, customProfileAttrs); //add the customProfileAttrs to the existing profileAttrs
                    createOktaUser(profileAttributes)
                        .then(function(userId) {
                            addUserToGroup(userId, groupId);
                        });
                });
        } else {
            createOktaUser(profileAttributes)
                .then(function(userId) {
                    addUserToGroup(userId, groupId);
                });
        }
    });
}