var gulp = require('gulp');
var uglify = require('gulp-uglify');
var merge = require('merge-stream');
var minify_css = require('gulp-minify-css');
var rename = require('gulp-rename');
var dateFormat = require('dateformat');
var zip = require('gulp-zip');
var pump = require('pump');
var concat = require('gulp-concat');
var copy = require('gulp-copy');
var sass = require('gulp-sass');

var jsSources = [
	'js/src/*.js',
	'!js/src/*.min.js'
];

var sassSources = [
	'css/src/*.scss'
];

var cssSources = [
	'css/*.css',
	'!css/*.min.css'
];

gulp.task('copy-extra-resources', [], function(cb) {

	pump([
		gulp.src([
			'bower_components/bootstrap/dist/fonts/*.*'
		]),
		copy('./fonts', {
			prefix: 4
		})
	], cb);

});

gulp.task('process-vendor-css', ['copy-extra-resources'], function(cb) {

	pump([
		gulp.src([
			'./bower_components/bootstrap/dist/css/bootstrap.css',
			'./bower_components/bootstrap-daterangepicker/daterangepicker.css',
			'./bower_components/select2/dist/css/select2.css',
			'./bower_components/dynatable/jquery.dynatable.css'
		]),
		concat('vendor.css'),
		minify_css(),
		rename({
			'suffix': '.min'
		}),
		gulp.dest('css')
	], cb);

});

gulp.task('process-css', ['process-vendor-css'], function(cb) {

	pump([
		gulp.src(sassSources),
		sass(),
		minify_css(),
		rename({
			'suffix': '.min'
		}),
		gulp.dest('css')
	], cb);

});

gulp.task('process-vendor-js', [], function(cb) {

	pump([
		gulp.src([
			'./bower_components/moment/moment.js',
			'./bower_components/bootstrap-daterangepicker/daterangepicker.js',
			'./bower_components/chart.js/dist/Chart.js',
			'./bower_components/select2/dist/js/select2.full.js',
			'./bower_components/dynatable/jquery.dynatable.js',
			'./bower_components/js-cookie/src/js.cookie.js'
		]),
		concat('vendor.js'),
		uglify(),
		rename({
			'suffix': '.min'
		}),
		gulp.dest('js')
	], cb);

});

gulp.task('process-js', ['process-vendor-js'], function(cb) {

	pump([
		gulp.src(jsSources),
		uglify(),
		rename({
			'suffix': '.min'
		}),
		gulp.dest('js')
	], cb);

});

gulp.task('watch', ['process-css', 'process-js'], function(cb) {

	gulp.watch(sassSources, ['process-css']);
	gulp.watch(jsSources, ['process-js']);

});

gulp.task('build', ['process-css', 'process-js']);

gulp.task('package', ['build'], function(cb) {

	var fs = require('fs');
	var time = dateFormat(new Date(), "yyyy-mm-dd_HH-MM");
	var pkg = JSON.parse(fs.readFileSync('./package.json'));
	var filename = pkg.name + '-' + pkg.version + '-' + time + '.zip';

	pump([
		gulp.src([
			'**/*',
			'!**/js/src',
			'!**/js/src/**',
			'!**/css/src',
			'!**/css/src/**',
			'!**/node_modules/**',
			'!**/node_modules',
			'!**/bower_components/**',
			'!**/bower_components',
			'!**/components/**',
			'!**/components',
			'!**/scss/**',
			'!**/scss',
			'!**/bower.json',
			'!**/gulpfile.js',
			'!**/package.json',
			'!**/composer.json',
			'!**/composer.lock',
			'!**/codesniffer.ruleset.xml',
			'!**/dist/**',
			'!**/dist'
		]),
		zip(filename),
		gulp.dest('dist')
	], cb);

});

gulp.task('default', ['build']);