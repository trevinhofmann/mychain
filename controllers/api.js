'use strict';

var config = require('../config.json');

var bitcore = require('bitcore');
var RpcClient = bitcore.RpcClient;
var rpc = new RpcClient(config.rpc);

exports.render = function (req, res) {
  (typeof req.params.command == 'undefined') ? renderIndex(req, res) : renderResult(req, res);
}

function renderIndex(req, res){

}

function renderResult(req, res){
  var command = req.params.command;
  var params = req.query;
  var response = {};
  if (command == 'blockhash'){
    if (typeof params.hash == 'undefined'){
      response.status = 'error';
      response.message = 'Required parameter \'blockhash\' is missing.';
    }
    else{
      rpc.getBlock(params.hash, function(err, ret){
        if (err){
          response.status = 'error';
          response.message = 'Block was not found.';
          res.json(response);
          return;
        }
        var block = ret.result;
        response.status = 'ok';
        response.data = block;
        res.json(response);
      });
    }
  }
  else if (command == 'tx'){
    if (typeof params.txid == 'undefined'){
      response.status = 'error';
      response.message = 'Required parameter \'txid\' is missing.';
    }
    else{
      rpc.getRawTransaction(params.txid, 1, function(err, ret){
        if (err){
          response.status = 'error';
          response.message = 'Transaction was not found.';
          res.json(response);
          return;
        }
        var tx = ret.result;
        response.status = 'ok';
        response.data = tx;
        res.json(response);
      });
    }
  }
  else{
    response.status = 'error';
    response.message = 'Command \''+command+'\'was not recognized.'
    return res.json(response);
  }
}