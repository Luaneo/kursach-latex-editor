import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  // Scan server directory for API routes
  scanDirs: ['server'],
  // Enable CORS for frontend
  routeRules: {
    '/**': {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    },
  },
  // Development server configuration
  devServer: {
    port: 3001,
  },
})

