
import { config } from '../../config.js'
import { getSock } from '../client.js'
import {
  updateComplaintNotification,
  updateComplaintInternalMessageId,
} from '../../db/queries/activity.js'
import type { ComplaintRow } from '../../db/schema.js'

/**
 * Send a detected complaint to the internal WhatsApp group.
 * Automatic sending remains disabled unless explicitly enabled.
 */
export async function notifyComplaint(
  complaint: ComplaintRow,
): Promise<void> {
  // Safety switch: do not send unless explicitly enabled.
  if (!config.complaintAutoNotify) {
    updateComplaintNotification(complaint.id, 'disabled')
    console.info('[Complaint] Automatic WhatsApp notification is disabled.')
    return
  }

  const message = [
    '🚨 *NEW RESIDENT COMPLAINT*',
    '',
    `📍 Flat: ${complaint.flatNumber || 'Not provided'}`,
    `📂 Category: ${complaint.category.replace(/_/g, ' ')}`,
    `⚠️ Priority: ${complaint.priority.toUpperCase()}`,
    `📝 Summary: ${complaint.summary}`,
    '',
    '*Original resident message:*',
    complaint.messageText,
    '',
    `🕒 Received: ${new Date(complaint.sourceTimestamp * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
    `🔖 Complaint ID: ${complaint.id}`,
  ].join('\n')

  try {
    const sock = getSock()

    // Send notification and capture its WhatsApp message ID.
    const sentMessage = await sock.sendMessage(
      config.internalGroupJid,
      { text: message },
    )

    const internalMessageId = sentMessage?.key?.id

    if (!internalMessageId) {
      throw new Error('WhatsApp notification sent but message ID was not returned')
    }

    // Link the internal notification to the original complaint.
    updateComplaintInternalMessageId(
      complaint.id,
      internalMessageId,
    )

    updateComplaintNotification(complaint.id, 'sent')

    console.info(
      '[Complaint] Internal WhatsApp notification sent:',
      complaint.id,
      'Message ID:',
      internalMessageId,
    )
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message.slice(0, 500)
      : 'Unknown WhatsApp notification error'

    updateComplaintNotification(
      complaint.id,
      'failed',
      errorMessage,
    )

    console.error('[Complaint] WhatsApp notification failed:', error)
  }
}
