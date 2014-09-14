var express = require('express');
var stylus = require('stylus');

var app = express();

var config = require('./config.json');
var database = require('./database');


app.set('views', __dirname + '/views');

app.set('view engine', 'jade');

require('./routes')(app);

app.use(stylus.middleware({
  src: __dirname + '/public',
  compile: function(str, path){
    return stylus(str).set('filename', path);
  }
}));

app.use(express.static(__dirname + '/public'));

app.listen(config.port);