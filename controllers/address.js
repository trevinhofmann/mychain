'use strict';

var bitcore = require('bitcore');
var Address = bitcore.Address;

exports.render = function (req, res) {
  var addr = req.params.address;
  if (!(new Address(addr)).isValid()){
    res.render('index', {error: 'Address was invalid: '+addr});
    return;
  }
  var address = {
    address: addr,
    confirmedReceived: 0,
    unonfirmedReceived: 0,
    confirmedPossiblyReceived: 0,
    unconfirmedPossiblyReceived: 0,
    transactions: []
  };
  res.render('address', {address: address});
};