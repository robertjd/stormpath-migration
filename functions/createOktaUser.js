const util = require('util');
const rp = require('request-promise').defaults({
    baseUrl: global.oktaBaseUrl,
    headers: global.oktaApiHeaders,
    json: true,
    simple: true
});

module.exports = function(userName, email, firstName, middleName, lastName, displayName, callback /* hashedPassword, algorithm, iterationCount */) {
    var findExistingUser = {
        url: '/api/v1/users',
        qs: {
            filter: util.format('profile.login eq "%s"', userName)
        }
    };

    rp.get(findExistingUser)
        .then(function (users) {
            if (users.length > 0) {
                updateExistingUser(users[0].id, userName, email, firstName, middleName, lastName, displayName, callback);
            } else {
                createNewUser(userName, email, firstName, middleName, lastName, displayName, callback);
            }
        })
        .catch(function (err) {
            console.error(err);
            callback(err, null);
        });
};

function createNewUser(userName, email, firstName, middleName, lastName, displayName, callback /* hashedPassword, algorithm, iterationCount */) {
    var userData = {
        url: '/api/v1/users',
        body: {
            'profile': {
                'login': userName,
                'email': email,
                'firstName': firstName,
                'middleName': middleName,
                'lastName': lastName,
                'displayName': displayName,
            }
            //TODO: once REQ-1274 is finished
            //'credentials': {
            //    "password": {
            //         'algorithm': algorithm,
            //         'iterationCount': iterationCount,
            //         'value': hashedPassword
            //    }
            //}
        }
    };

    rp.post(userData)
        .then(function (user) {
            console.log('Created new Okta User \'%s\' (id=%s).', userName, user.id);
            callback(null, user.id);
        })
        .catch(function (err) {
            console.error('Failed to create Okta User \'%s\': %s', userName, err);
            callback(err, null);
        });
}

function updateExistingUser(id, userName, email, firstName, middleName, lastName, displayName, callback /* hashedPassword, algorithm, iterationCount */) {
    var userData = {
        url: util.format('/api/v1/users/%s', id),
        body: {
            'profile': {
                'email': email,
                'firstName': firstName,
                'middleName': middleName,
                'lastName': lastName,
                'displayName': displayName
            }
            //TODO: once REQ-1274 is finished
            //'credentials': {
            //    "password": {
            //         'algorithm': algorithm,
            //         'iterationCount': iterationCount,
            //         'value': hashedPassword
            //    }
            //}
        }
    };

    rp.post(userData) //POST is an upsert for User API
        .then(function (user) {
            console.log('Updated Okta User \'%s\' (id=%s).', userName, user.id);
            callback(null, user.id);
        })
        .catch(function (err) {
            console.error('Failed to update Okta User \'%s\': %s', userName, err);
            callback(err, null);
        });
}