/**
 *  Index request
 */

// requirements
const express = require('express');
const router = express.Router();

// defined the route
router.get('/', function (req, res) {
  res.render('index.html');
});

// export the router for use
module.exports = router;
