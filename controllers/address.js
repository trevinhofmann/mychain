'use strict';

exports.render = function (req, res) {
  var addr = req.params.address;
  if (!(new Address(addr)).isValid()){
    res.render('index', {error: 'Address was invalid: '+addr});
    return;
  }
  var address = {
    address: addr,
    unspentCount: 0,
    unspentTotal: 0,
    spentCount: 0,
    spentTotal: 0,
    unspentUnconfirmedCount: 0,
    unspentUnconfirmedTotal: 0,
    spentUnconfirmedCount: 0,
    spentUnconfirmedTotal: 0,
    outputs: []
  };
  res.render('address', {address: address});
};