import express from 'express';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import Promise from 'bluebird';
import mdns from 'mdns-js';
import os from 'os';
import net from 'net';
import async from 'async';
import util from 'util';
import getPort from 'get-port';
import childProcess from 'child_process';
import {
    EventEmitter
}
from 'events';

import {
    Client as castv2Client,
    DefaultMediaReceiver as castv2DefaultMediaReceiver
}
from 'castv2-client';

var wincmd;
try {
    wincmd = require('node-windows');
} catch (ex) {
    wincmd = null;
}

const ffmpegPath = path.join(process.cwd(), 'resources/bin/ffmpeg/', process.platform, 'ffmpeg');
const app = express();

app.get('/', (req, res) => {
    console.log("Device requested: /");
    req.connection.setTimeout(Number.MAX_SAFE_INTEGER);
    let command = ffmpeg();

    command.setFfmpegPath(ffmpegPath);
    command.input('audio=virtual-audio-capturer')
    command.inputFormat('dshow')
    command.audioCodec("libmp3lame")
    command.outputFormat("mp3")
        .on('start', commandLine => {
            console.log('Spawned Ffmpeg with command: ' + commandLine);
        })
        .on('error', (err, one, two) => {
            console.log('An error occurred: ' + err.message);
            console.log(two);
        })
        .on('end', () => {
            console.log("end");
            res.end();
        })

    let ffstream = command.pipe();
    ffstream.on('data', res.write.bind(res));
});

class App extends EventEmitter {
    constructor() {
        super();

        this.port = false;
        this.devices = [];
        this.server = false;

        this.init();
    }

    init() {
        this.setupServer()
            .then(this.detectVirtualAudioDevice.bind(this))
            .catch(console.error);
    }

    setupServer() {
        return new Promise((resolve, reject) => {
            getPort()
                .then(port => {
                    this.port = port;
                    this.server = app.listen(port, () => {
                        console.info('Example app listening at http://%s:%s', this.getIp(), port);
                    });
                    resolve()
                })
                .catch(reject);
        });
    }

    detectVirtualAudioDevice(redetection) {
        let command = ffmpeg("dummy");
        command.setFfmpegPath(ffmpegPath);
        command.inputOptions([
            "-list_devices true",
            "-f dshow",
        ])
        return new Promise((resolve, reject) => {
            command.outputOptions([])
                .on('start', commandLine => {
                    console.log('Spawned Ffmpeg with command: ' + commandLine);
                })
                .on('error', (err, one, two) => {
                    console.log('An error occurred: ' + err.message);
                    if (one, two) {
                        if (two.indexOf("virtual-audio-capturer") > -1) {
                            console.log("VIRTUAL DEVICE FOUND");
                            resolve();
                        } else if (redetection) {
                            let err = "Please re-run application and temporarily allow Administrator to install Virtual Audio Driver.";
                            console.log(err);
                            reject(err);
                        } else {
                            var driverPath = path.join(process.cwd(), 'resources/bin/driver/', process.platform);
                            var dllPath = path.join(driverPath, "audio_sniffer.dll");
                            var regsvrPath = path.join(driverPath, "RegSvrEx.exe");

                            console.log("DLL INSTALL", regsvrPath + " /c " + dllPath);
                            var child = childProcess.exec(regsvrPath + " /c " + dllPath,
                            function (error, stdout, stderr) {
                                console.log('stdout: ' + stdout);
                                console.log('stderr: ' + stderr);
                                if (error !== null) {
                                  console.log('exec error: ' + error);
                                }
                                this.detectVirtualAudioDevice(true);
                            }.bind(this));
                            // wincmd.elevate(regsvrPath + " /c " + dllPath, () => {
                            //     this.detectVirtualAudioDevice(true);
                            // });
                        }
                    }
                })
                .on('end', () => {
                    console.log('end');
                })
            let ffstream = command.pipe();
        });

    }
    ondeviceup(host, name) {
        if (this.devices.indexOf(host) == -1) {
            this.devices.push(host);
            this.emit("deviceFound", host, name);
        }
    }
    getIp() {
        var ip = false
        var alias = 0;
        let ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(details => {
                if (details.family === 'IPv4') {
                    if (!/(loopback|vmware|internal|hamachi|vboxnet|virtualbox)/gi.test(dev + (alias ? ':' + alias : ''))) {
                        if (details.address.substring(0, 8) === '192.168.' ||
                            details.address.substring(0, 7) === '172.16.' ||
                            details.address.substring(0, 5) === '10.0.'
                        ) {
                            ip = details.address;
                            ++alias;
                        }
                    }
                }
            });
        }
        return ip;
    }
    searchForDevices() {
        let browser = mdns.createBrowser(mdns.tcp('googlecast'));
        browser.on('ready', browser.discover);

        browser.on('update', (service) => {
            if (service.addresses && service.fullname) {
                this.ondeviceup(service.addresses[0], service.fullname.substring(0, service.fullname.indexOf("._googlecast")));
            }
        });
    }
    stream(host) {
        let client = new castv2Client();

        client.connect(host, () => {
            console.log('connected, launching app ...', 'http://' + this.getIp() + ':' + this.server.address().port + '/');

            client.launch(castv2DefaultMediaReceiver, (err, player) => {
                let media = {

                    // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
                    contentId: 'http://' + this.getIp() + ':' + this.server.address().port + '/',
                    contentType: 'audio/mp3',
                    streamType: 'BUFFERED', // or LIVE

                    // Title and cover displayed while buffering
                    metadata: {
                        type: 0,
                        metadataType: 0,
                        title: "Audio Caster",
                    }
                };

                player.on('status', status => {
                    console.log('status broadcast playerState=%s', status);
                });

                console.log('app "%s" launched, loading media %s ...', player, media);

                player.load(media, {
                    autoplay: true
                }, (err, status) => {
                    console.log('media loaded playerState=%s', status);
                });

            });

        });

        client.on('error', err => {
            console.log('Error: %s', err.message);
            client.close();
        });
    }
}

let instance = new App();
instance.searchForDevices();

module.exports = instance;