import express from 'express';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import mdns from 'mdns-js';
import os from 'os';
import net from 'net';
import async from 'async';
import util from 'util';
import EventEmitter from 'events';

console.info("LIB!!!");

var wincmd;
try {
    wincmd = require('node-windows');
} catch (ex) {
    wincmd = null;
}
import {
    Client as castv2Client,
    DefaultMediaReceiver as castv2DefaultMediaReceiver
}
from 'castv2-client';

const app = express();

app.get('/', (req, res) => {
    req.connection.setTimeout(Number.MAX_SAFE_INTEGER);
    console.log("Device requested: /");
    let command = ffmpeg();

    command.setFfmpegPath(path.join(process.cwd(), 'ffmpeg'));
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

var App = function () {
    EventEmitter.call(this);
    this.portRange = 3000;
    this.devices = [];
    async.parallel([
        function (done) {
            this.getFreePort(function (port) {
                this.onFreePortFound(port);
                done();
            }.bind(this));
        }.bind(this),
        // this.detectVirtualAudioDevice.bind(this)
    ], function (err) {
        if (err) {
            // something went wrong
        } else {

        }
    });
};
util.inherits(App, EventEmitter);

App.prototype.getFreePort = function(cb) {
  var port = this.portRange;
  this.portRange++;
  var self = this;

  var server = net.createServer();
  server.listen(port, function (err) {
    server.once('close', function () {
      cb(port);
    });
    server.close();
  });
  server.on('error', function (err) {
    self.getFreePort(cb);
  });
};

App.prototype.onFreePortFound = function (port) {
    this._port = port;
    console.info("onFreePortFound::", port);
    this._server = app.listen(port, function () {
        console.info('Example app listening at http://%s:%s', this.getIp(), port);
    }.bind(this));
};

App.prototype.detectVirtualAudioDevice = function(cb, redetection) {
    var self = this;
    var command = ffmpeg("dummy");
    command.setFfmpegPath(path.join(process.cwd(), 'ffmpeg'));
    command.inputOptions([
        "-list_devices true",
        "-f dshow",
    ])
    command.outputOptions([])
        .on('start', commandLine => {
            console.log('Spawned Ffmpeg with command: ' + commandLine);
        })
        .on('error', (err, one, two) => {
            console.log('An error occurred: ' + err.message);
            if (one, two) {
                if (two.indexOf("virtual-audio-capturer") > -1) {
                    console.log("VIRTUAL DEVICE FOUND");
                    cb();
                } else if (redetection) {
                    var err = "Please re-run application and temporarily allow Administrator to install Virtual Audio Driver.";
                    console.log(err);
                    cb(err);
                } else {
                    wincmd.elevate("register_run_as_admin.bat", function () {
                        setTimeout(function () {
                            self.detectVirtualAudioDevice(cb, true);
                        }, 2000);
                    });
                }
            }
        })
        .on('end', console.log.bind(this, 'end'))

    var ffstream = command.pipe();
};

App.prototype.ondeviceup = function(host, name) {
    if (this.devices.indexOf(host) == -1) {
        this.devices.push(host);
        console.info("ondeviceup", host, this.devices);
        this.emit("deviceFound", host, name);
    }
};

App.prototype.getIp = function() {
    var ip, alias = 0;
    var ifaces = os.networkInterfaces();

    for (var dev in ifaces) {
        ifaces[dev].forEach(details => {
            if (details.family === 'IPv4') {
                if (!/(loopback|vmware|internal|hamachi|vboxnet)/gi.test(dev + (alias ? ':' + alias : ''))) {
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
};

App.prototype.searchForDevices = function() {
    var browser = mdns.createBrowser(mdns.tcp('googlecast'));
    var self = this;
    browser.on('ready', browser.discover);

    browser.on('update', service => {   
        console.log('data:', service);
        console.log('found device "%s" at %s:%d', service.fullname.substring(0, service.fullname.indexOf("._googlecast")), service.addresses[0], service.port);
        self.ondeviceup(service.addresses[0], service.fullname.indexOf("._googlecast"));
        browser.stop();
    });
};

App.prototype.stream = function(host) {
    let client = new castv2Client();
    var self = this;

    client.connect(host, () => {
        console.log('connected, launching app ...');

        client.launch(castv2DefaultMediaReceiver, (err, player) => {
            var media = {

                // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
                contentId: 'http://' + self.getIp() + ':' + self._server.address().port + '/',
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
};

var instance = new App;
instance.searchForDevices();

module.exports = instance;