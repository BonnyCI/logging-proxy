process.env.NODE_ENV = 'test'

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    eslint: {
      target: ['.']
    },

    mochaTest: {
      test: {
        options: {},
        src: ['**/*.spec.js']
      }
    }
  })

  grunt.loadNpmTasks('grunt-eslint')
  grunt.loadNpmTasks('grunt-mocha-test')

  grunt.registerTask('test', ['eslint', 'mochaTest'])
}
