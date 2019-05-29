# MetaCoin TronBox Example
Originally forked from [truffle-box/metacoin](https://github.com/truffle-box/metacoin-box).

### Configure Network Information for TronBox

Network configuration is required by TronBox.
In our case we use Tron Quickstart for local testing, and TroGrid for as testnet.

```
module.exports = {
  networks: {

// trontools/quickstart docker image
    development: {
          // For trontools/quickstart docker image
          privateKey: 'da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0',
          consume_user_resource_percent: 30,
          fee_limit: 100000000,
          fullHost: "http://127.0.0.1:9090",
          network_id: "9090"
        },
        shasta: {
          privateKey: process.env.PK,
          consume_user_resource_percent: 30,
          fee_limit: 100000000,
          fullHost: "https://api.shasta.trongrid.io",
          network_id: "2"
        }
  }
}
```

### Use your own private network

`tronbox migrate` by default will use the `development` network that is set to use Tron Quickstart. In order to test the smart contracts and deploy them you must install Tron Quickstart.

1. [Install Docker](https://docs.docker.com/install/).

2. Run Tron Quickstart:
```
docker run -it --rm -p 9090:9090 --name tron trontools/quickstart
```

### TronBox commands
```
tronbox compile
tronbox migrate --reset
tronbox test
```

The first time you execute a migration, the process can stuck. It is a know bug that we are trying to fix. Just Ctrl-c to stop the process. As you can verify, the contracts have been correctly deployed.

### Run the example dApp on Shasta

1. You need an account with some Shasta TRX. If you don't have any, open https://www.trongrid.io/shasta/ and require some Shasta TRX at the bottom of the page.

2. Edit your `tronbox.js` and in the section `shasta`, set the privateKey of the account for which you requested Shasta TRX.

3. Verify that your account is not empty opening a page like https://api.shasta.trongrid.io/wallet/getaccount?address=41559f48a697a006cfc35009cb059a400fc526b31f  using, of course, your account address.

4. Set the dApp. The dApp needs to know the address where the MetaCoin contract has been deployed. We have put in the box a special script:

```
npm run setup-dapp
```

It will execute the migration, retrieve the contract address and save it in the file `src/js/metacoin-config.js`.

5. Run the dApp:

```
npm run dev
```
It automatically will open the dApp in the default browser.


6. Enjoy your working Tron dApp!



