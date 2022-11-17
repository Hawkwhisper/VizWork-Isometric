const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')

//hold the array of directory paths selected by user

let dir;

ipcMain.on('selectDirectory', function () {
});

const template = [
    // { role: 'appMenu' }
    {
        label: 'File',
        submenu: [
            {
                label: "Load Project",
                click: async () => {
                    dir = dialog.showOpenDialog(mainWindow, {
                        properties: ['openDirectory']
                    }).then(d => {
                        mainWindow.webContents.send(`proj`, d);
                    });
                }
            },
            {
                label: "Image Slicer",
                click: async () => {
                    dir = dialog.showOpenDialog(mainWindow, {
                        properties: ['openFile'],
                        filters: [
                            {
                                name: "Images",
                                extensions: ["png"]
                            }
                        ]
                    }).then(d => {
                        mainWindow.webContents.send(`img_slc`, d);
                    });
                }
            },
            { role: "close" }
        ]
    },
    // { role: 'editMenu' }
    {
        label: 'Export',
        submenu: [
            {
                label: "As Image",
                click: async () => {
                    mainWindow.webContents.send(`img_export`);
                }
            },
        ]
    },
    // { role: 'viewMenu' }
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    // { role: 'windowMenu' }
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            { role: 'close' }
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: async () => {
                    const { shell } = require('electron')
                    await shell.openExternal('https://electronjs.org')
                }
            }
        ]
    }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

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