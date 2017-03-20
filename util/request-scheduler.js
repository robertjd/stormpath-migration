'use strict';

const Promise = require('bluebird');
const rp = require('request-promise');
const logger = require('../util/logger');
const config = require('../util/config');

/**
 * Calculates the time to schedule the next request in milliseconds - returns 0
 * if the rate limit hasn't been hit, otherwise the time to the next rate
 * limit reset.
 * @param {Object} headers
 * @param {String} headers['date']
 * @param {Number} headers['x-rate-limit-remaining']
 * @param {Number} headers['x-rate-limit-reset']
 * @returns {Number} number of milliseconds to next available request
 */
function timeToNextRequest(headers) {
  const remaining = headers['x-rate-limit-remaining']

  // TODO: Errors don't return rate limit headers. Replace this with logic to:
  // 1. Check if statusCode 429. Rate limited!
  // 2. If error and not 429, make a request to /api/v1/users/me to check
  //    current rate limit. Are we flying too close to the sun?
  if (remaining === undefined) {
    logger.debug('No rate-limit headers on error response, continuing');
    return 0;
  }

  if (remaining > 0) {
    logger.debug(`x-rate-limit-remaining ${remaining}`);
    return 0;
  }

  const serverTimeUtcMs = Date.parse(headers.date);
  const serverResetUtcMs = headers['x-rate-limit-reset'] * 1000;

  // Add an extra buffer of 1000ms
  const time = serverResetUtcMs - serverTimeUtcMs + 1000;

  logger.debug(`Rate limit reached, scheduling next request in ${time}ms`);
  return time;
}

/**
 * Executes the next request in the scheduler queue.
 * @param {RequestScheduler} scheduler
 */
function execute(scheduler) {
  if (scheduler.pending >= scheduler.concurrencyLimit) {
    logger.debug(`${next.msg} [Concurrency limit ${scheduler.concurrencyLimit} reached, deferring]`);
    return;
  }

  const next = scheduler.queue.shift();
  if (!next) {
    logger.debug('Queue empty');
    return;
  }

  logger.debug(`${next.msg} [Requesting, ${scheduler.pending}]`);

  scheduler.pending++;
  const after = (type, res) => {
    scheduler.pending--;
    logger.debug(`${next.msg} [${type}, ${scheduler.pending}]`);
    const headers = res.headers || res.response.headers;
    setTimeout(() => execute(scheduler), timeToNextRequest(headers));
  };

  next.fn.call()
  .then((res) => {
    after('Success', res);
    next.resolve(res.body);
  })
  .catch((err) => {
    after('Failure', err);
    next.reject(err);
  });
}

/**
 * Schedules the next request, and executes it if concurrency and rate limits
 * are not hit.
 * @param {RequestScheduler} scheduler
 * @param {String} msg
 * @param {Function} fn
 */
function schedule(scheduler, msg, fn) {
  const promise = new Promise((resolve, reject) => {
    logger.debug(`${msg} [Schedule]`);
    scheduler.queue.push({ msg, fn, resolve, reject });
  });
  execute(scheduler);
  return promise;
}

/**
 * Class that wraps request-promise with two enhancements:
 * 1. Limits the number of concurrent requests that are made at any given time
 * 2. Defers executing new requests if rate-limit is hit
 */
class RequestScheduler {

  /** Constructor */
  constructor() {
    this.concurrencyLimit = config.concurrencyLimit;
    this.pending = 0;
    this.queue = [];
    this.rp = rp.defaults({
      baseUrl: config.oktaBaseUrl,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `SSWS ${config.oktaApiToken}`
      },
      resolveWithFullResponse: true,
      json: true,
      simple: true,
      agentOptions: {
          keepAlive: false
      }
    });
  }

  /** Wrapper around request-promise.get */
  get() {
    const msg = `GET ${JSON.stringify(arguments)}`;
    return schedule(this, msg, () => this.rp.get.apply(null, arguments));
  }

  /** Wrapper around request-promise.put */
  put() {
    const msg = `PUT ${JSON.stringify(arguments)}`;
    return schedule(this, msg, () => this.rp.put.apply(null, arguments));
  }

  /** Wrapper around request-promise.post */
  post() {
    const msg = `POST ${JSON.stringify(arguments)}`;
    return schedule(this, msg, () => this.rp.post.apply(null, arguments));
  }

  /** Wrapper around request-promise.delete */
  delete() {
    const msg = `DELETE ${JSON.stringify(arguments)}`;
    return schedule(this, msg, () => this.rp.delete.apply(null, arguments));
  }

}

module.exports = new RequestScheduler();
