/*!
 * Copyright (c) 2017, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */
const Promise = require('bluebird');
const fs = require('fs');
const ConcurrencyPool = require('../util/concurrency-pool');
const readFile = Promise.promisify(fs.readFile);
const config = require('../util/config');

// Global limit on how many files we can have open at any given time. This
// prevents an EMFILE error when opening more files than the OS limit.
const FILE_OPEN_LIMIT = 1000;

class FileIterator {

  constructor(dir, Klass, options) {
    if (!fs.existsSync(dir)) {
      this.files = [];
      return;
    }
    this.dir = dir;
    this.files = fs.readdirSync(dir, 'utf8').filter((file) => file.endsWith('.json'))

    if (config.maxFiles) {
      this.files = this.files.slice(0, config.maxFiles);
    }

    this.Klass = Klass;
    this.options = options;
  }

  async readFile(file) {
    const filePath = `${this.dir}/${file}`;
    const contents = await readFile(filePath, 'utf8');
    return new this.Klass(filePath, JSON.parse(contents), this.options);
  }

  each(fn, options) {
    const limit = options && options.limit || FILE_OPEN_LIMIT;
    const pool = new ConcurrencyPool(limit);
    return pool.each(this.files, async (file) => {
      const instance = await this.readFile(file);
      return await fn(instance);
    });
  }

  mapToObject(fn, options) {
    const limit = options && options.limit || FILE_OPEN_LIMIT;
    const pool = new ConcurrencyPool(limit);
    return pool.mapToObject(this.files, async (file, map) => {
      const instance = await this.readFile(file);
      return await fn(instance, map);
    });
  }

  get length() {
    return this.files.length;
  }

}

module.exports = FileIterator;
