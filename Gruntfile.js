module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        copy: {
            deps: {
                files: [{
                    expand: true,
                    cwd: 'bin/ffmpeg',
                    src: ['**/*'],
                    dest: 'build/ffmpeg/'
                }]
            },
        },
        babel: {
            options: {
                plugins: ['transform-minify-booleans', 'transform-property-literals', 'transform-simplify-comparison-operators', 'transform-merge-sibling-variables'],
                presets: ['es2015'],
                compact: true,
                comments: false
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*.js'],
                    dest: 'build/js'
                }]
            }
        },
        clean: {
            release: ['build/'],
        },
        ffmpeg_libs: {
            options: {
                dir: 'bin/ffmpeg',
                force: true,
                arch: (process.platform === 'win32') ? 'ia32' : 'x64',
                platform: (process.platform === 'win32') ? 'win' : 'osx'
            }
        }
    });

    grunt.registerTask('default', ['newer:babel']);

    grunt.registerTask('deps', ['ffmpeg_libs']);
};