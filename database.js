'use strict';

var mysql = require('mysql');

var connection;

var tables = {
  'vars': [
    'block_height_checked INT NOT NULL'
  ],
  'outputs': [
    'scriptPubKey_hash BINARY(32) NOT NULL',
    'txid BINARY(32) NOT NULL',
    'vout INT NOT NULL',
    'claims TEXT DEFAULT \'\'',
    'INDEX `scriptPubKey_hash` (`scriptPubKey_hash`)',
    'UNIQUE KEY `output` (`txid`, `vout`)'
  ]
};

var heightChecked = -1;
var chainHeight = 0;

function connectToDatabase(){
  connection = mysql.createConnection(config.mysql);
  connection.connect(function(err){
    console.log(err ? 'Failed to connect to MySQL database.' : 'Connected to MySQL database.');
    if (!err){
      connection.query('CREATE DATABASE IF NOT EXISTS mychain');
      connection.changeUser({database: 'mychain'});
      for (var table in tables){
        connection.query('CREATE TABLE IF NOT EXISTS '+table+' ('+tables[table].join(',')+')');
      }
      update();
    }
  });
  connection.on('error', function(err){
    if (err.code === 'PROTOCOL_CONNECTION_LOST'){
      console.log("Database error. Reconnecting.");
      connectToDatabase();
    }
    else{
      throw err;
    }
  });
}

function addTransactions(txs){
  rpc.getRawTransaction(txs[0], 1, function(err, ret){
    if (err){
      setTimeout(addTransactions, 1000, txs);
      return;
    }
    var tx = ret.result;
    for (var output in tx.vout){
      var scriptPubKeyHash = crypto.createHash('sha256').update(tx.vout[output].scriptPubKey.hex).digest('hex');
      connection.query('INSERT INTO outputs (scriptPubKey_hash, txid, vout) VALUES (X\''+scriptPubKeyHash+'\', X\''+tx.txid+'\', '+output+')', function(err, result){
        if (err){
          console.log('Database error for command: '+'INSERT INTO outputs (scriptPubKey_hash, txid, vout) VALUES (X\''+scriptPubKeyHash+'\', X\''+tx.txid+'\', '+output+')');
        }
      });
    }
    if (typeof (tx["vin"][0]["coinbase"]) == 'undefined'){
      for (var input in tx.vin){
        connection.query('UPDATE outputs SET claims = concat_ws(\'\', claims, \','+tx.txid+'/'+input+'\') WHERE txid=X\''+tx.vin[input].txid+'\' AND vout='+tx.vin[input].vout, function(err, result){
          if (err){
            console.log('Database error for command: '+'UPDATE outputs SET claims = concat_ws(\'\', claims, \','+tx.txid+'/'+input+'\') WHERE txid=X\''+tx.vin[input].txid+'\' AND vout='+tx.vin[input].vout);
          }
        });
      }
    }
    txs.shift();
    if (txs.length > 0){
      addTransactions(txs);
    }
    else{
      connection.query('UPDATE vars SET block_height_checked='+heightChecked);
      update();
    }
  });
}

function update(){
  if (heightChecked > -1){
    if (heightChecked >= chainHeight){
      rpc.getBlockCount(function(err, ret){
        chainHeight = ret.result - 1;
        setTimeout(update, 250);
      });
    }
    else{
      rpc.getBlockHash(heightChecked+1, function(err, ret){
        if (err){
          setTimeout(update, 1000);
          return;
        }
        rpc.getBlock(ret.result, function(err, ret){
          if (err){
            setTimeout(update, 1000);
            return;
          }
          heightChecked ++;
          console.log('Adding transactions from block height '+heightChecked);
          addTransactions(ret.result.tx);
        });
      });
    }
  }
  else{
    connection.query('SELECT block_height_checked FROM vars', function(err, rows){
      if (err) throw err;
      if (rows.length == 0){
        connection.query('INSERT INTO vars (block_height_checked) VALUES (0)');
        heightChecked = 0;
        setTimeout(update, 10);
      }
      else if (rows.length == 1){
        heightChecked = rows[0]['block_height_checked'];
        setTimeout(update, 10);
      }
      else{
        console.log('There is a problem with the database \'vars\' table. Multiple rows exist, and there should be only one.');
      }
    });
  }
}

exports.get = function(query, callback){
  connection.query(query, function(err, rows){
    if (err){
      console.log('Database error for query: '+query);
      return;
    }
    callback(rows);
  });
}

connectToDatabase();