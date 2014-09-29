'use strict';

// Render information for a given input.
exports.render = function (req, res) {
  console.log('Rendering: Input, requesting IP: '+req.connection.remoteAddress);
  var txid = req.params.txid;
  var inputid = req.params.inputid;
  rpc.getRawTransaction(txid, 1, function(err, ret){
    if (err || inputid < 0 || inputid >= ret.result.vout.length){
      res.render('index', {error: 'Input was invalid: '+txid+'/input/'+inputid});
      return;
    }
    var tx = ret.result;
    tx.confirmations = tx.confirmations || 0;
    tx.isCoinbase = (typeof (tx["vin"][0]["coinbase"]) != 'undefined');
    var input = tx.vin[inputid];
    input.n = inputid;
    res.render('input', {tx: tx, input: input});
  });
};
