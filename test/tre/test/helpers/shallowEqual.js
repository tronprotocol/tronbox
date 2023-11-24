const assert = require('assert');

function shallowEqual(actual, expected, message) {
  const actualKeys = Object.keys(actual);
  const expectedKeys = Object.keys(expected);

  assert.deepStrictEqual(actualKeys, expectedKeys, `${message}: Keys do not match`);

  for (const key of actualKeys) {
    const actualValue = actual[key];
    const expectedValue = expected[key];

    if (key === 'memory' || key === 'stack' || key === 'storage') {
      continue;
    }

    if (typeof actualValue === 'object' && typeof expectedValue === 'object') {
      shallowEqual(actualValue, expectedValue, message);
      continue;
    }

    assert.strictEqual(actualValue, expectedValue, `${message}: Values for key '${key}' do not match`);
  }
}

module.exports = shallowEqual;
