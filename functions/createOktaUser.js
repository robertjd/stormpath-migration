const util = require('util');
const rp = require('request-promise').defaults({
    baseUrl: global.oktaBaseUrl,
    headers: global.oktaApiHeaders,
    json: true,
    simple: true,
    agentOptions: {
        keepAlive: false
    }
});

module.exports = function(profile, callback /* hashedPassword, algorithm, iterationCount */) {
    var findExistingUser = {
        url: '/api/v1/users',
        qs: {
            filter: util.format('profile.login eq "%s"', profile.login)
        }
    };

    rp.get(findExistingUser)
        .then(function (users) {
            if (users.length > 0) {
                updateExistingUser(users[0].id, profile, callback);
            } else {
                createNewUser(profile, callback);
            }
        })
        .catch(function (err) {
            console.error(err);
            callback(err, null);
        });
};

function createNewUser(profile, callback /* hashedPassword, algorithm, iterationCount */) {
    var userData = {
        url: '/api/v1/users',
        body: {
            'profile': profile
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
            console.log('\tCreated new Okta User \'%s\' (id=%s).', profile.login, user.id);
            callback(null, user.id);
        })
        .catch(function (err) {
            console.error('\tFailed to create Okta User \'%s\': %s', profile.login, err);
            callback(err, null);
        });
}

function updateExistingUser(id, profile, callback /* hashedPassword, algorithm, iterationCount */) {
    var userData = {
        url: util.format('/api/v1/users/%s', id),
        body: {
            'profile': profile
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

    rp.post(userData) //POST is a partial update for User API (doesn't clobber other fields)
        .then(function (user) {
            console.log('\tUpdated Okta User \'%s\' (id=%s).', profile.login, user.id);
            callback(null, user.id);
        })
        .catch(function (err) {
            console.error('\tFailed to update Okta User \'%s\': %s', profile.login, err);
            callback(err, null);
        });
}