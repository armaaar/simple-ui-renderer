const pug = require('gulp-pug');
const browserSync = require('browser-sync').create();
const {
    task,
    series,
    src,
    dest,
    watch,
    parallel
} = require("gulp");

task('pug', function (cb) {
    src('src/*.pug')
        .pipe(pug())
        .pipe(dest('dist'))
        .pipe(browserSync.stream());
    cb();
});

task('serve', function() {
    browserSync.init({
        server: "./dist"
    });

    watch(['src/*.pug'], series('pug'));
    watch('dist/*.html').on('change', browserSync.reload);
});

task('default', series('pug', 'serve'));