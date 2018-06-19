var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var bs = require('browser-sync').create();
var plumber = require('gulp-plumber');

gulp.task('browser-sync', ['sass'], function() {
    bs.init({
        proxy: "http://modularstorage.test/finder"
    });
});



gulp.task('sass', function () {
    return gulp.src('sass/*.scss')
	    .pipe(plumber())
	    .pipe(sass())
        .pipe(autoprefixer({
            browsers: ['last 4 versions'],
            cascade: false
        }))
	    .pipe(gulp.dest('css'))
	    .pipe(bs.stream());
});


gulp.task('watch', ['browser-sync'], function () {
    gulp.watch("sass/*.scss", ['sass']);

    // gulp.watch("**/*.php").on('change', bs.reload);
    gulp.watch("**/*.css").on(['add', 'change'], bs.reload);

});

gulp.task('default', ['sass', 'watch']);