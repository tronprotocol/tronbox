const fs = require('fs');

contract('TestLogs', function () {
  it('Should successfully output the log', async function () {
    const actualStr = fs.readFileSync('actual.log', 'utf-8');
    const expectedStr = fs.readFileSync('expected.log', 'utf-8');

    assert.equal(actualStr, expectedStr);
  });
});
