import hash from 'object-hash';
import fs from 'fs';

class MockumentClient {
    constructor() {
        this.calls = [];
    }

    op(call, name, callback) {
        const hashableCall = {
            operation: name,
            params: call.params,
        };
        const callHash = hash(hashableCall);
        this.calls.push(call);

        fs.readFile(`./__mockData__/dynamodb/${callHash}.json`, 'utf8', (err, data) => {
            if (err) {
                callback(`Reading mock dynamoDB file for operation '${name}' with ` +
                 `parameters ${JSON.stringify(call.params, null, 2)} with ` +
                 `hash ${callHash} failed: ${err}`);
                return;
            }
            callback(null, JSON.parse(data));
        });
    }
}

const genMock = (mockClient, name) => function(params, callback) {
    const call = { fn: mockClient[name], params };
    mockClient.op(call, name, callback);
};

const mockumentClient = new MockumentClient();

mockumentClient.put = genMock(mockumentClient, 'put');
mockumentClient.get = genMock(mockumentClient, 'get');
mockumentClient.delete = genMock(mockumentClient, 'delete');
mockumentClient.update = genMock(mockumentClient, 'update');

beforeEach(() => {
    mockumentClient.calls.length = 0;
});

export default mockumentClient;
