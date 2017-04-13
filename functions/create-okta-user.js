const logger = require('../util/logger');
const rs = require('../util/request-scheduler');
const ApiError = require('../util/api-error');

const USERS_PATH = '/api/v1/users';

async function getExistingUser(profile) {
  try {
    const users = await rs.get({
      url: USERS_PATH,
      qs: {
        filter: `profile.login eq "${profile.login}"`
      }
    });
    return users.length > 0 ? users[0] : null;
  } catch (err) {
    throw new ApiError('Failed to get existing users', err);
  }
}

// Note: We cannot update an imported password after the user is out of the
// STAGED status.
async function updateExistingUser(user, profile) {
  logger.verbose(`Updating existing user with login=${profile.login} id=${user.id}`);
  try {
    Object.assign(user.profile, profile);
    const updated = await rs.post({
      url: `${USERS_PATH}/${user.id}`,
      body: user
    });
    logger.updated(`User id=${user.id} login=${profile.login}`);
    return updated;
  } catch (err) {
    throw new ApiError(`Failed to update okta user id=${user.id} login=${profile.login}`, err);
  }
}

async function createNewUser(profile, credentials) {
  logger.verbose(`Creating user login=${profile.login}`);
  try {
    const user = await rs.post({
      url: USERS_PATH,
      body: {
        profile,
        credentials
      }
    });
    logger.created(`User id=${user.id} login=${profile.login}`);
    return user;
  } catch (err) {
    throw new ApiError(`Failed to create User login=${profile.login}`, err);
  }
}

async function createOktaUser(profile, credentials) {
  logger.verbose(`Trying to create User login=${profile.login}`);
  const user = await getExistingUser(profile);
  return user
    ? updateExistingUser(user, profile)
    : createNewUser(profile, credentials);
}

module.exports = createOktaUser;
