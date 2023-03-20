var Tuple = artifacts.require("./Tuple.sol");

module.exports = function(deployer) {
  deployer.deploy(Tuple, ['Tom', '30'], { overwrite: true });
};
