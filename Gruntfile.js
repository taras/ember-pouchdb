module.exports = function(grunt) {
  // Load grunt-microlib config & tasks
  var emberConfig = require('grunt-microlib').init.bind(this)(grunt);
  grunt.loadNpmTasks('grunt-microlib');

 	grunt.registerTask('build', "Builds a distributable version of <%= cfg.name %>", 
		['clean', 
		'transpile:amd', 
		'transpile:commonjs', 
		'concat:amd', 
		'concat:browser', 
		'browser:dist',
		'browser:distNoVersion', 
		'jshint', 
		'uglify:browser']
	);

  grunt.registerTask('test', "Run your apps's tests once. Uses Google Chrome by default. Logs coverage output to tmp/public/coverage.", 
		[ 'browserify:tests', 'karma:test' ]);

  var config = {
    cfg: {
      // Name of the project
      name: 'ember-pouchdb',

      // Name of the root module (i.e. 'rsvp' -> 'lib/rsvp.js')
      barename: 'ember-pouchdb',

      // Name of the global namespace to export to
      namespace: 'EPDB'
    },
    env: process.env,

    pkg: grunt.file.readJSON('bower.json'),
		
		bump: require('./options/bump'),
    browser: require('./options/browser'),
    browserify: require('./options/browserify'),
    karma: require('./options/karma'),
    release: require('./options/release'),
		shell: require('./options/shell')
  };

  // Merge config into emberConfig, overwriting existing settings
  grunt.initConfig(grunt.util._.merge(emberConfig, config));

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-release');
  grunt.loadNpmTasks('grunt-bump');	
  grunt.loadNpmTasks('grunt-shell');		
};
