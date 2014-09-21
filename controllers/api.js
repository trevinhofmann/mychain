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
// TODO: Break this up with a different function for each call.
function renderResult(req, res){
  var command = req.params.command;
  var params = req.query;
  var response = {};
  if (command == 'blockhash'){
    if (typeof params.hash == 'undefined'){
      response.status = 'error';
      response.message = 'Required parameter \'blockhash\' is missing.';
      return res.json(response);
    }
    rpc.getBlock(params.hash, function(err, ret){
      if (err){
        response.status = 'error';
        response.message = 'Block was not found.';
        return res.json(response);
      }
      var block = ret.result;
      response.status = 'ok';
      response.data = block;
      return res.json(response);
    });
  }
  else if (command == 'tx'){
    if (typeof params.txid == 'undefined'){
      response.status = 'error';
      response.message = 'Required parameter \'txid\' is missing.';
      return res.json(response);
    }
    rpc.getRawTransaction(params.txid, 1, function(err, ret){
      if (err){
        response.status = 'error';
        response.message = 'Transaction was not found.';
        return res.json(response);
      }
      var tx = ret.result;
      response.status = 'ok';
      response.data = tx;
      return res.json(response);
    });
  }
  else if (command == 'address'){
    if (typeof params.address == 'undefined'){
      response.status = 'error';
      response.message = 'Required parameter \'address\' is missing.';
      return res.json(response);
    }
    var addr = params.address;
    if (!(new Address(addr)).isValid()){
      response.status = 'error';
      response.message = 'Address was invalid.';
      return res.json(response);
    }
    var scriptPubKey = (new Address(addr)).getScriptPubKey()['buffer'].toString('hex');
    var scriptPubKey_hash = crypto.createHash('sha256').update(scriptPubKey).digest('hex');
    database.get('SELECT HEX(txid) as txid, vout FROM outputs WHERE scriptPubKey_hash=X\''+scriptPubKey_hash+'\'', function(rows){
      var outputs = rows;
      getTransactions(outputs, {}, function(txs){
        var confirmedReceived = 0;
        var unconfirmedReceived = 0;
        var confirmedPossiblyReceived = 0;
        var unconfirmedPossiblyReceived = 0;
        for (var tx in txs){
          tx = txs[tx];
          if (tx.confirmations > config.minConfirmations){
            if (tx.amount > Math.max(confirmedReceived, unconfirmedReceived)){
              confirmedReceived = tx.amount;
              unconfirmedReceived = 0;
            }
            else{
              confirmedPossiblyReceived += tx.amount;
            }
          }
          else{
            if (confirmedReceived > 0){
              unconfirmedPossiblyReceived += tx.amount;
            }
            else if (unconfirmedReceived > 0 && tx.amount > unconfirmedReceived){
              unconfirmedPossiblyReceived = unconfirmedReceived;
              unconfirmedReceived = tx.amount;
            }
            else{
              unconfirmedReceived = tx.amount;
            }
          }
        }
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
        var address = {
          address: addr,
          confirmedReceived: confirmedReceived,
          unconfirmedReceived: unconfirmedReceived,
          confirmedPossiblyReceived: confirmedPossiblyReceived,
          unconfirmedPossiblyReceived: unconfirmedPossiblyReceived,
          transactions: txs
        };
        response.status = 'ok';
        response.data = address;
        return res.json(response);
      });
    });
  }
  else{
    response.status = 'error';
    response.message = 'Command \''+command+'\' was not recognized.'
    return res.json(response);
  }
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
