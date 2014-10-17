'use strict';

// Process a search query, redirecting to the appropriate page.
exports.render = function (req, res) {
  var q = req.query.q;
  searchAddress(q, res);
};

// If search query is an address, redirects to the address page. Otherwise, it calls the next search function.
function searchAddress(q, res){
  if ((new Address(q)).isValid()){
    res.redirect('/address/'+q);
    return;
  }
  searchTransaction(q, res);
}

// If search query is a txid, redirects to the transaction page. Otherwise, it calls the next search function.
function searchTransaction(q, res){
  rpc.getRawTransaction(q, 1, function(err, ret){
    if (!err){
      res.redirect('/tx/'+q);
      return;
    }
    searchBlock(q, res);
  });
}

// If search query is a block hash, redirects to the block page. Otherwise, it calls the next search function.
function searchBlock(q, res){
  rpc.getBlock(q, function(err, ret){
    if (!err){
      res.redirect('/block/'+q);
      return;
    }
    searchInput(q, res);
  });
}

// If search query is an input, redirects to the input page. Otherwise, it calls the next search function.
function searchInput(q, res){
  if (isInputFormat(q)){
    rpc.getRawTransaction(q.split('/input/')[0], 1, function(err, ret){
      if (!err){
        res.redirect('/tx/'+q);
        return;
      }
      res.render('index', {error: 'Input not found: '+q});
    });
    return;
  }
  searchOutput(q, res);
}

// If search query is an output, redirects to the output page. Otherwise, it calls the next search function.
function searchOutput(q, res){
  if (isOutputFormat(q)){
    rpc.getRawTransaction(q.split('/output/')[0], 1, function(err, ret){
      if (!err){
        res.redirect('/tx/'+q);
        return;
      }
      res.render('index', {error: 'Output not found: '+q});
    });
    return;
  }
  searchEight(q, res);
}

// If search query is 8, let them play the 8 game. Otherwise, it renders an error for no search results.
function searchEight(q, res){
  if (q == '8'){
    res.render('eight');
    return;
  }
  res.render('index', {error: 'Search returned no results: '+q});
}

// Returns true if search format is an input.
function isInputFormat(q){
  return (q.indexOf('/input/') > -1 && q.split('/input/').length == 2 && !isNaN(q.split('/input/')[1]));
}

// Returns true if search format is an output.
function isOutputFormat(q){
  return q.indexOf('/output/') > -1 && q.split('/output/').length == 2 && !isNaN(q.split('/output/')[1]);
}