import app from 'app';
import BrowserWindow from 'browser-window';
import yargs from 'yargs';
import {
    Tray, Menu, MenuItem
}
from 'electron';
import lib from './lib';



const args = yargs(process.argv.slice(1)).wrap(100).argv;
var contextMenu = new Menu();

/* Some usefull chrome args */
app.commandLine.appendSwitch('v', -1);
app.commandLine.appendSwitch('vmodule', 'console=0');
app.commandLine.appendSwitch('disable-speech-api');



app.on('ready', () => {
    
    const appIcon = new Tray('icon.png');
    
    lib.on("deviceFound", (host, devicename) => {
        console.log(host, devicename);
        contextMenu.append(new MenuItem({
            label: devicename,
            type: 'checkbox',
            click: () => {
                lib.stream(host);
            }
        }));
        appIcon.setContextMenu(contextMenu);
    });

});

app.on('window-all-closed', app.quit);