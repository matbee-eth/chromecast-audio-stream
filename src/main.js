
const electron = require('electron')
// Module to control application life.
const app = electron.app

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
import {
    Tray, Menu, MenuItem
}
from 'electron';
var lib;


var contextMenu = new Menu();
contextMenu.append(new MenuItem({
    type: 'separator'
}));

contextMenu.append(new MenuItem({
    type: 'normal',
    label: 'Close',
    click: () => {
        lib.quit();
        app.quit();
    }
}));
// contextMenu.append(
//     new MenuItem({
//         label: 'Toggle Developer Tools',
//         accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
//         click (item, focusedWindow) {
//             console.info(item, focusedWindow);
//             if (focusedWindow) focusedWindow.webContents.toggleDevTools();
//         }
//     })
// );

/* Some usefull chrome args */
app.commandLine.appendSwitch('v', -1);
app.commandLine.appendSwitch('vmodule', 'console=0');
app.commandLine.appendSwitch('disable-speech-api');

app.on('ready', () => {
    lib = require('./lib');
    console.info(process.cwd())
    const appIcon = new Tray('cast.png');
    appIcon.on('click', function(ev, bounds) {
        console.info(bounds);
       appIcon.popUpContextMenu(contextMenu, {x: bounds.x, y: bounds.y-bounds.height});
    });
    appIcon.on('right-click', function (ev, bounds) {
        console.info(ev, bounds);
       appIcon.popUpContextMenu(contextMenu, {x: bounds.x, y: bounds.y-(bounds.height*2)});
    })
    lib.on("deviceFound", (host, devicename) => {
        console.log(host, devicename);
        contextMenu.insert(0, new MenuItem({
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