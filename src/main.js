import app from 'app';
import BrowserWindow from 'browser-window';
import yargs from 'yargs';
var lib;

const electron = require('electron');
const Tray = electron.Tray;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
var contextMenu = new Menu();

const args = yargs(process.argv.slice(1)).wrap(100).argv;

/* Some usefull chrome args */
app.commandLine.appendSwitch('v', -1);
app.commandLine.appendSwitch('vmodule', 'console=0');
app.commandLine.appendSwitch('disable-speech-api');

app.dock.hide()

app.on('ready', () => {
    var appIcon = new Tray('icon.png');
    appIcon.setContextMenu(contextMenu);
    lib = require('./lib');
    lib.on("deviceFound", function (host, devicename) {
        contextMenu.append(new MenuItem({ label: 'MenuItem2', type: 'checkbox', click: function () {
            lib.stream(host);
        }}));
        appIcon.setContextMenu(contextMenu);
    });
});

app.on('window-all-closed', app.quit);