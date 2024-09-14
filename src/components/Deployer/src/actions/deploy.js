const TronWrap = require('../../../TronWrap');
const { dlog } = require('../../../TronWrap');
const Contract = require('../../../Contract');
const provision = require('../../../Provisioner');

module.exports = function (contract, args, deployer) {
  return function () {
    let should_deploy = true;
    const trufflePlugin = deployer.trufflePlugin || false;

    if (!contract.initTronWeb) {
      const abstraction = Contract(contract._json);
      // abstraction.defaults(this.class_defaults)
      provision(abstraction, deployer.options);
      contract = abstraction;
    }

    // Evaluate any arguments if they're promises (we need to do this in all cases to maintain consistency)
    return Promise.all(args)
      .then(function (new_args) {
        // Check the last argument. If it's an object that tells us not to overwrite, then lets not.
        if (new_args.length > 0) {
          const last_arg = new_args[new_args.length - 1];
          if (typeof last_arg === 'object' && last_arg.overwrite === false && contract.isDeployed()) {
            should_deploy = false;
          }
          delete last_arg.overwrite;
        }

        if (should_deploy === true) {
          let prefix = 'Deploying ';
          if (contract.isDeployed()) {
            prefix = 'Replacing ';
          }
          deployer.logger.log(prefix + contract.contract_name + '...');
          dlog(new_args);
          return contract.new.apply(contract, new_args);
        } else {
          return contract.deployed();
        }
      })
      .then(function (instance) {
        const tronWrap = TronWrap();
        if (should_deploy === true) {
          if (tronWrap._web3) {
            deployer.logger.log(contract.contract_name + ':\n    (hex) ' + instance.address);
          } else {
            deployer.logger.log(
              contract.contract_name +
                ':\n    (base58) ' +
                tronWrap.address.fromHex(instance.address) +
                '\n    (hex) ' +
                instance.address
            );
          }
        } else {
          deployer.logger.log("Didn't deploy " + contract.contract_name + '; using ' + instance.address);
        }

        instance.address = trufflePlugin ? instance.address.replace(/^41/, '0x') : instance.address;

        // Ensure the address and tx-hash are set on the contract.
        contract.address = instance.address;
        contract.transactionHash = instance.transactionHash;

        dlog('Instance name:', instance && instance.constructor ? instance.constructor.contractName : null);
        return instance;
      });
  };
};
