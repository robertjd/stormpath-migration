const fs = require('fs');
const path = require('path');
const util = require('util');
const Promise = require('bluebird');

const rp = require('request-promise').defaults({
    baseUrl: global.oktaBaseUrl,
    headers: global.oktaApiHeaders,
    json: true,
    simple: true,
    agentOptions: {
        keepAlive: false
    }
});

module.exports = function(directoryId, file, callback) {
    var customDataPath = path.join(global.stormPathBaseDir, 'customData', directoryId, file);
    var customDataJson = JSON.parse(fs.readFileSync(customDataPath, 'utf8'));

    var resultData = {};
    var schemaAdditions = [];

    for (var key in customDataJson) {
        if (customDataJson.hasOwnProperty(key)) { //make sure we're not looking at prototype attributes
            if (key === 'createdAt' || key === 'modifiedAt' || key === 'href') { //skip standard metadata attrs
                continue;
            }

            if (Array.isArray(customDataJson[key])) {
                schemaAdditions.push(addSchemaProperty(key, key, 'array')); //note: using propertyName as the description

                var flattenedArray = [];
                for (var originalValue in customDataJson[key]) {
                    flattenedArray.push(JSON.stringify(originalValue));
                }
                resultData[key] = flattenedArray;
            } else {
                schemaAdditions.push(addSchemaProperty(key, key, 'string')); //note: using propertyName as the description
                resultData[key] = JSON.stringify(customDataJson[key]);
            }
        }
    }

    Promise.all(schemaAdditions)
        .then(function() {
            console.log("\t\tFinished adding Okta User schema properties.");
            callback(null, resultData);
        });
}

// See:
//   * http://developer.okta.com/docs/api/resources/schemas.html
//   * https://oktawiki.atlassian.net/wiki/display/eng/Advanced+Attribute+definitions
//
var addSchemaProperty = Promise.promisify(function(propertyName, description, type, callback) {
    var schemaData;
    if (type === 'string') {

        schemaData = {
            url: '/api/v1/meta/schemas/user/default',
            body: {
                'definitions': {
                    'custom': {
                        'id': "#custom",
                        'type': "object",
                        'properties': {
                            [propertyName]: {
                                'title': propertyName,
                                'description': description,
                                'type': type,
                                'scope': 'SYSTEM',
                                'required': false,
                                'minLength': 1,
                                'maxLength': 10000,
                                'permissions': [
                                    {
                                        "principal": "SELF",
                                        "action": "READ_WRITE"
                                    }
                                ]
                            }
                        },
                        'required': []
                    }
                }
            }
        };

    } else if (type === 'array') {
        schemaData = {
            url: '/api/v1/meta/schemas/user/default',
            body: {
                'definitions': {
                    'custom': {
                        'id': "#custom",
                        'type': "object",
                        'properties': {
                            [propertyName]: {
                                'title': propertyName,
                                'description': description,
                                'type': type,
                                'items': {
                                    type: 'string'
                                },
                                'union': 'DISABLE',
                                'scope': 'SYSTEM',
                                'required': false,
                                'permissions': [
                                    {
                                        "principal": "SELF",
                                        "action": "READ_WRITE"
                                    }
                                ]
                            }
                        },
                        'required': []
                    }
                }
            }
        };
    } else {
        callback(util.format('Unsupported property type for property %s: %s', propertyName, type), null);
        return;
    }

    rp.post(schemaData)
        .then(function (responseSchema) {
            console.log('\t\tUpdated Okta User custom schema with %s attribute \'%s\'.', type, propertyName);
            callback(null, propertyName);
        })
        .catch(function (err) {
            console.error('\t\tFailed to update Okta User custom schema with %s attribute \'%s\': %s', type, propertyName, err);
            callback(err, null);
        });
});