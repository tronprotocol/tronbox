var wrapper = require('./wrapper.js');

function getWrapper(options) {
  let soljson = require(`./soljson_v${options.compilerVersion || 1}.js`)
  return wrapper(soljson)
}

module.exports = wrapper(require('./soljson_v1.js'));
module.exports.getWrapper = getWrapper
