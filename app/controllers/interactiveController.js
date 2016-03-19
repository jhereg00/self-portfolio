/**
 *  Interactive Work request
 */

// requirements
const express = require('express');
const router = express.Router();
const marked = require('marked');
const yamlFront = require('yaml-front-matter');
const fs = require('fs');
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const Interactive = require('../models/interactive');

// defined the route
router.param('interactiveSlug', function (req, res, next, value) {
  // get the content
  var entry = Interactive.getBy('slug',value);
  if (entry instanceof Array) {
    console.log('entry is Array');
    entry = entry[0];
  }

  if (entry) {
    res.locals.entry = entry.data;

    // determine what's next
    var interactives = Interactive.getList('sexiness');
    var relatedEntries = [];
    for (var i = 0; relatedEntries.length < 3 && i < interactives.length; i++) {
      if (interactives[i] !== entry)
        relatedEntries.push(interactives[i].data)
    }
    res.locals.relatedEntries = relatedEntries;
  }
  else {
    res.sendStatus(404);
  }

  next();
});

router.get('/interactive/:interactiveSlug', function (req, res) {
  // get the content
  res.render('_templates/article.html');
});

// export the router for use
module.exports = router;