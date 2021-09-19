// TODO: minify
var gulp = require('gulp'),
    watch = require('gulp-watch'),
    concat = require('gulp-continuous-concat'),
    debug = require('gulp-debug'),
    replace = require('gulp-replace'),
    vulcanize = require('gulp-vulcanize');

var jsFiles = [
  'src/js/intro.js',
  'src/js/helpers.js',
  'src/js/Queue.js',
  'src/js/Target.js',
  'src/js/GradeBook.js',
  'src/js/TACollectors.js',
  'src/js/TAReporters.js',
  'src/js/ActiveTest.js',
  'src/js/Suite.js',
  'src/js/registrar.js',
  'src/js/outro.js'
];

var webComponents = [
  'src/webcomponents/intro.html',
  'src/webcomponents/active-test.html',
  'src/webcomponents/test-results.html',
  'src/webcomponents/test-suite.html',
  'src/webcomponents/test-widget.html',
  'src/webcomponents/outro.html',
]

gulp.task('watch-components', function () {
  return gulp.src(webComponents)
    .pipe(watch(webComponents))
    .pipe(concat('feedback.html'))
    .pipe(gulp.dest('ext/src/templates/'))
    .pipe(debug({title: 'built dev feedback: '}))
});

gulp.task('vulcanize', function () {
  return gulp.src('src/webcomponents/feedback.html')
    .pipe(vulcanize({
      stripComments: true
    }))
    .pipe(gulp.dest('dist'))
    .pipe(debug({title: 'vulcanized: '}))
});

gulp.task('watch-build-dev-engine', function() {
  return gulp.src(jsFiles)
    .pipe(watch(jsFiles))
    .pipe(concat('udgrader.js'))
    .pipe(gulp.dest('ext/src/js/'))
    .pipe(debug({title: 'built dev grading engine:'}))
});

gulp.task('watch-build-prod-engine', function() {
  return gulp.src(jsFiles)
    .pipe(watch(jsFiles))
    .pipe(concat('udgrader-prod.js'))
    .pipe(replace('/frontend-grading-engine/', 'http://udacity.github.io/frontend-grading-engine/'))
    .pipe(gulp.dest('dist/'))
    .pipe(debug({title: 'rebuild for prod:'}))
});

gulp.task('default', ['watch-components', 'watch-build-dev-engine']);
gulp.task('dev-watch', ['watch-components', 'watch-build-dev-engine']);
gulp.task('prod-watch', ['watch-vulcanize', 'watch-build-prod-engine']);