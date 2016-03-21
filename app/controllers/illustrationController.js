/**
 *  Illustration Work request
 */

// requirements
const express = require('express');
const router = express.Router();

const Illustration = require('../models/illustration');

router.get('/illustration', function (req, res) {
  var sort = req.param('sort') || req.cookies.sort || 'sexiness';
  res.cookie('sort', sort, {
    path: '/illustration',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 ) // 1 year
  });
  res.locals.sort = sort;
  var illustrations = Illustration.getList(sort);
  var pieces = [];
  for (var i = 0, len = illustrations.length; i < len; i++) {
    pieces.push(illustrations[i].data);
  }
  res.locals.pieces = pieces;
  res.locals.title = "Illustration";

  res.render('_templates/gallery.html');
});

// export the router for use
module.exports = router;
