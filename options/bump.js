module.exports = {
  options: {
    files: ['package.json','bower.json'],
    updateConfigs: ['pkg'],
    commit: true,
    commitMessage: 'Release %VERSION%',
    commitFiles: [
			'package.json', 
			'bower.json',
			'dist/ember-pouchdb.js',
			'dist/ember-pouchdb.min.js', 
			'dist/ember-pouchdb.amd.js'], // '-a' for all files
    createTag: true,
    push: true,
    pushTo: 'origin',
    gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'
  }
}