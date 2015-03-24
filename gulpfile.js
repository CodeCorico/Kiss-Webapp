(function() {
  'use strict';

  var gulp = require('gulp'),
      concat = require('gulp-concat'),
      uglify = require('gulp-uglifyjs'),
      plumesJsFiles = [
        'src/plumes-component.js',
        'src/plumes-list.js',
        'src/plumes-page.js',
        'src/plumes-app.js',
        'src/plumes.js'
      ],
      jsDependencies = [
        'src/vendor/events-manager/events-manager.js'
      ];

  gulp.task('build', function() {
    // without dependencies
    gulp
      .src(plumesJsFiles)
      .pipe(concat('plumes.js', {
        newLine: '\r\n'
      }))
      .pipe(gulp.dest('./'))
      .pipe(uglify('plumes.min.js', {
        outSourceMap: true
      }))
      .pipe(gulp.dest('./'));

    // with dependencies
    gulp
      .src(jsDependencies.concat(plumesJsFiles))
      .pipe(concat('plumes-full.js', {
        newLine: '\r\n'
      }))
      .pipe(gulp.dest('./'))
      .pipe(uglify('plumes-full.min.js', {
        outSourceMap: true
      }))
      .pipe(gulp.dest('./'));
  });

  gulp.task('watch', function() {
    gulp.watch(plumesJsFiles, ['build']);
  });

  // The default task (called when you run `gulp` from cli)
  gulp.task('default', ['watch']);

})();
