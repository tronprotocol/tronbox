const { assert } = require('chai');
var chalk = require('chalk')
var Tuple = artifacts.require("./Tuple.sol");

// The following tests require TronBox >= 2.1.x

contract('Tuple', function (accounts) {

  let tuple

  function turnBN2N(values) {
    if (values instanceof Array) {
      return values.map(turnBN2N);
    }
    if (values._isBigNumber) return values.toNumber();
    return values;
  }

  before(async function () {
    tuple = await Tuple.deployed()
  })

  it("should have 3 `person`s with `tan` which is the first to verify that the argument passed to constructor works", async function () {
    assert.deepEqual(turnBN2N(await tuple.getPerson()), [['tan', 30], ['zhang', 20], ['zhaoliu', 30]]);
  });

  it("should get `tan 30` to verify getPersonById is working", async function () {
    const person = await tuple.getPersonById(0);
    assert.deepEqual(turnBN2N(person), ['tan', 30]);
  });

  it("should return the same person", async function () {
    const person = [['return', 101]];
    const person2 = turnBN2N(await tuple.getPerson2(person));
    assert.deepEqual(person[0], person2);
  });

  it("should insert person", async function () {
    const lastPersons = turnBN2N(await tuple.getPerson());
    const person = [['insert', 100]];
    await tuple.insert(person);
    const persons = turnBN2N(await tuple.getPerson());
    assert.deepEqual(lastPersons.concat(person), persons);
  })

  it("should insert persons", async function () {
    const lastPersons = turnBN2N(await tuple.getPerson());
    const persons = [[['insert2', 99], ['insert3', 98]]];
    await tuple.insertBatch(persons);
    const persons2 = turnBN2N(await tuple.getPerson());
    assert.deepEqual(lastPersons.concat(persons[0]), persons2);
  });

});
