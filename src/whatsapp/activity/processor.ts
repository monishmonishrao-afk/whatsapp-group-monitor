
import type { ActivityEventType } from '../../db/schema.js'
import { config } from '../../config.js'
import { detectComplaint } from './complaint-detector.js'
import { insertComplaint } from '../../db/queries/activity.js'

export interface ProcessableRecord {
  groupJid: string
  userJid: string
  messageId: string
  eventType: ActivityEventType
  metadata: Record<string, unknown> | null
  timestamp: number
}

/** Process a single activity record for complaint detection. */
export function processRecord(record: ProcessableRecord): void {
  // Only monitor the designated residents' WhatsApp group.
  if (record.groupJid !== config.residentsGroupJid) return

  // Only classify ordinary messages, not reactions or other events.
  if (record.eventType !== 'message') return

  const messageText = record.metadata?.text

  if (typeof messageText !== 'string' || !messageText.trim()) return

  // Run AI classification without blocking WhatsApp message handling.
  void (async () => {
    try {
      const result = await detectComplaint(messageText)

      if (!result) return

      const inserted = insertComplaint({
        sourceGroupJid: record.groupJid,
        sourceMessageId: record.messageId,
        residentJid: record.userJid,
        sourceTimestamp: record.timestamp,
        messageText: messageText.trim(),
        category: result.category,
        priority: result.priority,
        summary: result.summary,
        flatNumber: result.flatNumber,
        confidence: result.confidence,
        status: 'open',
        notificationStatus: 'pending',
      })

      if (inserted) {
        console.info('[Complaint] New complaint saved:', {
          category: result.category,
          priority: result.priority,
          messageId: record.messageId,
        })
      }
    } catch (error) {
      console.error('[Complaint] Processing failed:', error)
    }
  })()
}
