# Chromecast Audio Stream
Capture your system audio and stream everything directly to your Chromecast.

[![Screenshot](https://s3.amazonaws.com/matbee.com/audio-cast.png)](https://s3.amazonaws.com/matbee.com/audio-cast.png)

Stream your PC's audio to the Chromecast

---

## OSX Users!

Use this for OSX support: https://github.com/andresgottlieb/soundcast

---

## Installation instructions

Download release file: https://github.com/acidhax/chromecast-audio-stream/releases/download/0.3/audio-cast-win32-ia32.zip

Extract and execute audio-cast.exe.

Right click tray icon and select your cast device.

Enjoy!

----

## Bug fixes / Troubleshooting:

### App doesnt launch or gives error
- This program requires [Microsoft Visual C++ 2010 Redistributable Package](https://www.microsoft.com/en-us/download/details.aspx?id=5555). If you are on Windows 10, you will have to install this.

### App opens and connects to chromecast device (You'll hear a short chime), but doesn't stream audio
1. Open an command prompt session as administrator and navigate to `<Your Audio-Cast root directory>\resources\bin\driver`
2. If you have a 64-bit machine, download [audio_sniffer-x64.dll](https://github.com/rdp/virtual-audio-capture-grabber-device/tree/master/source_code/x64/Release) and put it in the directory from step 1. 
3. Execute the following commands, one by one, in the command prompt: 
   ```
   regsvr32.exe -u audio_sniffer.dll
   regsvr32.exe audio_sniffer.dll
   regsvr32.exe -u audio_sniffer-x64.dll
   regsvr32.exe audio_sniffer-x64.dll
   ```
4. **IMPORTANT**: If you have any applications/processes running that access/control the audio device, such as Realtek Audio Manager or Nahimic, they need to be closed and their respective processes killed. Easiest way to do this is to disable startup of both programs and reboot. 
5. Profit! 

---

## Dev's

- npm install -g grunt-cli (in command-line as administrator)
- npm install
- grunt
