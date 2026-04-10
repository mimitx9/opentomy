/**
 * Preload script — runs in renderer context with access to Node APIs.
 * Uses contextBridge to expose a safe, limited API to the renderer.
 *
 * Security: APP_MASTER_KEY is NEVER exposed here.
 * All crypto happens in main process via IPC.
 */
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('optmy', {
  // Auth
  getSession: () => ipcRenderer.invoke('auth:get-session'),
  setSession: (token: string) => ipcRenderer.invoke('auth:set-session', token),
  clearSession: () => ipcRenderer.invoke('auth:clear-session'),

  // File operations
  openFileDialog: () => ipcRenderer.invoke('file:open-dialog'),
  readFileHeader: (path: string) => ipcRenderer.invoke('file:read-header', path),
  readFileBuffer: (path: string) => ipcRenderer.invoke('file:read-buffer', path),

  // Decryption (happens in main process — renderer never sees master key)
  executeDecrypt: (fileBase64: string, decryptToken: string) =>
    ipcRenderer.invoke('decrypt:execute', fileBase64, decryptToken),

  // Events from main process
  onFileOpened: (callback: (path: string) => void) => {
    ipcRenderer.on('file:opened', (_event, path) => callback(path))
    return () => ipcRenderer.removeAllListeners('file:opened')
  },
  onProtocolOpen: (callback: (fileId: string) => void) => {
    ipcRenderer.on('protocol:open', (_event, fileId) => callback(fileId))
    return () => ipcRenderer.removeAllListeners('protocol:open')
  },
})

// TypeScript declaration
declare global {
  interface Window {
    optmy: {
      getSession: () => Promise<string | null>
      setSession: (token: string) => Promise<boolean>
      clearSession: () => Promise<boolean>
      openFileDialog: () => Promise<string | null>
      readFileHeader: (path: string) => Promise<{ path: string; header: unknown; flags: number; version: number } | null>
      readFileBuffer: (path: string) => Promise<string>
      executeDecrypt: (fileBase64: string, decryptToken: string) => Promise<{ header: unknown; payload: unknown }>
      onFileOpened: (cb: (path: string) => void) => () => void
      onProtocolOpen: (cb: (fileId: string) => void) => () => void
    }
  }
}
