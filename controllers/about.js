'use strict';

// Render the About page.
exports.render = function (req, res) {
  console.log('Rendering: About');
  res.render('about');
};
