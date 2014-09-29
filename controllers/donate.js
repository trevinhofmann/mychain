'use strict';

// Render the Donate / Sponsor page.
exports.render = function (req, res) {
  console.log('Rendering: Donate');
  res.render('donate');
};
