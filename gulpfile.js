const pug = require('gulp-pug');
const browserSync = require('browser-sync').create();
const data = require('gulp-data');
const {
  task,
  series,
  src,
  dest,
  watch
} = require("gulp");

task('pug', function (cb) {
  src('src/*.pug')
    .pipe(data(function (file) { return { require: require }; }))
    .pipe(pug())
    .pipe(dest('dist'))
    .pipe(browserSync.stream());
  cb();
});

task('serve', function() {
  browserSync.init({
    server: "./dist"
  });

  watch(['src/**/*.pug', 'src/**/*.js', 'data/**/*.json'], series('pug'));
  watch('dist/*.html').on('change', browserSync.reload);
});

task('default', series('pug', 'serve'));
