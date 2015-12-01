var electron = require('electron-prebuilt');
var packagejson = require('./package.json');

module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        copy: {
            dev: {
                files: [{
                    expand: true,
                    cwd: '.',
                    src: ['package.json'],
                    dest: 'build/'
                }, {
                    cwd: 'node_modules/',
                    src: Object.keys(packagejson.dependencies).map(function(dep) {
                        return dep + '/**/*';
                    }),
                    dest: 'build/node_modules/',
                    expand: true
                }]
            },
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
                compact: false,
                comments: false
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*.js'],
                    dest: 'build'
                }]
            }
        },
        shell: {
            electron: {
                command: electron + ' . ' + (grunt.option('dev') ? '--dev' : ''),
                options: {
                    async: true,
                    execOptions: {
                        cwd: 'build'
                    }
                }
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

    grunt.registerTask('default', ['babel', 'copy:dev', 'shell:electron']);

    grunt.registerTask('deps', ['ffmpeg_libs', 'copy:deps']);
};