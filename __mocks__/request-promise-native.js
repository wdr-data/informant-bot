// Modified version of the "request" libraries "index.js"
// https://github.com/request/request/blob/v2.85.1/index.js
//
// Changes:
//  - Mock requests by hashing request parameters and loading responses from
//    a file instead of doing network operations
//  - Copied helper function "paramsHaveRequestBody" from
//    https://github.com/request/request/blob/v2.85.1/lib/helpers.js
//  - Minor changes to coding style
//
// The original license is provided as "LICENSE_APACHE2" with this software.
//
//
// --- Original Copyright Notice ---
//
// Copyright 2010-2012 Mikeal Rogers
//
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
//        http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.


const extend = require('extend');
const hash = require('object-hash');
const fs = require('fs');

const calls = [];
beforeEach(() => {
  calls.length = 0;
});

// organize params for patch, post, put, head, del
function initParams (uri, options, callback) {
  if (typeof options === 'function') {
    callback = options;
  }

  const params = {};
  if (typeof options === 'object') {
    extend(params, options, {uri});
  } else if (typeof uri === 'string') {
    extend(params, {uri});
  } else {
    extend(params, uri);
  }

  params.callback = callback || params.callback;
  return params;
}

function paramsHaveRequestBody (params) {
  return (
    params.body ||
    params.requestBodyStream ||
    (params.json && typeof params.json !== 'boolean') ||
    params.multipart
  )
}

function request (uri, options, callback) {
  return new Promise((resolve, reject) => {
    if (typeof uri === 'undefined') {
      reject('undefined is not a valid uri or options object.');
    }

    const params = initParams(uri, options, callback);

    if (params.method === 'HEAD' && paramsHaveRequestBody(params)) {
      reject('HTTP HEAD requests MUST NOT include a request body.');
    }
    const paramsHash = hash(params);

    calls.push(params);

    fs.readFile(`./__mockData__/${paramsHash}.json`, 'utf8', (err, data) => {
      if (err) {
        reject(`Reading mock request file for parameters ` +
               `${JSON.stringify(params, null, 2)} with hash ` +
               `${paramsHash} failed: ${err}`);
        return;
      }
      if (params.json) {
        resolve(JSON.parse(data));
      } else {
        resolve(data);
      }
    })
  });
}

function verbFunc (verb) {
  const method = verb.toUpperCase();
  return function (uri, options, callback) {
    const params = initParams(uri, options, callback);
    params.method = method;
    return request(params, params.callback);
  }
}

// define like this to please codeintel/intellisense IDEs
request.get = verbFunc('get');
request.head = verbFunc('head');
request.options = verbFunc('options');
request.post = verbFunc('post');
request.put = verbFunc('put');
request.patch = verbFunc('patch');
request.del = verbFunc('delete');
request['delete'] = verbFunc('delete');
request.calls = calls;

module.exports = request;
