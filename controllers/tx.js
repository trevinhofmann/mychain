'use strict';

var config = require('../config.json');

var bitcore = require('bitcore');
var RpcClient = bitcore.RpcClient;
var rpc = new RpcClient(config.rpc);

exports.render = function (req, res) {
  var txid = req.params.txid;
  rpc.getRawTransaction(txid, 1, function(err, ret){
    if (err){
      res.render('index', {error: 'Transaction was invalid: '+txid});
      return;
    }
    var tx = ret.result;
    tx.confirmations = tx.confirmations || 0;
    tx.isCoinbase = (typeof (tx["vin"][0]["coinbase"]) != 'undefined');
    res.render('tx', {tx: tx});
  });
};