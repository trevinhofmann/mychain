'use strict';

// If a command is defined, render API data accordingly. If a command is not defined, display
// the API index.
exports.render = function (req, res) {
  (typeof req.params.command == 'undefined') ? renderIndex(req, res) : renderResult(req, res);
}

// Render an overview of the API. List available API calls, arguments, and how to use it.
// TODO: All of it
function renderIndex(req, res){

}

// Render the data result for a given API call.
function renderResult(req, res){
  var command = req.params.command;
  var params = req.query;
  if (command == 'blockhash'){
    renderBlock(req, res)
  } else if (command == 'tx'){
    renderTransaction(req, res);
  } else if (command == 'address'){
    renderAddress(req, res);
  } else if (command == 'pushtx'){
    pushTransaction(req, res);
  } else{
    renderError(req, res, 'Command \''+command+'\' was not recognized.');
  }
}

// Render the API result for a block.
function renderBlock(req, res){
  var params = req.query;
  if (typeof params.blockhash == 'undefined'){
    renderError(req, res, 'Required parameter \'blockhash\' is missing.');
    return;
  }
  rpc.getBlock(params.hash, function(err, ret){
    if (err){
      renderError(req, res, 'Block was not found.');
      return;
    }
    var block = ret.result;
    var response = {};
    response.status = 'ok';
    response.data = block;
    return res.json(response);
  });
}

// Render the API result for a transaction.
function renderTransaction(req, res){
  var params = req.query;
  if (typeof params.txid == 'undefined'){
    renderError(req, res, 'Required parameter \'txid\' is missing.');
    return;
  }
  rpc.getRawTransaction(params.txid, 1, function(err, ret){
    if (err){
      renderError(req, res, 'Transaction was not found.');
      return;
    }
    var tx = ret.result;
    var response = {};
    response.status = 'ok';
    response.data = tx;
    return res.json(response);
  });
}

// Render the API result for an address.
function renderAddress(req, res){
  var params = req.query;
  var addr = params.address;
  if (typeof params.address == 'undefined'){
    renderError(req, res, 'Required parameter \'address\' is missing.');
    return;
  }
  if (!(new Address(addr)).isValid()){
    renderError(req, res, 'Address was invalid.');
    return;
  }
  AddressTools.getAddressData(addr, function(address){
    var response = {};
    response.status = 'ok';
    response.data = address;
    return res.json(response);
  });
}

// Push a raw transaction to the network
function pushTransaction(req, res){
  var params = req.query;
  var tx = params.rawtx;
  if (typeof params.rawtx == 'undefined'){
    renderError(req, res, 'Required parameter \'rawtx\' is missing.');
    return;
  }
  rpc.sendRawTransaction(tx, function(err, ret){
    var response = {};
    response.status = 'ok';
    return res.json(response);
  });
}

// Render an API error message.
function renderError(req, res, message){
  var response = {};
  response.status = 'error';
  response.message = message;
  return res.json(response);
}
