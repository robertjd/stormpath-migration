const Promise = require('bluebird');

/**
 * Waits for all promises to be settled, and throws the first error if one of
 * the promises is rejected. Note, this is different from Promise.all because
 * it waits for all promises to be settled, including errors.
 * @param {*} promises
 * @returns {Promise}
 */
async function allSettled(promises) {
  const mapped = promises.map(promise => Promise.resolve(promise).reflect());
  const results = await Promise.all(mapped);
  const err = results.find(inspection => inspection.isRejected());
  if (err) {
    throw err.reason();
  }
  return results.map((inspection) => inspection.value());
}

module.exports = allSettled;
