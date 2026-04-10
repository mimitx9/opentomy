import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFile } from 'fs/promises'
import { parseOptmyBuffer } from '@opentomy/crypto'

export function registerFileHandlerIPC() {
  // Open file picker dialog
  ipcMain.handle('file:open-dialog', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Open Quiz File',
      filters: [{ name: 'Opentomy Quiz', extensions: ['optmy'] }],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // Read file and return header (plaintext, no decryption)
  ipcMain.handle('file:read-header', async (_event, filePath: string) => {
    const buffer = await readFile(filePath)
    const parsed = parseOptmyBuffer(buffer.buffer)
    return {
      path: filePath,
      header: parsed.header,
      flags: parsed.flags,
      version: parsed.version,
    }
  })

  // Read raw file buffer (used before decryption)
  ipcMain.handle('file:read-buffer', async (_event, filePath: string) => {
    const buffer = await readFile(filePath)
    // Return as base64 string (safe to send over IPC)
    return buffer.toString('base64')
  })
}
