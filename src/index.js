import express from 'express';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import mdns from 'mdns';
import os from 'os';
import wincmd from 'node-windows';
import {
    Client as castv2Client,
    DefaultMediaReceiver as castv2DefaultMediaReceiver
}
from 'castv2-client';



const app = express();
const server = app.listen(3000, console.log.bind(this, 'Example app listening at http://%s:%s', getIp(), server.address().port));





app.get('/', (req, res) => {
    req.connection.setTimeout(Number.MAX_SAFE_INTEGER);

    var command = ffmpeg();

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

    var ffstream = command.pipe();
    ffstream.on('data', chunk => {
        // console.log('ffmpeg just wrote ' + chunk.length + ' bytes');
        res.write(chunk);
    });
});




ondeviceup = host => {

    var client = new castv2Client();

    client.connect(host, () => {
        console.log('connected, launching app ...');

        client.launch(DefaultMediaReceiver, (err, player) => {
            var media = {

                // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
                contentId: 'http://' + getIp() + ':' + server.address().port + '/',
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


getIp = () => {
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
}

go = () => {
    var browser = mdns.createBrowser(mdns.tcp('googlecast'));

    browser.on('ready', browser.discover);

    browser.on('update', service => {
        console.log('data:', service);
        console.log('found device "%s" at %s:%d', service.name, service.addresses[0], service.port);
        ondeviceup(service.addresses[0]);
        browser.stop();
    });
}


detectVirtualAudioDevice = redetection => {
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
            // console.log('An error occurred: ' + err.message);
            // console.log(two);
            if (two.indexOf("virtual-audio-capturer") > -1) {
                console.log("VIRTUAL DEVICE FOUND");
                go();
            } else if (redetection) {
                console.log("Please re-run application and temporarily allow Administrator to install Virtual Audio Driver.");
            } else {
                wincmd.elevate("register_run_as_admin.bat", detectVirtualAudioDevice.bind(this, true));
            }
        })
        .on('end', console.log.bind(this, 'end'))

    var ffstream = command.pipe();
};
detectVirtualAudioDevice();