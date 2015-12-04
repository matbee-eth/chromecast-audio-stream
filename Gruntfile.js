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
                },
                {
                    cwd: 'src/',
                    expand: true,
                    src: ['**/*.png'],
                    dest: 'build'
                }]
            },
            deps: {
                files: [{
                    expand: true,
                    cwd: 'bin/driver/' + process.platform,
                    src: ['**/*'],
                    dest: 'build/driver/'
                }, {
                    cwd: 'node_modules/',
                    src: Object.keys(packagejson.dependencies).map(function(dep) {
                        return dep + '/**/*';
                    }),
                    dest: 'build/node_modules/',
                    expand: true
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
                    async: false,
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
        },
        electron: {
            windows: {
                options: {
                    name:  "audio-cast",
                    dir: 'build/',
                    out: 'dist',
                    version: packagejson['electron-version'],
                    platform: 'win32',
                    arch: 'ia32',
                    prune: true,
                    asar: true
                }
            },
            linux: {
                options: {
                    name:  "audio-cast",
                    dir: 'build/',
                    out: 'dist',
                    version: packagejson['electron-version'],
                    platform: 'linux',
                    arch: process.arch,
                    asar: true,
                    prune: true
                }
            },
            osx: {
                options: {
                    name: "audio-cast",
                    dir: 'build/',
                    out: 'dist',
                    version: packagejson['electron-version'],
                    platform: 'darwin',
                    arch: 'x64',
                    asar: true,
                    prune: true,
                    'app-bundle-id': 'io.ΛLΞXΛNDRIΛ.Librarian',
                    'app-version': packagejson.version
                }
            }
        },
    });

    grunt.registerTask('default', ['babel', 'copy:dev', 'shell:electron']);

    grunt.registerTask('deps', ['ffmpeg_libs', 'copy:deps']);
};