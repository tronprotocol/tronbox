const { assert } = require('chai');
const Tuple = artifacts.require('./Tuple.sol');

// The following tests require TronBox >= 2.1.x

contract('Tuple', function (accounts) {
  let tuple;

  function turnBN2N(values) {
    if (values instanceof Array) {
      return values.map(turnBN2N);
    }
    if (values._isBigNumber) return values.toNumber();
    if (typeof values === 'bigint') return Number(values);
    return values;
  }

  before(async function () {
    tuple = await Tuple.deployed();
  });

  it('should have 3 `person`s with `Tom` which is the first to verify that the argument passed to constructor works', async function () {
    assert.deepEqual(turnBN2N(await tuple.getPerson()), [
      ['Tom', 30],
      ['Lily', 20],
      ['Oscar', 30]
    ]);
  });

  it('should get `Tom 30` to verify getPersonById is working', async function () {
    const person = await tuple.getPersonById(0);
    assert.deepEqual(turnBN2N(person), ['Tom', 30]);
  });

  it('should return the same person', async function () {
    const person1 = ['return', 101];
    const person2 = turnBN2N(await tuple.echoPerson(person1));
    assert.deepEqual(person1, person2);
  });

  it('should insert person', async function () {
    const lastPersons = turnBN2N(await tuple.getPerson());
    const person1 = ['insert', 100];
    await tuple.insert(person1);
    const person2 = [['insert', 101]];
    await tuple.insert(person2);
    const persons = turnBN2N(await tuple.getPerson());
    assert.deepEqual(lastPersons.concat([person1, ...person2]), persons);
  });

  it('should insert persons', async function () {
    const lastPersons = turnBN2N(await tuple.getPerson());
    const persons1 = [
      ['insert2', 99],
      ['insert3', 98]
    ];
    await tuple.insertBatch(persons1);
    const persons2 = turnBN2N(await tuple.getPerson());
    assert.deepEqual(lastPersons.concat(persons1), persons2);
  });

  it('should correctly call overloaded functions', async function () {
    const uint256Result = await tuple['func(uint256)'](1);
    const addressResult = await tuple['func(address)'](tuple.address);
    assert.equal(uint256Result, '0x7f98a45e', 'func(uint256) returned an unexpected value');
    assert.equal(addressResult, '0xb8550dc7', 'func(address) returned an unexpected value');

    const uint256CallResult = await tuple['func(uint256)'].call(1);
    const addressCallResult = await tuple['func(address)'].call(tuple.address);
    assert.equal(uint256CallResult, '0x7f98a45e', 'func(uint256) using .call returned an unexpected value');
    assert.equal(addressCallResult, '0xb8550dc7', 'func(address) using .call returned an unexpected value');
  });
});
