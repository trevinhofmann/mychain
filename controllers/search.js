'use strict';

exports.render = function (req, res) {
  var q = req.query.q;
  if ((new Address(q)).isValid()){
    res.redirect('/address/'+q);
  }
  else{
    rpc.getRawTransaction(q, 1, function(err, ret){
      if (!err){
        res.redirect('/tx/'+q);
      }
      else{
        rpc.getBlock(q, function(err, ret){
          if (!err){
            res.redirect('/block/'+q);
          }
          else{
            res.render('index', {error: 'Search returned no results: '+q});
          }
        });
      }
    });
  }
};