(function() {
  'use strict';

  var gulp = require('gulp'),
      uglify = require('gulp-uglifyjs'),
      jsFiles = 'src/*.js';

  gulp.task('uglify', function() {
    gulp
      .src(jsFiles)
      .pipe(uglify('plumes.min.js', {
        outSourceMap: true
      }))
      .pipe(gulp.dest('./'));
  });

  gulp.task('watch', function() {
    gulp.watch(jsFiles, ['uglify']);
  });

  gulp.task('build', ['uglify']);

  // The default task (called when you run `gulp` from cli)
  gulp.task('default', ['watch']);

})();
