/**
 *  Add some variables to expose them to templates
 */

function addTemplateData (req, res, next) {
  res.locals.env = process.env.NODE_ENV || 'development';

  next();
}

module.exports = addTemplateData;
