const {
  task,
  series,
  src,
  dest,
  watch
} = require("gulp");

const pug = require('gulp-pug');
const browserSync = require('browser-sync').create();
const data = require('gulp-data');
const sass = require('gulp-sass');

sass.compiler = require('node-sass');

task('sass', function () {
  return src('src/styles/styles.sass')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('src/styles'));
});

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

  watch(['src/styles/**/*.sass'], series('sass'));
  watch([
    'src/styles/styles.css',
    'src/**/*.pug',
    'src/**/*.js',
    'data/**/*.json'
  ], series('pug'));
  watch('dist/*.html').on('change', browserSync.reload);
});

task('default', series('sass', 'pug', 'serve'));
