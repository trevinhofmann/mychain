'use strict';

// This handles routing for the website, pointing requests to
// the appropriate view renderer.
module.exports = function(app){

  var index = require('./controllers/index');
  var search = require('./controllers/search');
  var address = require('./controllers/address');
  var tx = require('./controllers/tx');
  var block = require('./controllers/block');
  var output = require('./controllers/output');
  var input = require('./controllers/input');
  var api = require('./controllers/api');
  var about = require('./controllers/about');
  var donate = require('./controllers/donate');

  app.get('/', index.render);
  app.get('/search', search.render);
  app.get('/address/:address', address.render);
  app.get('/tx/:txid', tx.render);
  app.get('/block/:blockhash', block.render);
  app.get('/tx/:txid/output/:outputid', output.render);
  app.get('/tx/:txid/input/:inputid', input.render);
  app.get('/api', api.render);
  app.get('/api/:command', api.render);
  app.get('/about', about.render);
  app.get('/donate', donate.render);
  
};
