module.exports = function(grunt) {
  // Load grunt-microlib config & tasks
  var emberConfig = require('grunt-microlib').init.bind(this)(grunt);
  grunt.loadNpmTasks('grunt-microlib');

  grunt.registerTask('test', "Run your apps's tests once. Uses Google Chrome by default. Logs coverage output to tmp/public/coverage.", [
                     'build', 'browserify:tests', 'karma:test' ]);

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

    pkg: grunt.file.readJSON('package.json'),

    browserify: require('./options/browserify.js'),
    karma: require('./options/karma.js')    
  };

  // Merge config into emberConfig, overwriting existing settings
  grunt.initConfig(grunt.util._.merge(emberConfig, config));

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-karma');
};
