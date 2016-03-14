var gulp = require('gulp'),
    browserify = require('browserify'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    rename = require('gulp-rename'),
    replace = require('gulp-replace'),
    gutil = require('gulp-util'),
    stripDebug = require('gulp-strip-debug'),
    fs = require('fs')
    ;

function browserifyScript (fileName) {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: './'+fileName,
    debug: true,
    basedir: './dev/js-src/',
    paths: ['./node_modules','./']
  });

  return b.bundle()
    .on('error', function (err) {
      console.log(err.toString());
      this.emit("end");
    })
    .pipe(source(fileName))
    .pipe(buffer())
    .pipe(gulp.dest('./public/js/'))
    .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        .pipe(rename({
          extname: '.min.js'
        }))
        .pipe(stripDebug())
        .pipe(uglify())
        .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js/'));
}

module.exports = function (cb) {
  var doneCount = 0;
  var fileCount;
  function checkDone () {
    doneCount++;
    if (doneCount === fileCount && cb) {
      cb();
    }
  }

  fs.readdir('./dev/js-src/',function (err, data) {
    if (err)
      return cb();

    fileCount = data.length;
    for (var f in data) {
      var fileName = data[f];
      if (/^[^_].*\.js$/.test(fileName)) {
        // is a js file that doesn't start with '_'
        // assume it's an entry
        var stream = browserifyScript(fileName)
          .on('end',checkDone);
      }
      else {
        // not a valid name, perhaps a directory
        // don't do anything with this
        checkDone();
      }
    }
  });
}
