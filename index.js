var express = require('express');
var app = express();
var ffmpeg = require('fluent-ffmpeg');
var path = require('path');
app.get('/', function (req, res) {
	var command = ffmpeg();
	command.setFfmpegPath(path.join(process.cwd(), 'ffmpeg'));
	command.input('audio=virtual-audio-capturer')
  	command.inputFormat('dshow')
  	command.audioCodec("libmp3lame")
  	command.outputFormat("mp3")
  	.on('start', function(commandLine) {
	    console.log('Spawned Ffmpeg with command: ' + commandLine);
	})
	.on('error', function(err, one, two) {
          console.log('An error occurred: ' + err.message);
          console.log(two);
    })
    .on('end', function () {
    	console.log("end");
    	res.end();
    })

	var ffstream = command.pipe();
	ffstream.on('data', function(chunk) {
	  // console.log('ffmpeg just wrote ' + chunk.length + ' bytes');
	  res.write(chunk);
	});
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', getIp(), port);
});

var Client                = require('castv2-client').Client;
var DefaultMediaReceiver  = require('castv2-client').DefaultMediaReceiver;
var mdns                  = require('mdns-js');
var browser = mdns.createBrowser(mdns.tcp('googlecast'));

browser.on('ready', function () {
    browser.discover(); 
});

browser.on('update', function (service) {
    console.log('data:', service);
	  console.log('found device "%s" at %s:%d', service.name, service.addresses[0], service.port);
	  ondeviceup(service.addresses[0]);
	  browser.stop();
});

browser.on('serviceUp', function(service) {
  console.log('found device "%s" at %s:%d', service.name, service.addresses[0], service.port);
  ondeviceup(service.addresses[0]);
  browser.stop();
});

function ondeviceup(host) {

  var client = new Client();

  client.connect(host, function() {
    console.log('connected, launching app ...');

    client.launch(DefaultMediaReceiver, function(err, player) {
      var media = {

        // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
        contentId: 'http://'+getIp()+':3000/',
        contentType: 'audio/mp3',
        streamType: 'BUFFERED', // or LIVE

        // Title and cover displayed while buffering
        metadata: {
          type: 0,
          metadataType: 0,
          title: "Audio Caster",
        }        
      };

      player.on('status', function(status) {
        console.log('status broadcast playerState=%s', status);
      });

      console.log('app "%s" launched, loading media %s ...', player, media);

      player.load(media, { autoplay: true }, function(err, status) {
        console.log('media loaded playerState=%s', status);
      });

    });

  });

  client.on('error', function(err) {
    console.log('Error: %s', err.message);
    client.close();
  });

}

var os = require('os');
function getIp () {
	var ip, alias = 0;
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
        ifaces[dev].forEach(function (details) {
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