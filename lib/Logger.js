'use strict';

exports.log = function(req, res, next){
  /*var ip = req.connection.remoteAddress;
  var userAgent = req.headers['user-agent'];
  var query = req.query;
  console.log(JSON.stringify(req.headers));*/
  console.log('HTTP request received');
  next();
}
