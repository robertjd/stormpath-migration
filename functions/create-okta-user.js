const log = require('debug')('log');

const USERS_PATH = '/api/v1/users';

async function getExistingUser(rs, profile) {
  const users = await rs.get({
    url: USERS_PATH,
    qs: {
      filter: `profile.login eq "${profile.login}"`
    }
  });
  return users.length > 0 ? users[0] : null;
}

async function updateExistingUser(rs, id, profile) {
  log(`Existing user found with login ${profile.login} (id=${id}), updating`);
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
    log(`Updated Okta user '${profile.login}' (id=${id})`);
    return user;
  } catch (err) {
    throw new Error(`Failed to update Okta user '${profile.login}: ${err}'`);
  }
}

async function createNewUser(rs, profile) {
  log(`No users found with login '${profile.login}', creating`);
  try {
    const user = await rs.post({
      url: USERS_PATH,
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
    log(`Created new Okta user '${profile.login}' (id=${user.id})`);
    return user;
  } catch (err) {
    throw new Error(`Failed to create Okta user '${profile.login}: ${err}'`);
  }
}

async function createOktaUser(rs, profile) {
  log(`Trying to create Okta user ${profile.login}`);
  try {
    const user = await getExistingUser(rs, profile);
    return user
      ? await updateExistingUser(rs, user.id, profile)
      : await createNewUser(rs, profile);
  } catch (err) {
    console.error(err);
  }
}

module.exports = createOktaUser;
