
import { mkdirSync } from 'fs'
import { config } from './config.js'
import { logger } from './utils/logger.js'
import { initSharedDb } from './db/shared.js'
import { initAccountDb } from './db/account.js'
import { startConnection } from './whatsapp/client.js'
import { startWebServer } from './web/server.js'

async function main() {
  const dashboardOnly = process.env.DASHBOARD_ONLY === 'true'

  if (!dashboardOnly) {
    mkdirSync(config.authDir, { recursive: true })
  }

  logger.info('Starting WhatsApp Group Monitor...')

  initSharedDb()
  await startWebServer()

  if (dashboardOnly) {
    initAccountDb('dashboard-test')
    logger.info('Dashboard-only mode: WhatsApp connection disabled')
    return
  }

  await startConnection()
}

main().catch((err) => {
  logger.fatal(err, 'Failed to start')
  process.exit(1)
})
