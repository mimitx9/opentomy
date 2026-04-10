import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import { registerFileHandlerIPC } from './ipc/file-handler'
import { registerAuthIPC } from './ipc/auth'
import { registerDecryptIPC } from './ipc/decrypt'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    title: 'Opentomy',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

// Register custom protocol
app.setAsDefaultProtocolClient('optmy')

app.whenReady().then(() => {
  createWindow()
  registerFileHandlerIPC()
  registerAuthIPC()
  registerDecryptIPC()

  // Handle .optmy file open on macOS (open-file event)
  app.on('open-file', (event, path) => {
    event.preventDefault()
    mainWindow?.webContents.send('file:opened', path)
  })

  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

// Handle optmy:// protocol URL
app.on('open-url', (event, url) => {
  event.preventDefault()
  const fileId = url.replace('optmy://', '')
  mainWindow?.webContents.send('protocol:open', fileId)
})
