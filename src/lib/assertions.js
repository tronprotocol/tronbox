const BigNumber = require('bignumber.js')
module.exports = function (chai) {
  const assert = chai.assert
  chai.Assertion.addProperty('address', function () {
    this.assert(this._obj.length === 42, 'expected #{this} to be a 42 character address (0x...)', 'expected #{this} to not be a 42 character address (0x...)')

    const number = BigNumber(this._obj)
    this.assert(number.equals(0) === false, 'expected address #{this} to not be zero', 'you shouldn\'t ever see this.')
  })
  assert.isAddress = function (val, exp, msg) {
    return new chai.Assertion(val, msg).to.be.address
  }
}
