function EthersSignerProxy(wallet) {
  return new Proxy(wallet, {
    get(target, prop) {
      if (prop === 'privateKey' || prop === 'signingKey') {
        return false;
      }
      const value = target[prop];
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    }
  });
}
module.exports = { EthersSignerProxy };
