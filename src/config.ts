
import { resolve } from 'path'
import crypto from 'crypto'

export const config = {
  dataDir: process.env.DATA_DIR || resolve('data'),

  get authDir() {
    return resolve(this.dataDir, 'auth')
  },

  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',

  logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',

  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  sessionSecret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),

  // Complaint monitoring configuration
  openaiApiKey: process.env.OPENAI_API_KEY || '',

  residentsGroupJid:
    process.env.RESIDENTS_GROUP_JID || '120363430960950981@g.us',

  internalGroupJid:
    process.env.INTERNAL_GROUP_JID || '120363431035143319@g.us',

  complaintConfidenceThreshold: Number(
    process.env.COMPLAINT_CONFIDENCE_THRESHOLD || '75'
  ),
}
