module.exports = function(grunt) {
  var env = grunt.option('env') || 'dev';

  console.log('Running Gruntfile for env: ' + env);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['app/src/**/*.js'],
      options: {
        globals: {
          jQuery: true
        }
      }
    },

    concat: {
      css: {
        src: ['app/src/**/*.css'],
        dest: 'app/dist/<%= pkg.name %>.css'
      }
    },

    browserify: {
      options: {
        browserifyOptions: {
          debug: env !== 'prod',
          transform: ['brfs']
        }
      },
      dist: {
        files: {
          'app/dist/<%= pkg.name %>.js': ['app/src/main.js']
        }
      }
    },

    uglify: {
      dist: {
        files: {
          'app/dist/<%= pkg.name %>.min.js': ['app/dist/<%= pkg.name %>.js']
        }
      }
    },

    watch: {
      js: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint', 'browserify', 'uglify'],
        options: {
          spawn: false
        }
      },
      html: {
        files: ['app/src/**/*.html'],
        tasks: ['jshint', 'browserify', 'uglify'],
        options: {
          spawn: false
        }
      },
      css: {
        files: ['app/src/**/*.css'],
        tasks: ['concat:css'],
        options: {
          spawn: false
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  var tasksToRun = ['jshint', 'concat:css', 'browserify', 'uglify'];

  if (env !== 'prod') {
    tasksToRun.push('watch');
  }

  grunt.registerTask('default', tasksToRun);
};
