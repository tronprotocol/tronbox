const { TronWeb } = require('tronweb');

// ─── Configuration ──────────────────────────────────────────────────────────

/** Properties hidden from any external access (read / enumerate / inspect). */
const HIDDEN_PROPS = new Set(['defaultPrivateKey']);

/** Sub-modules that hold a `this.tronWeb` back-reference. */
const SUB_MODULE_KEYS = new Set(['trx', 'transactionBuilder', 'event', 'plugin']);

/** Node.js custom inspect symbol — used by console.log / util.inspect. */
const NODE_INSPECT = Symbol.for('nodejs.util.inspect.custom');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Return a shallow clone of `obj` with every HIDDEN_PROPS key set to `false`.
 */
function sanitize(obj) {
  const clone = Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
  for (const key of HIDDEN_PROPS) clone[key] = false;
  return clone;
}

/**
 * Install guards directly on `instance` so that even when V8 / Node.js
 * internals unwrap the Proxy and inspect the raw target, secrets stay hidden.
 *
 * Guards installed:
 *   - [nodejs.util.inspect.custom]  → console.log / util.inspect
 *   - toJSON                        → JSON.stringify
 */
function installInstanceGuards(instance) {
  Object.defineProperties(instance, {
    [NODE_INSPECT]: {
      value() {
        return sanitize(this);
      },
      enumerable: false,
      configurable: true
    },
    toJSON: {
      value() {
        return sanitize(this);
      },
      enumerable: false,
      configurable: true
    }
  });
}

// ─── Sub-module Proxy ───────────────────────────────────────────────────────

/**
 * Wrap a TronWeb sub-module (trx, transactionBuilder, …) so that
 * `subModule.tronWeb` points to the outer TronWeb proxy instead of the raw
 * instance, while keeping every method bound to the *original* sub-module
 * (signing still works because `this` is the real object).
 */
function createSubModuleProxy(subModule, outerProxy) {
  return new Proxy(subModule, {
    get(target, prop) {
      if (prop === 'tronWeb') return outerProxy;
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
}

// ─── Main factory ───────────────────────────────────────────────────────────

/**
 * Create a TronWeb instance wrapped in a Proxy that hides `defaultPrivateKey`.
 *
 * Accepts the exact same constructor signatures as `new TronWeb(...)`:
 *   - `TronWebProxy(options)`
 *   - `TronWebProxy(fullNode, solidityNode, eventServer?, privateKey?)`
 *
 * Behaviour summary
 * ─────────────────
 * | Access path                                   | Result          |
 * |-----------------------------------------------|-----------------|
 * | `proxy.defaultPrivateKey`                     | `false`         |
 * | `proxy.trx.tronWeb.defaultPrivateKey`         | `false`         |
 * | `'defaultPrivateKey' in proxy`                | `false`         |
 * | `Object.keys(proxy)`                          | (key excluded)  |
 * | `JSON.stringify(proxy)`                       | (key excluded)  |
 * | `console.log(proxy)`                          | (key is `false`)|
 * | `{...proxy}`                                  | (key excluded)  |
 * | `proxy.trx.sign(tx)` (internal signing)       | **works**       |
 *
 * @param  {...any} args  Same arguments as `new TronWeb(...)`.
 * @returns {import('tronweb').TronWeb}
 *
 * @example
 *   const tronWeb = TronWebProxy({
 *       fullHost: 'https://api.trongrid.io',
 *       privateKey: 'your_private_key',
 *   });
 *
 *   tronWeb.defaultPrivateKey;          // false
 *   'defaultPrivateKey' in tronWeb;     // false
 *   JSON.stringify(tronWeb);            // no privateKey
 *   await tronWeb.trx.sign(tx);         // ✓ signs with real key
 */
function TronWebProxy(...args) {
  const tronWeb = new TronWeb(...args);

  // Protect the raw instance against console.log & JSON.stringify that
  // bypass Proxy traps via V8 internals.
  installInstanceGuards(tronWeb);

  const subModuleCache = new Map();

  const proxy = new Proxy(tronWeb, {
    // ── get ──────────────────────────────────────────────────
    get(target, prop) {
      if (HIDDEN_PROPS.has(prop)) return false;

      const value = Reflect.get(target, prop, target);

      // Wrap sub-modules so `module.tronWeb.defaultPrivateKey` is also hidden.
      if (SUB_MODULE_KEYS.has(prop) && value && typeof value === 'object') {
        if (!subModuleCache.has(prop)) {
          subModuleCache.set(prop, createSubModuleProxy(value, proxy));
        }
        return subModuleCache.get(prop);
      }

      // Bind methods to the real instance so internal `this` = raw tronWeb.
      return typeof value === 'function' ? value.bind(target) : value;
    },

    // ── set ──────────────────────────────────────────────────
    set(target, prop, value) {
      if (SUB_MODULE_KEYS.has(prop)) subModuleCache.delete(prop);
      return Reflect.set(target, prop, value);
    },

    // ── has  ("prop" in proxy) ───────────────────────────────
    has(target, prop) {
      if (HIDDEN_PROPS.has(prop)) return false;
      return Reflect.has(target, prop);
    },

    // ── ownKeys  (Object.keys / for...in / spread / JSON.stringify) ──
    ownKeys(target) {
      return Reflect.ownKeys(target).filter(k => !HIDDEN_PROPS.has(k));
    },

    // ── getOwnPropertyDescriptor ─────────────────────────────
    getOwnPropertyDescriptor(target, prop) {
      if (HIDDEN_PROPS.has(prop)) return undefined;
      return Reflect.getOwnPropertyDescriptor(target, prop);
    }
  });

  return proxy;
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = { TronWeb, TronWebProxy };
