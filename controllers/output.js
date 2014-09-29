'use strict';

// Render information for a given output.
exports.render = function (req, res) {
  console.log('Rendering: Output, requesting IP: '+req.connection.remoteAddress);
  var txid = req.params.txid;
  var outputid = req.params.outputid;
  rpc.getRawTransaction(txid, 1, function(err, ret){
    if (err || outputid < 0 || outputid >= ret.result.vout.length){
      res.render('index', {error: 'Output was invalid: '+txid+'/output/'+outputid});
      return;
    }
    var tx = ret.result;
    tx.confirmations = tx.confirmations || 0;
    var output = tx.vout[outputid];
    TransactionTools.getRelatedOutputs(tx, outputid, function(relatedOutputs){
      TransactionTools.getRedeemInputs(tx, outputid, function(redeemInputs){
        res.render('output', {tx: tx, output: output, relatedOutputs: relatedOutputs, redeemInputs: redeemInputs});
      });
    });
  });
};
