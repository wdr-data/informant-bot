const extend = require('extend');
const hash = require('object-hash');
const fs = require('fs');

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

    fs.readFile(`./__mockData__/${paramsHash}.json`, 'utf8', (err, data) => {
      if (err) {
        reject(`Reading mock request file for parameters ` +
               `${JSON.stringify(params, null, 2)} with hash ` +
               `${paramsHash} failed: ${err}`)
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

module.exports = request;
