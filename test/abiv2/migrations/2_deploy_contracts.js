var Tuple = artifacts.require("./Tuple.sol");

module.exports = function(deployer) {
  deployer.deploy(Tuple, ['tan', '30'], { overwrite: true });
};
