'use strict';

// Get data for an address.
exports.calculateFee = function(tx, callback){
  if (tx.isCoinbase){
    callback(0);
  }
  else{
    var fee = 0;
    var inputsAdded = 0;
    for (var input in tx.vin){
      rpc.getRawTransaction(tx.vin[input]["txid"], 1, function(err, ret){
        if (typeof ret.result.vout[tx.vin[input]["vout"]] != "undefined"){
          fee += ret.result.vout[tx.vin[input]["vout"]].value;
        }
        inputsAdded ++;
        if (inputsAdded == tx.vin.length){
          for (var output in tx.vout){
            fee -= tx.vout[output]["value"];
          }
          callback(+fee.toFixed(8));
        }
      });
    }
  }
}

// Get outputs with an identical scriptPubKey
exports.getRelatedOutputs = function(tx, outputid, callback){
  var relatedOutputs = [];
  var scriptPubKey_hash = crypto.createHash('sha256').update(tx.vout[outputid].scriptPubKey.hex).digest('hex');
  database.get('SELECT HEX(txid) as txid, vout FROM outputs WHERE scriptPubKey_hash=X\''+scriptPubKey_hash+'\'', function(rows){
    var outputs = rows;
    for (var output in outputs){
      if (outputs[output].txid != tx.txid && outputs[output].vout != outputid){
        relatedOutputs.push({
          "txid": outputs[output].txid.toLowerCase(),
          "vout": outputs[output].vout
        });
      }
    }
    callback(relatedOutputs);
  });
}

// Get inputs that redeem an output
exports.getRedeemInputs = function(tx, outputid, callback){
  var redeemInputs = [];
  var scriptPubKey_hash = crypto.createHash('sha256').update(tx.vout[outputid].scriptPubKey.hex).digest('hex');
  console.log(tx.txid+' and '+outputid);
  database.get(('SELECT claims FROM outputs WHERE txid=X\''+tx.txid+'\' AND vout='+outputid), function(rows){
    if (rows.length > 0 && rows[0]['claims'] && rows[0]['claims'].length > 0){
      console.log(rows[0]['claims']);
      var claims = rows[0]['claims'].substring(1).split(',');
      for (var claim in claims){
        redeemInputs.push({
          "txid": claims[claim].split('/')[0],
          "inputid": claims[claim].split('/')[1]
        });
      }
    }
    callback(redeemInputs);
  });
}
