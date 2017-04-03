const logger = require('../util/logger');
const rs = require('../util/request-scheduler');
const ApiError = require('../util/api-error');

const USERS_PATH = '/api/v1/users';

async function getExistingUser(profile) {
  logger.verbose(`GET existing user login=${profile.login}`);
  const users = await rs.get({
    url: USERS_PATH,
    qs: {
      filter: `profile.login eq "${profile.login}"`
    }
  });
  return users.length > 0 ? users[0] : null;
}

async function updateExistingUser(id, profile) {
  logger.verbose(`Updating existing user with login=${profile.login} id=${id}`);
  try {
    const user = await rs.post({
      url: `${USERS_PATH}/${id}`,
      body: {
        profile
        //TODO: once REQ-1274 is finished
        //'credentials': {
        //    "password": {
        //         'algorithm': algorithm,
        //         'iterationCount': iterationCount,
        //         'value': hashedPassword
        //    }
        //}
      }
    });
    logger.updated(`User id=${id} login=${profile.login}`);
    return user;
  } catch (err) {
    throw new ApiError(`Failed to update okta user id=${id} login=${profile.login}`, err);
  }
}

async function createNewUser(profile) {
  logger.verbose(`Creating user login=${profile.login}`);
  try {
    const user = await rs.post({
      url: USERS_PATH,
      body: {
        profile,
        credentials: {
          password: {
            value: 'TEMPORARY_password1234'
          }
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
    });
    logger.created(`User id=${user.id} login=${profile.login}`);
    return user;
  } catch (err) {
    throw new ApiError(`Failed to create User login=${profile.login}`, err);
  }
}

async function createOktaUser(profile) {
  logger.verbose(`Trying to create User login=${profile.login}`);
  const user = await getExistingUser(profile);
  return user
    ? updateExistingUser(user.id, profile)
    : createNewUser(profile);
}

module.exports = createOktaUser;
