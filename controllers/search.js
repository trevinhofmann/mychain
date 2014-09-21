'use strict';

// Process a search query, redirecting to the appropriate page.
// TODO: Break up this massive function with some help. Try using returns instead of deep nesting.
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
            if (q.indexOf('/input/') > -1 && q.split('/input/').length == 2 && !isNaN(q.split('/input/')[1])){
              rpc.getRawTransaction(q.split('/input/')[0], 1, function(err, ret){
                if (!err){
                  res.redirect('/tx/'+q);
                }
                else{
                  res.render('index', {error: 'Search returned no results: '+q});
                }
              });
            }
            else if (q.indexOf('/output/') > -1 && q.split('/output/').length == 2 && !isNaN(q.split('/output/')[1])){
              rpc.getRawTransaction(q.split('/output/')[0], 1, function(err, ret){
                if (!err){
                  res.redirect('/tx/'+q);
                }
                else{
                  res.render('index', {error: 'Search returned no results: '+q});
                }
              });
            }
            else{
              res.render('index', {error: 'Search returned no results: '+q});
            }
          }
        });
      }
    });
  }
};
