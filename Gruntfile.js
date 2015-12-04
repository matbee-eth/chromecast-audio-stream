var electron = require('electron-prebuilt');
var packagejson = require('./package.json');

module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);

    var APP_NAME = "audio-cast";
    var APP_VERSION = packagejson.version;

    grunt.initConfig({
        copy: {
            dev: {
                files: [{
                    expand: true,
                    cwd: '.',
                    src: ['package.json'],
                    dest: 'build/'
                }, {
                    cwd: 'src/',
                    expand: true,
                    src: ['**/*.png'],
                    dest: 'build'
                }, {
                    expand: true,
                    cwd: 'bin/',
                    src: ['**/*'],
                    dest: 'build/resources/bin/'
                }]
            },
            depsWindows: {
                files: [{
                    expand: true,
                    cwd: 'bin/',
                    src: ['**/*'],
                    dest: 'dist/' + APP_NAME + '-win32-ia32/resources/bin/'
                }]
            },
            node_modules: {
                files: [{
                    cwd: 'node_modules/',
                    src: Object.keys(packagejson.dependencies).map(function(dep) {
                        return dep + '/**/*';
                    }),
                    dest: 'build/node_modules/',
                    expand: true
                }]
            },
            release: {
                files: [{
                    cwd: 'node_modules/',
                    src: Object.keys(packagejson.dependencies).map(function(dep) {
                        return dep + '/**/*';
                    }),
                    dest: 'build/node_modules/',
                    expand: true
                }, {
                    expand: true,
                    cwd: '.',
                    src: ['package.json'],
                    dest: 'build/'
                }, {
                    cwd: 'src/',
                    expand: true,
                    src: ['*.png'],
                    dest: 'build'
                }]
            }
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
                    async: false,
                    execOptions: {
                        cwd: 'build'
                    }
                }
            }
        },
        clean: {
            build: ['build/'],
            release: ['dist/']
        },
        ffmpeg_libs: {
            options: {
                dir: 'bin/ffmpeg/' + process.platform,
                force: true,
                arch: (process.platform === 'win32') ? 'ia32' : 'x64',
                platform: (process.platform === 'win32') ? 'win' : 'osx'
            }
        },
        electron: {
            windows: {
                options: {
                    name: APP_NAME,
                    dir: 'build/',
                    out: 'dist',
                    version: packagejson['optionalDependencies']['electron-prebuilt'],
                    platform: 'win32',
                    arch: 'ia32',
                    prune: true,
                    asar: true
                }
            }
        },
        compress: {
            windows: {
                options: {
                    archive: './dist/' + APP_NAME + '-' + APP_VERSION + '-ia32-win32.zip',
                    mode: 'zip'
                },
                files: [{
                    expand: true,
                    dot: true,
                    cwd: './dist/' + APP_NAME + '-win32-ia32',
                    src: '**/*'
                }]
            }
        }
    });

    grunt.registerTask('default', ['babel', 'copy:dev', 'shell:electron']);

    grunt.registerTask('run', ['babel', 'shell:electron']);

    grunt.registerTask('deps', ['copy:node_modules']);

    if (process.platform === 'win32') {
        grunt.registerTask('release', ['clean:build', 'babel', 'copy:release', 'electron:windows', 'copy:depsWindows', 'compress:windows']);
    }

};