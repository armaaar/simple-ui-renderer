const fs = require('fs');
const rimraf = require("rimraf");

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
const concat = require('gulp-concat');

sass.compiler = require('node-sass');

function swallowError (error) {
  console.log(error.toString())
  this.emit('end')
}

task('sass', function () {
  return src(['src/styles/styles.sass', 'src/components/**/*.sass'], { base: 'src/styles' })
    .pipe(concat('styles.sass'))
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('tmp'));
});

task('pug:components', function (cb) {
  // create components file
  const componentsContent = fs.readdirSync('src/components/')
    .map((componentName) => `include ../src/components/${componentName}/${componentName}.pug`)
    .join('\n');
  if (!fs.existsSync('tmp')){
    fs.mkdirSync('tmp');
  }
  fs.writeFileSync('tmp/components.pug', componentsContent);
  cb();
})

task('pug', function (cb) {
  src('src/pages/*.pug')
    .pipe(data(function (file) { return { require: require }; }))
    .pipe(pug())
    .on('error', swallowError)
    .pipe(dest('dist'))
    .pipe(browserSync.stream());
  cb()
});

task('clean', function (cb) {
  rimraf.sync('tmp');
  cb();
});

task('serve', function() {
  browserSync.init({
    server: "./dist"
  });

  watch([
    'src/styles/**/*.sass',
    'src/**/*.pug',
    'src/**/*.js',
    'src/components/**/*',
    'data/**/*.json'
  ], series('sass', 'pug:components', 'pug'));
  watch('dist/*.html').on('change', browserSync.reload);
});

task('default', series('clean', 'sass', 'pug:components', 'pug', 'serve'));
