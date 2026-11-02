contract('Failing', function () {
  const failures = Number(process.env.TEST_FAILURE_COUNT || 1);
  for (let index = 0; index < failures; index++) {
    it(`intentional assertion failure ${index + 1}`, function () {
      assert.strictEqual('actual', 'expected');
    });
  }
});
