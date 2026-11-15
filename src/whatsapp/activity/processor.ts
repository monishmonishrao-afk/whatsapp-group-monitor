
import type { ActivityEventType } from '../../db/schema.js'
import { config } from '../../config.js'
import { detectComplaint } from './complaint-detector.js'
import { insertComplaint } from '../../db/queries/activity.js'
import { notifyComplaint } from './complaint-notifier.js'

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
  if (record.groupJid !== config.residentsGroupJid) return
  if (record.eventType !== 'message') return

  const messageText = record.metadata?.text

  if (typeof messageText !== 'string' || !messageText.trim()) return

  void (async () => {
    try {
      const result = await detectComplaint(messageText)

      if (!result) return

      const savedComplaint = insertComplaint({
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

      if (!savedComplaint) return

      console.info('[Complaint] New complaint saved:', {
        id: savedComplaint.id,
        category: result.category,
        priority: result.priority,
        messageId: record.messageId,
      })

      await notifyComplaint(savedComplaint)
    } catch (error) {
      console.error('[Complaint] Processing failed:', error)
    }
  })()
}
