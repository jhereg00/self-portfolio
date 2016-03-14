var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cmq = require('gulp-combine-media-queries'),
    sourcemaps = require('gulp-sourcemaps'),
    cssmin = require('gulp-cssmin'),
    rename = require('gulp-rename'),
    replace = require('gulp-replace')
    ;

module.exports = function sassTask () {
  return gulp.src('dev/scss/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      indentType : 'tab',
      indentWidth : 1
    }).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 2 versions']
    }))
    // not using cmq anymore since it doesn't handle @supports()
    // also, cssmin combines them anyway, and the minified css is
    // what we'll be using on production, anyway
    //.pipe(cmq())
    //.pipe(replace(/\/deep\//g,'>>>'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('public/css/'))
    .pipe(rename({
      extname: '.min.css'
    }))
    .pipe(cssmin())
    .pipe(gulp.dest('public/css/'));
}
