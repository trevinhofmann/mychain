'use strict';

var mysql = require('mysql');

// Connection to the SQL database
var connection;

// Table structure of the SQL database.
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

// Current height to which the SQL database is synchronized.
var heightChecked = -1;

// Current height to which the RPC bitcoin daemon is synchronized
var chainHeight = 0;

// This opens the connection to the SQL database and creates the database/table structure if it's
// not already present.
// TODO: Try to simplify this. Use helper functions? Use returns instead of deep nesting?
function connectToDatabase(){
  connection = mysql.createConnection(config.mysql);
  connection.connect(function(err){
    console.log(err ? 'Failed to connect to MySQL database.' : 'Connected to MySQL database.');
    if (!err){
      connection.query('CREATE DATABASE IF NOT EXISTS mychain', function (err, result){
        connection.query('USE mychain', function (err, result){
          for (var table in tables){
            connection.query('CREATE TABLE IF NOT EXISTS '+table+' ('+tables[table].join(',')+')');
          }
          setTimeout(update, 2000);
        });
      });
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

// This accepts an array of transaction id's, gets their raw transaction data from the RPC, and
// stores it in the outputs table of the SQL database.
// TODO: This is ugly and has way too much nesting. Use helper functions and returns instead.
function addTransactions(txs){
  if (txs.length > 0){
    rpc.getRawTransaction(txs[0], 1, function(err, ret){
      if (err){
        return setTimeout(addTransactions, 1000, txs);
      }
      var tx = ret.result;
      var outputsInserted = 0;
      for (var output in tx.vout){
        var scriptPubKeyHash = crypto.createHash('sha256').update(tx.vout[output].scriptPubKey.hex).digest('hex');
        var query = 'INSERT INTO outputs (scriptPubKey_hash, txid, vout) VALUES (X\''+scriptPubKeyHash+'\', X\''+tx.txid+'\', '+output+')';
        connection.query(query, function(err, result){
          if (err){
            console.log('Database error: Failed to insert an output.');
          }
          outputsInserted ++;
          if (outputsInserted == tx.vout.length){
            if (typeof (tx.vin[0]["coinbase"]) == 'undefined'){
              var inputsInserted = 0;
              for (var input in tx.vin){
                var query = 'UPDATE outputs SET claims = concat_ws(\'\', claims, \','+tx.txid+'/'+input+'\') WHERE txid=X\''+tx.vin[input].txid+'\' AND vout='+tx.vin[input].vout;
                connection.query(query, function(err, result){
                  if (err){
                    console.log('Database error: Failed to add input claim to an output.');
                  }
                  inputsInserted ++;
                  if (inputsInserted == tx.vin.length){
                    txs.shift();
                    setTimeout(addTransactions, 10, txs);
                  }
                });
              }
            }
            else{
              txs.shift();
              setTimeout(addTransactions, 10, txs);
            }
          }
        });
      }
    });
  }
  else{
    var query = 'UPDATE vars SET block_height_checked='+heightChecked;
    connection.query(query, function(err, result){
      if (err){
        console.log('Database error: Failed to update block_height_checked.');
      }
      setTimeout(update, 20);
    });
  }
}

// This function is run to acquire data about the next block and insert it into the outputs
// table of the SQL database.
function update(){
  if (heightChecked > -1){
    if (heightChecked >= chainHeight){
      rpc.getBlockCount(function(err, ret){
        chainHeight = ret.result - 1;
        return setTimeout(update, 250);
      });
    }
    else{
      rpc.getBlockHash(heightChecked+1, function(err, ret){
        if (err){
          return setTimeout(update, 1000);
        }
        rpc.getBlock(ret.result, function(err, ret){
          if (err){
            return setTimeout(update, 1000);
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
        var query = 'INSERT INTO vars (block_height_checked) VALUES (0)';
        connection.query(query, function(err, result){
          heightChecked = 0;
          return setTimeout(update, 10);
        });
      }
      else if (rows.length == 1){
        heightChecked = rows[0]['block_height_checked'];
        return setTimeout(update, 10);
      }
      else{
        console.log('There is a problem with the database \'vars\' table. Multiple rows exist, and there should be only one.');
      }
    });
  }
}

// Process a SELECT query.
exports.get = function(query, callback){
  connection.query(query, function(err, rows){
    if (err){
      console.log('Database error for query: '+query);
      return;
    }
    callback(rows);
  });
}

// Begin the connection.
connectToDatabase();
