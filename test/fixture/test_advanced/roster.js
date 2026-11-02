const Roster = artifacts.require('./Roster.sol');

contract('Roster', function (accounts) {
  let roster;

  function turnBN2N(values) {
    if (values instanceof Array) {
      return values.map(turnBN2N);
    }
    if (values._isBigNumber) return values.toNumber();
    if (typeof values === 'bigint') return Number(values);
    return values;
  }

  before(async function () {
    roster = await Roster.deployed();
  });

  it('seeds three persons including the constructor argument', async function () {
    assert.deepEqual(turnBN2N(await roster.getPersons()), [
      ['Tom', 30],
      ['Lily', 20],
      ['Oscar', 30]
    ]);
  });

  it('returns a single person by id', async function () {
    const person = await roster.getPersonById(0);
    assert.deepEqual(turnBN2N(person), ['Tom', 30]);
  });

  it('echoes the person passed in', async function () {
    const person1 = ['return', 101];
    const person2 = turnBN2N(await roster.echoPerson(person1));
    assert.deepEqual(person1, person2);
  });

  it('inserts a person', async function () {
    const lastPersons = turnBN2N(await roster.getPersons());
    const person1 = ['insert', 100];
    await roster.insert(person1);
    const person2 = [['insert', 101]];
    await roster.insert(person2);
    const persons = turnBN2N(await roster.getPersons());
    assert.deepEqual(lastPersons.concat([person1, ...person2]), persons);
  });

  it('inserts a batch of persons', async function () {
    const lastPersons = turnBN2N(await roster.getPersons());
    const newPersons = [
      ['insert2', 99],
      ['insert3', 98]
    ];
    await roster.insertBatch(newPersons);
    const persons = turnBN2N(await roster.getPersons());
    assert.deepEqual(lastPersons.concat(newPersons), persons);
  });

  it('dispatches overloaded functions by signature', async function () {
    const uint256Result = await roster['func(uint256)'](1);
    const addressResult = await roster['func(address)'](roster.address);
    assert.equal(uint256Result, '0x7f98a45e', 'func(uint256) returned an unexpected value');
    assert.equal(addressResult, '0xb8550dc7', 'func(address) returned an unexpected value');

    const uint256CallResult = await roster['func(uint256)'].call(1);
    const addressCallResult = await roster['func(address)'].call(roster.address);
    assert.equal(uint256CallResult, '0x7f98a45e', 'func(uint256) using .call returned an unexpected value');
    assert.equal(addressCallResult, '0xb8550dc7', 'func(address) using .call returned an unexpected value');
  });

  it('honors blockHeader.timestamp when deploying', async function () {
    const person = ['insert', 100];
    const currentBlock = await tronWeb.trx.getCurrentBlock();
    const expectedTimestamp = 1;
    const blockHeader = {
      ref_block_bytes: currentBlock.block_header.raw_data.number.toString(16).slice(-4).padStart(4, '0'),
      ref_block_hash: currentBlock.blockID.slice(16, 32),
      expiration: currentBlock.block_header.raw_data.timestamp + 60 * 1000,
      timestamp: expectedTimestamp
    };
    const deployedInstance = await Roster.new(person, { blockHeader });
    const txReceipt = await tronWeb.trx.getTransaction(deployedInstance.transactionHash);
    assert.equal(
      txReceipt.raw_data.timestamp,
      expectedTimestamp,
      'Transaction receipt timestamp should match the provided timestamp'
    );
  });

  it('honors blockHeader.timestamp on a txLocal call', async function () {
    const currentBlock = await tronWeb.trx.getCurrentBlock();
    const expectedTimestamp = 1;
    const blockHeader = {
      ref_block_bytes: currentBlock.block_header.raw_data.number.toString(16).slice(-4).padStart(4, '0'),
      ref_block_hash: currentBlock.blockID.slice(16, 32),
      expiration: currentBlock.block_header.raw_data.timestamp + 60 * 1000,
      timestamp: expectedTimestamp
    };
    const person = ['insert', 100];
    const txId = await roster.insert(person, { txLocal: true, blockHeader });
    const txReceipt = await tronWeb.trx.getTransaction(txId);
    assert.equal(
      txReceipt.raw_data.timestamp,
      expectedTimestamp,
      'Transaction receipt timestamp should match the provided timestamp'
    );
  });

  it('handles shouldPollResponse / keepTxID / rawResponse and decodes contractResult', async function () {
    const personA = ['insert', 100];
    const resultA = await roster.insert(personA, {
      shouldPollResponse: true
    });
    const personB = ['insert', 99];
    const resultB = await roster.insert(personB, {
      shouldPollResponse: true,
      keepTxID: true
    });
    const personC = ['insert', 98];
    const resultC = await roster.insert(personC, {
      shouldPollResponse: true,
      rawResponse: true
    });
    const decodedC = await tronWeb.utils.abi.decodeParamsV2ByABI(
      roster.abi.filter(i => i.name === 'insert')[0],
      `0x${resultC.contractResult}`
    );

    assert.deepEqual(personA, turnBN2N(resultA), 'Result A did not match the expected values');
    assert.deepEqual(personB, turnBN2N(resultB[1]), 'Result B (with keepTxID) did not match the expected values');
    assert.deepEqual(personC, turnBN2N(decodedC[0]), 'Decoded Result C did not match the expected values');

    // Single-account environments let us verify the pollTimes guard.
    if (accounts.length === 1) {
      try {
        await roster.insert(personA, {
          shouldPollResponse: true,
          pollTimes: 1
        });
      } catch (error) {
        assert.include(error, 'Cannot find result in solidity node', 'Expected error when pollTimes is insufficient');
      }
    }
  });
});
