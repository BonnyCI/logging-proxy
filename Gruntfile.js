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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');

};
