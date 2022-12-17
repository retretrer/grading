var gulp = require('gulp');
var gulpsync = require('gulp-sync')(gulp);
var watch = require('gulp-watch');
var concat = require('gulp-concat');
var debug = require('gulp-debug');
var batch = require('gulp-batch');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var mv = require('mv');

var currentBrowser;

var build = './build/%target%/ext/';

var log = function(message) {
  console.log('\x1b[37;46m####       ' + message + '\x1b[0;m');
};

var jsFiles = {
  gradingEngine: {
    src: [
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
    ],
    concat: 'GE.js',
    dest: build + 'app/js/libs/'
  },
  libraries: {
    src: 'src/app/js/libs/*.js',
    dest: build + 'app/js/libs/'
  },
  background: {
    src: '%target%/background.js',
    dest: build + 'app/js/'
  },
  inject: {
    src: [
      '%target%/inject/intro.js',
      'src/app/js/inject/helpers.js',
      'src/app/js/inject/StateManager.js',
      'src/app/js/inject/inject.js',
      '%target%/inject/outro.js'
    ],
    concat: 'inject.js',
    dest: build + 'app/js/'
  },
  components: {
    src: [
      'src/app/test_widget/js/components.js',
      'src/app/test_widget/js/test_suite.js',
      'src/app/test_widget/js/test_results.js',
      'src/app/test_widget/js/active_test.js',
      'src/app/test_widget/js/test_widget.js'
    ],
    concat: 'components.js',
    dest: build + 'app/templates/'
  }
};

var gradingEngine = jsFiles.gradingEngine;
var libraries = jsFiles.libraries;
var background = jsFiles.background;
var inject = jsFiles.inject;
var components = jsFiles.components;

var browserPageFiles = {
  pageAction: {
    src: 'src/app/browser_action/browser_action.*',
    dest: build + 'app/browser_action/'
  },
  pageOptions: {
    src: ['src/app/options/index.html', 'src/app/options/options.js'],
    dest: build + 'app/options/'
  }
};
var pageAction = browserPageFiles.pageAction;
var pageOptions = browserPageFiles.pageOptions;

var iconFiles = {
  src: 'src/icons/*.png',
  dest: build + 'icons/'
};

// Files to watch
var allFiles = gradingEngine.src.concat(components.src, inject.src);

// "GE" = Build the GradingEngine library.
gulp.task('GE', function() {
  return gulp.src(gradingEngine.src)
    .pipe(concat(gradingEngine.concat))
    .pipe(gulp.dest(gradingEngine.dest))
    .pipe(debug({title: 'built dev grading engine:'}));
});

// "libraries" = Copy libraries of the application.
gulp.task('libraries', function() {
  return gulp.src(libraries.src)
    .pipe(gulp.dest(libraries.dest))
    .pipe(debug({title: 'copied grading engine libraries:'}));
});

// "components" = Generate the native components. There were
// previously Web Components.
gulp.task('components', function() {
  return gulp.src(components.src)
    .pipe(concat(components.concat))
    .pipe(gulp.dest(components.dest))
    .pipe(debug({title: 'built components: '}));
});

// "inject" = Generate the inject script for the current browser.
gulp.task('inject', function() {
  var files = inject.src.map(function(x) {
    return x.replace('%target%', currentBrowser);
  });
  return gulp.src(files)
    .pipe(concat(inject.concat))
    .pipe(gulp.dest(inject.dest))
    .pipe(debug({title: 'built inject.js:'}));
});

// "pageAction" = Copy the `browser_action` page.
gulp.task('pageAction', function() {
  return gulp.src(pageAction.src)
    .pipe(gulp.dest(pageAction.dest))
    .pipe(debug({title: 'copied action page:'}));
});

// "pageOptions" = Copy the options page.
gulp.task('pageOptions', function() {
  return gulp.src(pageOptions.src)
    .pipe(gulp.dest(pageOptions.dest))
    .pipe(debug({title: 'copied options page:'}));
});

// "icons" = Copy the icons.
gulp.task('icons', function() {
  return gulp.src(iconFiles.src)
    .pipe(gulp.dest(iconFiles.dest))
    .pipe(debug({title: 'copied icons:'}));
});

// "app" = Executes tasks for the app (view).
gulp.task('app', ['components', 'inject', 'pageAction', 'pageOptions', 'icons']);

// "extension" = Executes tasks that are mostly not browser specific.
gulp.task('extension', ['app', 'GE', 'libraries']);

// "background-script" = Copy the background script for the
// `currentBrowser` (if any).
gulp.task('background-script', function() {
  return gulp.src(background.src.replace('%target%', currentBrowser))
    .pipe(gulp.dest(background.dest))
    .pipe(debug({title: 'copied ' + currentBrowser + '’s background script:'}));
});

// "manifest" = Copy the manifest for the current browser
gulp.task('manifest', function() {
  return gulp.src(currentBrowser + '/manifest.json')
    .pipe(gulp.dest(build))
    .pipe(debug({title: 'copied ' + currentBrowser +'’s manifest:'}));
});

// "_chromium" = Sets currentBrowser to chromium.
gulp.task('_chromium', function() {
  currentBrowser = 'chromium';
  return log('Set ' + currentBrowser + ' as the current browser');
});

// "_firefox" = Sets currentBrowser to firefox
gulp.task('_firefox', function() {
  currentBrowser = 'firefox';
  return log('Set ' + currentBrowser + ' as the current browser');
});

// "chromium" = First run dependencies to build the extension and then
// move those files to `build/chromium` instead of `build/%target%/`.
gulp.task('chromium', gulpsync.sync(['_chromium', ['manifest', 'extension']]), function() {
  var browserBuild = build.replace('%target%/ext/', currentBrowser + '/');
  mv(build.replace('ext/', ''), browserBuild, {mkdirp: true}, function(err) {
    console.log(err);
  });
  return log('Moved ' + currentBrowser + ' files to: ' + browserBuild);
});

// "firefox" = First run dependencies to build the extension and then
// move those files to `build/firefox` instead of `build/%target%/`.
gulp.task('firefox', gulpsync.sync(['_firefox', ['manifest', 'background-script', 'extension']]), function() {
  var browserBuild = build.replace('%target%/ext/', 'firefox/');
  mv(build.replace('ext/', ''), browserBuild, {mkdirp: true}, function(err) {
    console.log(err);
  });
  return log('Moved ' + currentBrowser + ' files to: ' + browserBuild);
});

// "clean" = Clean the build directory. Otherwise `mv` would throw an error.
gulp.task('clean', function() {
log('Cleaned the build directory');
  return gulp.src('./build/', {read: false})
    .pipe(clean())
    .pipe(debug({title: 'cleaned ' + build}));
});

gulp.task('default', gulpsync.sync(['clean', 'firefox', 'chromium']));

gulp.task('watch', function() {
  gulp.start('default');
  watch(allFiles, batch(function(events, done) {
    gulp.start('default', done);
  }));
});
