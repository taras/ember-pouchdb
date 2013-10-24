module.exports = {
  options: {
    files: ['package.json','bower.json'],
    updateConfigs: ['pkg'],
    commit: true,
    commitMessage: 'Bump %VERSION%',
    commitFiles: ['package.json', 'bower.json', 'dist'], // '-a' for all files
    createTag: false,
    push: false,
    gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'
  }
}