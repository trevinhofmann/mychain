'use strict';

module.exports = function(app){

  var index = require('./controllers/index');
  var search = require('./controllers/search');
  var address = require('./controllers/address');
  var tx = require('./controllers/tx');
  var block = require('./controllers/block');

  app.get('/', index.render);
  app.get('/search', search.render);
  app.get('/address/:address', address.render);
  app.get('/tx/:txid', tx.render);
  app.get('/block/:blockhash', block.render);
  
};