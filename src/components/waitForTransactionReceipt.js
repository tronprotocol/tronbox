// thanks Xavier Leprêtre
// https://gist.github.com/xavierlepretre/88682e871f4ad07be4534ae560692ee6

const waitForTransactionReceipt =
  tronWeb =>
  (txHash = false, interval = 500) => {
    const transactionReceiptAsync = (resolve, reject) => {
      tronWeb.trx
        .getTransactionInfo(txHash)
        .then(receipt => {
          if (!receipt || JSON.stringify(receipt) === '{}') {
            setTimeout(() => transactionReceiptAsync(resolve, reject), interval);
          } else {
            resolve(receipt);
          }
        })
        .catch(error => {
          reject(error);
        });
    };
    if (Array.isArray(txHash)) {
      return Promise.all(txHash.map(oneTxHash => waitForTransactionReceipt(oneTxHash, interval)));
    } else if (typeof txHash === 'string') {
      return new Promise(transactionReceiptAsync);
    } else {
      throw new Error('Invalid Type: ' + txHash);
    }
  };

module.exports = waitForTransactionReceipt;
