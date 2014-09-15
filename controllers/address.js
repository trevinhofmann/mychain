'use strict';

exports.render = function (req, res) {
  var addr = req.params.address;
  if (!(new Address(addr)).isValid()){
    res.render('index', {error: 'Address was invalid: '+addr});
    return;
  }
  var scriptPubKey = (new Address(addr)).getScriptPubKey()['buffer'].toString('hex');
  var scriptPubKey_hash = crypto.createHash('sha256').update(scriptPubKey).digest('hex');
  database.get('SELECT HEX(txid) as txid, vout, claims FROM outputs WHERE scriptPubKey_hash=X\''+scriptPubKey_hash+'\'', function(rows){
    var address = {
      address: addr,
      transactions: rows,
      confirmedReceived: 0,
      unonfirmedReceived: 0,
      confirmedPossiblyReceived: 0,
      unconfirmedPossiblyReceived: 0
    };
    res.render('address', {address: address});
  });
};