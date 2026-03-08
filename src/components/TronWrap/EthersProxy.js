// Properties / methods that could leak private key material — access returns `false`.
const HIDDEN_KEYS = new Set([
  'privateKey', // BaseWallet — hex private key getter
  'signingKey', // BaseWallet — SigningKey object (has .privateKey, .sign(), etc.)
  'extendedKey', // HDNodeWallet — xpriv contains raw private key bytes
  'mnemonic', // HDNodeWallet — seed phrase / entropy can derive all keys
  'encrypt', // Wallet — attacker picks password, decrypts keystore → key leak
  'encryptSync' // Wallet — synchronous variant of encrypt
]);

// Methods that return a new Wallet / Signer — the result must be re-wrapped.
const REWRAP_METHODS = new Set([
  'connect', // Wallet / BaseWallet / HDNodeWallet → new unproxied wallet
  'deriveChild', // HDNodeWallet → new HDNodeWallet
  'derivePath' // HDNodeWallet → new HDNodeWallet (calls deriveChild internally)
]);

/**
 * Wraps an ethers Wallet in a Proxy that hides private key material.
 *
 * - Accessing any key in HIDDEN_KEYS silently returns `false`.
 * - Methods in REWRAP_METHODS are intercepted so their return value
 *   is automatically re-wrapped, preventing proxy escapes.
 * - All other properties and methods are forwarded to the real wallet.
 */
function EthersSignerProxy(wallet) {
  return new Proxy(wallet, {
    get(target, prop) {
      if (HIDDEN_KEYS.has(prop)) return false;

      const value = target[prop];

      // Re-wrap methods that return a new wallet/signer
      if (REWRAP_METHODS.has(prop) && typeof value === 'function') {
        return function (...args) {
          const result = value.apply(target, args);
          if (result && typeof result.then === 'function') {
            return result.then(r =>
              r && typeof r === 'object' && typeof r.getAddress === 'function' ? EthersSignerProxy(r) : r
            );
          }
          return result && typeof result === 'object' && typeof result.getAddress === 'function'
            ? EthersSignerProxy(result)
            : result;
        };
      }

      if (typeof value === 'function') {
        return value.bind(target);
      }

      return value;
    },

    // Hide sensitive keys from enumeration (Object.keys, for..in, etc.)
    ownKeys(target) {
      return Reflect.ownKeys(target).filter(k => !HIDDEN_KEYS.has(k));
    },

    getOwnPropertyDescriptor(target, prop) {
      if (HIDDEN_KEYS.has(prop)) return undefined;
      return Reflect.getOwnPropertyDescriptor(target, prop);
    }
  });
}

module.exports = { EthersSignerProxy };
