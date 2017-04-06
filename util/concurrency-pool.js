const allSettled = require('./all-settled');

function releaseFrom(pool) {
  return function () {
    if (pool.pending.length === 0) {
      pool.numActive--;
      return;
    }
    pool.pending.shift().resolve();
  };
}

class ConcurrencyPool {

  constructor(maxConcurrent) {
    this.numActive = 0;
    this.pending = [];
    this.maxConcurrent = maxConcurrent;
  }

  acquire() {
    const resource = { release: releaseFrom(this) };

    if (this.numActive < this.maxConcurrent) {
      this.numActive++;
      return Promise.resolve(resource);
    }

    let resolve, reject;
    const promise = new Promise((innerResolve, innerReject) => {
      resolve = innerResolve;
      reject = innerReject;
    });
    this.pending.push({
      resolve: () => resolve(resource),
      reject
    });
    return promise;
  }

  async each(list, fn) {
    const promises = list.map(async (item) => {
      const resource = await this.acquire();
      const res = await fn(item);
      resource.release();
      return res;
    });
    try {
      return await Promise.all(promises);
    } catch (err) {
      this.pending.forEach(item => item.reject());
      await allSettled(promises);
      throw new Error(err);
    }
  }

  async mapToObject(list, fn) {
    const map = {};
    await this.each(list, (item) => {
      return fn(item, map);
    });
    return map;
  }

}

module.exports = ConcurrencyPool;
