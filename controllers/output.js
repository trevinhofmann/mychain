'use strict';

var config = require('../config.json');

var bitcore = require('bitcore');
var RpcClient = bitcore.RpcClient;
var rpc = new RpcClient(config.rpc);

exports.render = function (req, res) {
  var txid = req.params.txid;
  var outputid = req.params.outputid;
  rpc.getRawTransaction(txid, 1, function(err, ret){
    if (err){
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