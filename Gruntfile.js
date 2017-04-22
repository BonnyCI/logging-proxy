process.env.NODE_ENV = 'test';

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            files: ['Gruntfile.js',
                    'index.js',
                    'static/**/*.js',
                    'sock/**/*.js'],

            options: {
                esversion: 6
            }
        },

        mochaTest: {
            test: {
                options: {
                },
                src: ['**/*.spec.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');

};
