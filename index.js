const { app, BrowserWindow } = require('electron')
const path = require('path')

var mainWindow = null;
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nodeIntegrationInWorker: true,
            allowRunningInsecureContent: true
        }
    })
    mainWindow.loadFile('www/index.html')
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})