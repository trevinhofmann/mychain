'use strict';

var config = require('../config.json');

var bitcore = require('bitcore');
var RpcClient = bitcore.RpcClient;
var rpc = new RpcClient(config.rpc);

exports.render = function (req, res) {
  var txid = req.params.txid;
  var inputid = req.params.inputid;
  rpc.getRawTransaction(txid, 1, function(err, ret){
    if (err){
      res.render('index', {error: 'Input was invalid: '+txid+'/input/'+inputid});
      return;
    }
    var tx = ret.result;
    tx.confirmations = tx.confirmations || 0;
    var input = tx.vin[inputid];
    input.n = inputid;
    res.render('input', {tx: tx, input: input});
  });
};