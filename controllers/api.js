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
  if (command == 'block'){
    if (typeof params.hash == 'undefined'){
      response.status = 'error';
      response.message = 'Required parameter \'hash\' is missing.';
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
  else{
    response.status = 'error';
    response.message = 'Command \''+command+'\'was not recognized.'
    return res.json(response);
  }
}