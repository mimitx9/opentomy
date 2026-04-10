import { ipcMain } from 'electron'
import keytar from 'keytar'

const SERVICE = 'com.opentomy.desktop'
const ACCOUNT = 'session'

export function registerAuthIPC() {
  ipcMain.handle('auth:get-session', async () => {
    const token = await keytar.getPassword(SERVICE, ACCOUNT)
    return token
  })

  ipcMain.handle('auth:set-session', async (_event, token: string) => {
    await keytar.setPassword(SERVICE, ACCOUNT, token)
    return true
  })

  ipcMain.handle('auth:clear-session', async () => {
    await keytar.deletePassword(SERVICE, ACCOUNT)
    return true
  })
}
