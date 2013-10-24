module.exports = {
  options: {
    files: ['bower.json', 'package.json'],
    updateConfigs: [],
    commit: true,
    commitMessage: 'Bump v%VERSION%',
    commitFiles: ['-a'], // '-a' for all files
    createTag: true,
		pushTo: "origin",
    push: true,
    gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'
  }
}