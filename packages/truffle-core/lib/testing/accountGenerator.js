const TronWrap = require('tronwrap');
const fs = require('fs')
const path = require('path')

class AccountGenerator {

  async generate(amount, temporaryDirectory, network) {

    const tronWrap = TronWrap()

    tronWrap.setDefaultBlock('latest');

    const nodes = await tronWrap.isConnected();
    const connected = !Object.entries(nodes).map(([name, connected]) => {
      if (!connected)
        console.error(`Error: ${name} is not connected`);

      return connected;
    }).includes(false);

    if (!connected)
      return;

    const accounts = []

    for (let i = 0; i < amount; i++) {

      const account = await tronWrap.createAccount();
      if (tronWrap.isAddress(account.address.hex)) {
        accounts.push(account);
        await tronWrap.transactionBuilder.sendTrx(account.address.base58, 10000);
      } else {
        i--;
      }
    }

    if (temporaryDirectory) {
      fs.writeFileSync(path.join(temporaryDirectory, `accounts-${network}.json`), JSON.stringify(accounts))
    }

    process.env.testingAccounts = accounts
    return Promise.resolve(accounts)

  }

}



module.exports = new AccountGenerator
