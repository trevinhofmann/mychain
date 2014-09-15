'use strict';

exports.render = function (req, res) {
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
    var relatedOutputs = [];
    res.render('output', {tx: tx, output: output, relatedOutputs: relatedOutputs});
  });
};