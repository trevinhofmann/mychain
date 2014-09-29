'use strict';

// Render transaction information for a given txid.
exports.render = function (req, res) {
  console.log('Rendering: Tx');
  var txid = req.params.txid;
  rpc.getRawTransaction(txid, 1, function(err, ret){
    if (err){
      res.render('index', {error: 'Transaction was invalid: '+txid});
      return;
    }
    var tx = ret.result;
    tx.confirmations = tx.confirmations || 0;
    tx.isCoinbase = (typeof (tx["vin"][0]["coinbase"]) != 'undefined');
    TransactionTools.calculateFee(tx, function(fee){
      tx.fee = fee;
      res.render('tx', {tx: tx});
    });
  });
};
