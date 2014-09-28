var express = require('express');
var stylus = require('stylus');

// Instantiate web server application.
var app = express();

GLOBAL.config = require('./config.json');
GLOBAL.database = require('./database');
GLOBAL.bitcore = require('bitcore');
GLOBAL.Address = bitcore.Address;
GLOBAL.RpcClient = bitcore.RpcClient;
GLOBAL.rpc = new RpcClient(config.rpc);
GLOBAL.crypto = require('crypto');
GLOBAL.AddressTools = require('./lib/AddressTools');

// Use 'views' as the directory for HTML views.
app.set('views', __dirname + '/views');

// Use Jade as the HTML view rendering engine.
app.set('view engine', 'jade');

// Use the routes.js script to point requests to the appropriate rendering script.
require('./routes')(app, database);

// Use Stylus as the CSS middleware.
app.use(stylus.middleware({
  src: __dirname + '/public',
  compile: function(str, path){
    return stylus(str).set('filename', path);
  }
}));

// Use morgan as middleware for logging web requests; should replace this with
// something better that stores log information to a database.
app.use(require('morgan')('dev'));

// Render static files from the 'public' directory.
app.use(express.static(__dirname + '/public'));

// Express begins listening for web requests.
app.listen(config.port);
