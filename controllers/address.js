'use strict';

exports.render = function (req, res) {
  var addr = req.params.address;
  if (!(new Address(addr)).isValid()){
    res.render('index', {error: 'Address was invalid: '+addr});
    return;
  }
  var scriptPubKey = (new Address(addr)).getScriptPubKey()['buffer'].toString('hex');
  var scriptPubKey_hash = crypto.createHash('sha256').update(scriptPubKey).digest('hex');
  database.get('SELECT HEX(txid) as txid, vout FROM outputs WHERE scriptPubKey_hash=X\''+scriptPubKey_hash+'\'', function(rows){
    var outputs = rows;
    getTransactions(outputs, function(txs){
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
      var address = {
        address: addr,
        transactions: txs,
        confirmedReceived: confirmedReceived,
        unconfirmedReceived: unconfirmedReceived,
        confirmedPossiblyReceived: confirmedPossiblyReceived,
        unconfirmedPossiblyReceived: unconfirmedPossiblyReceived
      };
      res.render('address', {address: address});
    });
  });
};

function getTransactions(outputs, callback){
  var fetched = 0;
  var txs = {};
  for (var output in outputs){
    rpc.getRawTransaction(outputs[output].txid, 1, function(err, ret){
      var tx = ret.result;
      var txid = outputs[output].txid;
      if (typeof txs[txid] == 'undefined'){
        tx.confirmations = tx.confirmations || 0;
        tx.isCoinbase = (typeof (tx["vin"][0]["coinbase"]) != 'undefined');
        tx.amount = 0;
        txs[txid] = tx;
      }
      txs[txid].amount += tx.vout[outputs[output].vout].value;
      fetched ++;
      if (fetched == outputs.length){
        callback(txs);
      }
    });
  }
}