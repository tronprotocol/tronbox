const wait = require('./helpers/wait')
const MetaCoin = artifacts.require('./MetaCoin.sol')

// The following tests require TronBox >= 2.1.x
// and Tron Quickstart (https://github.com/tronprotocol/docker-tron-quickstart)

contract('MetaCoin', function (accounts) {
  let meta

  before(async function () {
    meta = await MetaCoin.deployed()
  })

  const getBlockNumber = async () => {
    const {
      block_header: {
        raw_data: { number },
      },
    } = await tronWrap.trx.getCurrentBlock()

    return number
  }

  const generateAccount = async () => {
    const {
      address: { base58: account },
    } = tronWrap.utils.accounts.generateAccount()
    return account
  }

  it('should successfully set account balance', async function () {
    const account = await generateAccount()
    const balance = 100
    const beforeBalance = await tronWrap.trx.getBalance(account)
    const success = await tronWrap.send('tre_setAccountBalance', [account, balance])
    const afterBalance = await tronWrap.trx.getBalance(account)
    const afterBalanceByMeta = await meta.getTrxBalance(account)
    assert.isTrue(success, 'The tre_setAccountBalance return value is incorrect')
    assert.equal(beforeBalance, 0, 'Balance is not 0')
    assert.equal(afterBalance, balance, 'Balance setting failed')
    assert.equal(afterBalanceByMeta[0].toNumber(), balance, 'Balance returned by the contract is incorrect')
  })

  it('should successfully set account code', async function () {
    const account = await generateAccount()
    const code = '0xbaddad42'
    const newCode =
      '0x60806040526000805534801561001457600080fd5b506040516104813803806104818339810160408190526100339161005c565b600280546001600160a01b03191633908117909155600090815260016020526040902055610074565b60006020828403121561006d578081fd5b5051919050565b6103fe806100836000396000f3fe608060405234801561001057600080fd5b50600436106100cf5760003560e01c806386d516e81161008c57806396c610e11161006657806396c610e114610157578063a8b0574e1461016a578063ee82ac5e14610172578063f8b2cb4f14610185576100cf565b806386d516e814610127578063893d20e81461012f57806390b98a1114610137576100cf565b80630f28c97d146100d457806318160ddd146100f257806327e86d6e146100fa57806342cbb15c1461010257806372425d9d1461010a5780637a6ce2e114610112575b600080fd5b6100dc610198565b6040516100e9919061037a565b60405180910390f35b6100dc61019c565b6100dc6101a2565b6100dc6101b5565b6100dc6101b9565b61011a6101bd565b6040516100e99190610337565b6100dc6101c1565b61011a6101c5565b61014a6101453660046102f6565b6101d4565b6040516100e9919061036f565b6100dc6101653660046102d5565b61028a565b61011a610297565b6100dc61018036600461031f565b61029b565b6100dc6101933660046102d5565b61029f565b4290565b60005481565b60006101af60014361039b565b40905090565b4390565b4490565b3390565b4590565b6002546001600160a01b031690565b336000908152600160205260408120548211156101f357506000610284565b336000908152600160205260408120805484929061021290849061039b565b90915550506001600160a01b0383166000908152600160205260408120805484929061023f908490610383565b90915550506040517fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906102789033908690869061034b565b60405180910390a15060015b92915050565b6001600160a01b03163190565b4190565b4090565b6001600160a01b0381166000908152600160205260409020545b919050565b80356001600160a01b03811681146102b957600080fd5b6000602082840312156102e6578081fd5b6102ef826102be565b9392505050565b60008060408385031215610308578081fd5b610311836102be565b946020939093013593505050565b600060208284031215610330578081fd5b5035919050565b6001600160a01b0391909116815260200190565b6001600160a01b039384168152919092166020820152604081019190915260600190565b901515815260200190565b90815260200190565b60008219821115610396576103966103b2565b500190565b6000828210156103ad576103ad6103b2565b500390565b634e487b7160e01b600052601160045260246000fdfea26469706673582212203dbda94421e1746fab55e02e8c06b5b544bef55e408d714eed82346c2ade431d64736f6c63430008000033'
    const slot = '0x0000000000000000000000000000000000000000000000000000000000000000'
    const value = '0x0000000000000000000000000000000000000000000000000000000000000001'

    const beforeContract = await tronWrap.trx.getContract(account)
    await tronWrap.send('tre_setAccountCode', [account, code])
    const afterContract = await tronWrap.trx.getContract(account)
    const setCodeSuccess = await tronWrap.send('tre_setAccountCode', [account, newCode])
    const newContract = await tronWrap.trx.getContract(account)
    assert.isTrue(setCodeSuccess, 'The tre_setAccountCode return value is incorrect')
    assert.isTrue(!beforeContract.bytecode, 'Account already has code')
    assert.equal(afterContract.bytecode, code, 'Code setting failed')
    assert.equal(newContract.bytecode, newCode, 'Code replacement failed')

    const ins = await tronWrap.contract().at(account)
    const beforeTotalSupply = await ins.totalSupply()
    const setStorageSuccess = await tronWrap.send('tre_setAccountStorageAt', [account, slot, value])
    const afterTotalSupply = await ins.totalSupply()
    assert.isTrue(setStorageSuccess, 'The tre_setAccountStorageAt return value is incorrect')
    assert.equal(beforeTotalSupply, 0, 'Total supply is not 0')
    assert.equal(afterTotalSupply, 1, 'Total supply setting failed')
  })

  it('should successfully set block time', async function () {
    const success = await tronWrap.send('tre_startMine', [0])
    await wait(3)
    const beforeNumber = await getBlockNumber()
    await wait(10)
    const afterNumber = await getBlockNumber()
    const afterNumberByMeta = await meta.getBlockNumber()
    assert.isTrue(success, 'The tre_startMine return value is incorrect')
    assert.equal(beforeNumber, afterNumber, 'Pause mining failed')
    assert.equal(afterNumber, afterNumberByMeta, 'Block number returned by the contract is incorrect')

    await tronWrap.send('tre_startMine', [3])
    await wait(10)
    const curNumber = await getBlockNumber()
    assert.isTrue(curNumber - afterNumber > 0, 'Block time setting failed')
  })

  it('should successfully mine some blocks', async function () {
    await tronWrap.send('tre_startMine', [0])
    await wait(3)
    const beforeNumber = await getBlockNumber()
    const success = await tronWrap.send('tre_mine', [{ blocks: 3 }])
    await wait(10)
    const afterNumber = await getBlockNumber()
    assert.equal(success, '0x0', 'The tre_mine return value is incorrect')
    assert.equal(afterNumber - beforeNumber, 10, 'Mine blocks failed')
  })

  it('should successfully unlock some accounts', async function () {
    const unlockedAccounts = [await generateAccount(), await generateAccount()]
    await tronWrap.send('tre_setAccountBalance', [unlockedAccounts[0], `0x${Number(1000 * 1e6).toString(16)}`])
    await tronWrap.send('tre_unlockedAccounts', [[unlockedAccounts[0]]])

    const { address } = await MetaCoin.new(10000, {
      from: unlockedAccounts[0],
    })
    MetaCoin.address = address
    const unlockedMeta = await MetaCoin.deployed()

    const owner = await unlockedMeta.getOwner()
    assert.equal(owner, tronWrap.address.toHex(unlockedAccounts[0]), 'The owner is incorrect')

    const [msgSender1] = await unlockedMeta.getMsgSender()
    assert.equal(msgSender1, tronWrap.address.toHex(accounts[0]), 'The default msg.sender is incorrect')

    const [msgSender2] = await unlockedMeta.getMsgSender({
      from: unlockedAccounts[0],
    })
    assert.equal(msgSender2, tronWrap.address.toHex(unlockedAccounts[0]), 'The msg.sender is incorrect')

    await unlockedMeta.sendCoin(accounts[0], 10, {
      from: unlockedAccounts[0],
    })
    assert.equal((await unlockedMeta.getBalance(unlockedAccounts[0])).toNumber(), 9990, "Amount wasn't correctly taken from the sender")
    assert.equal((await unlockedMeta.getBalance(accounts[0])).toNumber(), 10, "Amount wasn't correctly sent to the receiver")

    await unlockedMeta.sendCoin(unlockedAccounts[1], 10)
    assert.equal((await unlockedMeta.getBalance(accounts[0])).toNumber(), 0, "Amount wasn't correctly taken from the sender")
    assert.equal((await unlockedMeta.getBalance(unlockedAccounts[1])).toNumber(), 10, "Amount wasn't correctly sent to the receiver")

    try {
      await unlockedMeta.sendCoin(accounts[0], 10, {
        from: unlockedAccounts[1],
      })
    } catch (error) {
      assert.equal(error, 'sender account not recognized')
    }
  })
})
