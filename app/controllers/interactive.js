/**
 *  Interactive Work request
 */

// requirements
const express = require('express');
const router = express.Router();
const marked = require('marked');
const yamlFront = require('yaml-front-matter');
const fs = require('fs');

// defined the route
router.param('pieceName', function (req, res, next, value) {
  // get the content
  fs.readFile('data/interactive/' + value + '.md', function (err, data) {
    if (err) {
      if (err.code === 'ENOENT')
        res.sendStatus(404);
      else
        res.sendStatus(500);
    }
    else {
      var content = {};

      // parse the YAML front matter from the markdown
      var parsed = yamlFront.loadFront(data);
      content.attributes = parsed;

      // markdown on the content
      content.content = marked(parsed['__content']);

      // special attributes
      try {
        content.attributes.slug = content.attributes.title.toLowerCase().replace(/\s/g,'-');
        var d = new Date(content.attributes.date);
        content.attributes.dateString = months[d.getMonth()] + ', ' + d.getFullYear();
      } catch (e) {
        console.error(e);
      }

      // don't double save the content, it could get big when the whole list is returned
      if (content.attributes['__content'])
        delete content.attributes['__content'];

      for (var prop in content) {
        res.locals[prop] = content[prop];
      }
      next();
    }
  });
});

router.get('/interactive/:pieceName', function (req, res) {
  // get the content
  console.log('get call');
  res.render('_templates/article.html');
});

// export the router for use
module.exports = router;
