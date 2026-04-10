import type { Configuration } from 'electron-builder'

const config: Configuration = {
  appId: 'com.opentomy.desktop',
  productName: 'Opentomy',
  asar: true,
  directories: {
    output: 'release',
    buildResources: 'resources',
  },
  files: [
    'dist-electron/**/*',
    'dist/**/*',
  ],
  fileAssociations: [
    {
      ext: 'optmy',
      name: 'Opentomy Quiz File',
      description: 'Opentomy encrypted quiz file',
      role: 'Viewer',
    },
  ],
  protocols: [
    {
      name: 'Opentomy',
      schemes: ['optmy'],
    },
  ],
  mac: {
    category: 'public.app-category.education',
    target: [
      { target: 'dmg', arch: ['x64', 'arm64'] },
      { target: 'zip', arch: ['x64', 'arm64'] },
    ],
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'resources/entitlements.mac.plist',
  },
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
  },
  linux: {
    target: [{ target: 'AppImage', arch: ['x64'] }],
    category: 'Education',
  },
  publish: {
    provider: 's3',
    bucket: process.env.UPDATE_S3_BUCKET ?? 'opentomy-updates',
    region: process.env.S3_REGION ?? 'us-east-1',
  },
}

export default config
