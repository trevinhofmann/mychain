'use strict';

// Render the About page.
exports.render = function (req, res) {
  console.log('Rendering: About, requesting IP: '+req.connection.remoteAddress);
  res.render('about');
};
