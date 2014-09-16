var express = require('express');
var stylus = require('stylus');

var app = express();

GLOBAL.config = require('./config.json');
GLOBAL.database = require('./database');
GLOBAL.bitcore = require('bitcore');
GLOBAL.Address = bitcore.Address;
GLOBAL.RpcClient = bitcore.RpcClient;
GLOBAL.rpc = new RpcClient(config.rpc);
GLOBAL.crypto = require('crypto');

app.set('views', __dirname + '/views');

app.set('view engine', 'jade');

require('./routes')(app, database);

app.use(stylus.middleware({
  src: __dirname + '/public',
  compile: function(str, path){
    return stylus(str).set('filename', path);
  }
}));

app.use(require('morgan')('dev'));

app.use(express.static(__dirname + '/public'));

app.listen(config.port);