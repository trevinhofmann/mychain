'use strict';

// Render the site homepage.
exports.render = function (req, res){
  console.log('Rendering: Index, requesting IP: '+req.connection.remoteAddress);
  res.render('index', {});
};
