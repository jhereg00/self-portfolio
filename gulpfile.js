/**
 *  All gulp tasks are stored in separate files/folders and just included here for neatness
 */
var gulp = require('gulp');
gulp.task('sass',require('./gulp-tasks/sass'));
gulp.task('scripts',require('./gulp-tasks/scripts'));
//gulp.task('kss',['sass','scripts'],require('./gulp-tasks/kss'));
gulp.task('watch',function () {
  gulp.watch('dev/scss/**/*',['sass']);
  gulp.watch('dev/js/**/*',['scripts']);
});
