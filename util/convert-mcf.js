
function splitIdentifier(mcf) {
  const index = mcf.indexOf('$', 1);
  const identifier = mcf.slice(1, index);
  const content = mcf.slice(index + 1);
  return [identifier, content];
}

function stormpath1(content) {
  const [salt, value] = content.split('$');
  return {
    algorithm: 'STORMPATH1',
    salt,
    value
  };
}

// More detail on Bcrypt format:
// https://en.wikipedia.org/wiki/Bcrypt
function bcrypt(content) {
  const [cost, saltHash] = content.split('$');

  // First 22 characters is the salt
  const salt = saltHash.slice(0, 22);

  // Last 31 characters is the hash
  const hash = saltHash.slice(22);

  return {
    algorithm: 'BCRYPT',
    workFactor: Number(cost),
    salt,
    value: hash
  }
}

/**
 * Converts an MCF formatted string to a password hash described in:
 * https://oktawiki.atlassian.net/wiki/display/EJ/One+Pager%3A+Import+User+Password+by+Hash
 * @param {String} mcf mcf formatted string
 */
function convertMCF(mcf) {
  const [identifier, content] = splitIdentifier(mcf);
  switch (identifier) {
  case 'stormpath1':
    return stormpath1(content);
  case '2a':
    return bcrypt(content);
  default:
    // Identifier not currently supported
    return { algorithm: identifier };
  }
}

module.exports = convertMCF;
