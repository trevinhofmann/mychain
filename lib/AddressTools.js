'use strict';

// Get data for an address.
exports.getAddressData = function(addr, callback){
  var scriptPubKey = (new Address(addr)).getScriptPubKey()['buffer'].toString('hex');
  var scriptPubKey_hash = crypto.createHash('sha256').update(scriptPubKey).digest('hex');
  database.get('SELECT HEX(txid) as txid, vout FROM outputs WHERE scriptPubKey_hash=X\''+scriptPubKey_hash+'\'', function(rows){
    var outputs = rows;
    exports.getTransactions(outputs, {}, function(txs){
      var received = exports.calculateReceived(txs);
      txs = exports.removeExtraTransactionData(txs);
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

// Returns detailed information about the transactions containing given outputs.
exports.getTransactions = function(outputs, txs, callback){
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
      exports.getTransactions(outputs, txs, callback);
    });
  }
  else{
    callback(txs);
  }
}

// Remove transaction data that is not relevant to an address transaction receipt.
exports.removeExtraTransactionData = function(txs){
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
exports.calculateReceived = function(txs){
  var received = {
    'confirmed': 0,
    'unconfirmed': 0,
    'confirmedPossibly': 0,
    'unconfirmedPossibly': 0
  };
  for (var tx in txs){
    tx = txs[tx];
    if (tx.confirmations >= config.minConfirmations){
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