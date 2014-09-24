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
  }
  else if (command == 'tx'){
    renderTransaction(req, res);
  }
  else if (command == 'address'){
    renderAddress(req, res);
  }
  else{
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
  getAddressData(addr, function(address){
    var response = {};
    response.status = 'ok';
    response.data = address;
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

// Returns detailed information about the transactions containing given outputs.
function getTransactions(outputs, txs, callback){
  var fetched = 0;
  if (outputs.length > 0){
    rpc.getRawTransaction(outputs[0].txid, 1, function(err, ret){  
      var tx = ret.result;
      var txid = outputs[0].txid;
      if (typeof txs[txid] == 'undefined'){
        tx.confirmations = tx.confirmations || 0;
        tx.isCoinbase = (typeof (tx["vin"][0]["coinbase"]) != 'undefined');
        tx.amount = 0;
        txs[txid] = tx;
      }
      txs[txid].amount += tx.vout[outputs[0].vout].value;
      outputs.shift();
      getTransactions(outputs, txs, callback);
    });
  }
  else{
    callback(txs);
  }
}

// Remove transaction data that is not relevant to an address transaction receipt.
function removeExtraTransactionData(txs){
  for (var key in txs){
    delete txs[key].vin;
    delete txs[key].vout;
    delete txs[key].scriptSig;
    delete txs[key].hex;
    delete txs[key].txid;
    delete txs[key].version;
    delete txs[key].locktime;
    delete txs[key].blocktime;
    delete txs[key].blockhash;
    delete txs[key].time;
    delete txs[key].isCoinbase;
    txs[key.toLowerCase()] = txs[key];
    delete txs[key];
  }
  return txs;
}

// Calculates the amount received by an address.
function calculateReceived(txs){
  var received = {
    'confirmed': 0,
    'unconfirmed': 0,
    'confirmedPossibly': 0,
    'unconfirmedPossibly': 0
  };
  for (var tx in txs){
    tx = txs[tx];
    if (tx.confirmations > config.minConfirmations){
      if (tx.amount > Math.max(received['confirmed'], received['unconfirmed'])){
        received['confirmed'] = tx.amount;
        received['unconfirmed'] = 0;
      }
      else{
        received['confirmedPossibly'] += tx.amount;
      }
    }
    else{
      if (received['confirmed'] > 0){
        received['unconfirmedPossibly'] += tx.amount;
      }
      else if (received['unconfirmed'] > 0 && tx.amount > received['unconfirmed']){
        received['unconfirmedPossibly'] = received['unconfirmed'];
        received['unconfirmed'] = tx.amount;
      }
      else{
        received['unconfirmed'] = tx.amount;
      }
    }
  }
  return received;
}

// Get data for an address.
function getAddressData(addr, callback){
  var scriptPubKey = (new Address(addr)).getScriptPubKey()['buffer'].toString('hex');
  var scriptPubKey_hash = crypto.createHash('sha256').update(scriptPubKey).digest('hex');
  database.get('SELECT HEX(txid) as txid, vout FROM outputs WHERE scriptPubKey_hash=X\''+scriptPubKey_hash+'\'', function(rows){
    var outputs = rows;
    getTransactions(outputs, {}, function(txs){
      var received = calculateReceived(txs);
      txs = removeExtraTransactionData(txs);
      var address = {
        address: addr,
        confirmedReceived: received['confirmed'],
        unconfirmedReceived: received['unconfirmed'],
        confirmedPossiblyReceived: received['confirmedPossibly'],
        unconfirmedPossiblyReceived: received['unconfirmedPossibly'],
        transactions: txs
      };
      callback(address);
    });
  });
}
