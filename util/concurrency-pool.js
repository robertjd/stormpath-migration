const logger = require('./logger');

function releaseFrom(pool) {
  return function () {
    if (pool.pending.length === 0) {
      pool.numActive--;
      return;
    }
    pool.pending.shift().call();
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

    let outerResolve;
    const promise = new Promise(resolve => outerResolve = resolve);
    this.pending.push(() => outerResolve(resource));
    return promise;
  }

  each(list, fn) {
    return Promise.all(list.map(async (item) => {
      const resource = await this.acquire();
      const res = await fn(item);
      resource.release();
      return res;
    }));
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
