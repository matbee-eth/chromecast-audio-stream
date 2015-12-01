import app from 'app';
import BrowserWindow from 'browser-window';
import yargs from 'yargs';

const args = yargs(process.argv.slice(1)).wrap(100).argv;
console.log('test')

/* Some usefull chrome args */
app.commandLine.appendSwitch('v', -1);
app.commandLine.appendSwitch('vmodule', 'console=0');
app.commandLine.appendSwitch('disable-speech-api');



app.on('ready', () => {

    var mainWindow = new BrowserWindow({
        center: true,
        frame: true,
        show: false
    });

    if (args.dev) {
        mainWindow.show();
        mainWindow.toggleDevTools();
        mainWindow.focus();
        console.info('Dev Mode Active: Developer Tools Enabled.');
    }

    mainWindow.on('close', app.quit);

});

app.on('window-all-closed', app.quit);