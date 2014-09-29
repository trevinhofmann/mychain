'use strict';

// Render the site homepage.
exports.render = function (req, res){
  console.log('Rendering: Index');
  res.render('index', {});
};
