/**
 *  Index js file
 *  Inits Express and launches server
 */

// requirements
const express = require('express');
const nunjucks = require('nunjucks');
const morgan = require('morgan');

// settings
const ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || (ENV === 'development' ? 3000 : 8080);

// init express
var app = express();
// establish nunjucks as the rendering engine
var njEnv = nunjucks.configure(['app/views'], {
  express: app,
  autoescape: false
});
// add useful dump function
njEnv.addGlobal('dump', function (data) {
  if (ENV === 'development') {
    if (typeof data == 'object') {
      return "<pre>" + JSON.stringify(data, null, '  ') + '</pre>';
    }
    else {
      return "<pre>" + data + " (" + (typeof data) + ")";
    }
  }
});

//////////////
// Express Middleware
//////////////
// logging
app.use(morgan(ENV === 'development' ? 'dev' : 'combined'));
// static assets
app.use(express.static('./public/', {
  index: false // don't send directory index
}));
// basic routes
app.use(require('./app/controllers/index'));

//////////////
// Start Express App
//////////////
var server = app.listen(PORT, function () {
  console.log('Express listening on port ' + PORT);
});
