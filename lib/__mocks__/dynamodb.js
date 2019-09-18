import hash from 'object-hash';
import fs from 'fs';

class MockumentClient {
    constructor() {
        this.calls = [];
    }

    async op(call, name) {
        const hashableCall = {
            operation: name,
            params: call.params,
        };
        const callHash = hash(hashableCall);
        this.calls.push(call);

        return new Promise((resolve, reject) =>
            fs.readFile(`./__mockData__/dynamodb/${callHash}.json`, 'utf8', (err, data) => {
                if (err) {
                    return reject(`Reading mock dynamoDB file for operation '${name}' with ` +
                 `parameters ${JSON.stringify(call.params, null, 2)} with ` +
                 `hash ${callHash} failed: ${err}`);
                }
                resolve(JSON.parse(data));
            }));
    }
}

const genMock = (mockClient, name) => function(params) {
    const call = { fn: mockClient[name], params };
    const res = mockClient.op(call, name);
    return {
        promise: () => res,
    };
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
