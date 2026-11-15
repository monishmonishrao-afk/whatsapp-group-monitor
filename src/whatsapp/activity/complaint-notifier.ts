
import { config } from '../../config.js'
import { getSock } from '../client.js'
import { updateComplaintNotification } from '../../db/queries/activity.js'
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

    await sock.sendMessage(config.internalGroupJid, {
      text: message,
    })

    updateComplaintNotification(complaint.id, 'sent')

    console.info('[Complaint] Internal WhatsApp notification sent:', complaint.id)
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
