/**
 *  404 error
 */

// requirements

// defined the route
var handle404 = function (err, req, res, next) {
  if (err.status === 404)
    return render404(req, res);
  next(err);
};
var render404 = function (req, res) {
  res.status(404);
  res.render('404.html');
};

// export the router for use
module.exports = {
  handle: handle404,
  render: render404
}
