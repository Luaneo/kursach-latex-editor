import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  // Explicitly scan server directories
  scanDirs: [
    'server/api',
    'server/routes',
  ],
})

