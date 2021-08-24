// TODO: vulcanize, minify
var gulp = require('gulp'),
    watch = require('gulp-watch'),
    concat = require('gulp-continuous-concat'),
    // singleConcat = require('gulp-concat'),
    debug = require('gulp-debug'),
    replace = require('gulp-replace'),
    babel = require('gulp-babel'),
    vulcanize = require('gulp-vulcanize');

var jsFiles = [
  'src/js/intro.js',
  'src/js/helpers.js',
  // 'src/js/load_widget.js',
  'src/js/Target.js',
  'src/js/GradeBook.js',
  'src/js/TA/collectors.js',
  'src/js/TA/reporters.js',
  'src/js/registrar.js',
  'src/js/outro.js'
];

var webComponents = [
  'src/webcomponents/feedback.html',
  'src/webcomponents/active-test.html',
  'src/webcomponents/suite-editor.html',
  'src/webcomponents/test-editor.html',
  'src/webcomponents/test-results.html',
  'src/webcomponents/test-suite.html',
  'src/webcomponents/test-widget.html',
]
 
gulp.task('watch-vulcanize', function () {
  return gulp.src('src/webcomponents/feedback.html')
    .pipe(watch(webComponents))
    .pipe(vulcanize({
      stripComments: true,
    }))
    .pipe(gulp.dest('dist'))
    .pipe(debug({title: 'vulcanized: '}))
});

gulp.task('vulcanize', function () {
  return gulp.src('src/webcomponents/feedback.html')
    .pipe(vulcanize({
      stripComments: true,
    }))
    .pipe(gulp.dest('dist'))
    .pipe(debug({title: 'vulcanized: '}))
});

gulp.task('watch-build-dev-engine', function() {
  return gulp.src(jsFiles)
    .pipe(watch(jsFiles))
    .pipe(concat('udgrader-004.js'))
    .pipe(gulp.dest('dist/'))
    .pipe(debug({title: 'rebuild for dev:'}))
});

gulp.task('watch-build-prod-engine', function() {
  return gulp.src(jsFiles)
    .pipe(watch(jsFiles))
    .pipe(concat('udgrader-prod.js'))
    .pipe(replace('/frontend-grading-engine/', 'http://udacity.github.io/frontend-grading-engine/'))
    .pipe(gulp.dest('dist/'))
    .pipe(debug({title: 'rebuild for prod:'}))
});

gulp.task('dev-watch', ['watch-vulcanize', 'watch-build-dev-engine']);
gulp.task('prod-watch', ['watch-vulcanize', 'watch-build-prod-engine']);