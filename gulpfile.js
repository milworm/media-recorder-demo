var gulp = require("gulp"),
    babel = require("gulp-babel");

gulp.task('watch', ['build-js'], function() {
    gulp.watch('./src/**/*.js', ['build-js']);
});

gulp.task('build-js', function() {
  return gulp.src('./src/**/*.js')
             .pipe(babel())
             // catch and print errors
             .on('error', console.error.bind(console))
             // put files to chrome data dir
            .pipe(gulp.dest('./data/'));
});