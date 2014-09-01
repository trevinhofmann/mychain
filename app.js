var express = require('express');
var stylus = require('stylus');
var mysql = require('mysql');

var app = express();

var config = require('./config.json');

var bitcore = require('bitcore');
var Address = bitcore.Address;
var RpcClient = bitcore.RpcClient;
var rpc = new RpcClient(config.rpc);

var mysqlConnection;

function connectToDatabase(){
  mysqlConnection = mysql.createConnection(config.mysql);
  mysqlConnection.connect(function(err){
    err ? console.log("Failed to connect to MySQL database.") : console.log("Connected to MySQL database.");
  });
  mysqlConnection.on('error', function(err){
    if (err.code === 'PROTOCOL_CONNECTION_LOST'){
      connectToDatabase();
    }
    else{
      throw err;
    }
  });
}

//connectToDatabase(); // database not yet used

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