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
