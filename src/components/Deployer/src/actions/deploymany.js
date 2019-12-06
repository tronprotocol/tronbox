const deploy = require('./deploy')

module.exports = function (arr, deployer) {
  return function () {
    const deployments = arr.map(function (args) {
      let contract

      if (Array.isArray(args)) {
        contract = args.shift()
      } else {
        contract = args
        args = []
      }

      return deploy(contract, args, deployer)()
    })

    return Promise.all(deployments)
  }
}
