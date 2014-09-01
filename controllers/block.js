'use strict';

var config = require('../config.json');

var bitcore = require('bitcore');
var RpcClient = bitcore.RpcClient;
var rpc = new RpcClient(config.rpc);

exports.render = function (req, res) {
  var blockhash = req.params.blockhash;
  rpc.getBlock(blockhash, function(err, ret){
    if (err){
      res.render('index', {error: 'Block was invalid: '+blockhash});
      return;
    }
    var block = ret.result;
    res.render('block', {block: block});
  });
};