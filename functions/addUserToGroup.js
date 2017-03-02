const util = require('util');
const rp = require('request-promise').defaults({
    baseUrl: global.oktaBaseUrl,
    headers: global.oktaApiHeaders,
    json: true,
    simple: true
});

module.exports = function(userId, groupId, callback) {
    var groupData = {
        url: util.format('/api/v1/groups/%s/users/%s', groupId, userId)
    };

    rp.put(groupData)
        .then(function (group) {
            console.log('userId=%s is now a member of groupId=%s', userId, groupId);
            callback(null, true);
        })
        .catch(function (err) {
            console.error('Failed to add userId=%s to groupId=%s: %s', userId, groupId, err);
            callback(err, null);
        });
}