
import { config } from '../../config.js'
import { getSock } from '../client.js'
import {
  getComplaintByInternalMessageId,
  updateComplaintStatus,
} from '../../db/queries/activity.js'
import type { ComplaintRow } from '../../db/schema.js'

interface TeamUpdate {
  status: ComplaintRow['status']
  message: string
}

function getTeamUpdate(text: string): TeamUpdate | null {
  const normalized = text.trim().toUpperCase()

  if (
    /^(OK|OK SIR|NOTED|ACKNOWLEDGED|ACK|👍|👍🏻|👍🏼|👍🏽|👍🏾|👍🏿)[.! ]*$/.test(normalized)
  ) {
    return {
      status: 'open',
      message: 'Your complaint has been acknowledged by our Facility Management (FM) team. They will arrange to resolve it soon.',
    }
  }

  if (/^(WORKING|WORKING ON IT|IN PROGRESS)[.! ]*$/.test(normalized)) {
    return {
      status: 'in_progress',
      message: 'Our Facility Management (FM) team is working on your complaint. We will keep you updated.',
    }
  }

  if (/^(DOOR LOCK|DOOR LOCKED)[.! ]*$/.test(normalized)) {
    return {
      status: 'in_progress',
      message: 'Our Facility Management (FM) team has noted the door-lock issue and is working on it.',
    }
  }

  if (/^(COMPLETED|WORK COMPLETE|WORK COMPLETED|DONE)[.! ]*$/.test(normalized)) {
    return {
      status: 'resolved',
      message: 'The Facility Management (FM) team has reported that the work on your complaint has been completed.',
    }
  }

  if (/^(ON HOLD|HOLD)[.! ]*$/.test(normalized)) {
    return {
      status: 'open',
      message: 'Your complaint is temporarily on hold with our Facility Management (FM) team. We will update you when work resumes.',
    }
  }

  return null
}

/**
 * Process a team reply or reaction to an original complaint notification.
 * Only quoted replies/reactions matching a saved notification are accepted.
 */
export async function handleTeamReply(
  groupJid: string,
  userJid: string,
  parentId: string | null,
  eventType: string,
  metadata: Record<string, unknown> | null,
): Promise<void> {
  if (groupJid !== config.internalGroupJid) return

  // Ignore reactions made by the bot itself.
  if (eventType === 'reaction' && userJid === 'self') return

  if (!parentId) return

  let update: TeamUpdate | null = null

  if (eventType === 'reaction') {
    const emoji = metadata?.emoji

    if (!['👍', '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿'].includes(String(emoji))) return

    update = {
      status: 'open',
      message: 'Your complaint has been acknowledged by our Facility Management (FM) team. They will arrange to resolve it soon.',
    }
  } else if (eventType === 'message') {
    const text = metadata?.text

    if (typeof text !== 'string' || !text.trim()) return

    update = getTeamUpdate(text)
  } else {
    return
  }

  if (!update) return

  const complaint = getComplaintByInternalMessageId(parentId)

  if (!complaint) return

  try {
    updateComplaintStatus(complaint.id, update.status)

    const sock = getSock()

    await sock.sendMessage(complaint.residentJid, {
      text: [
        '📢 *Complaint Status Update*',
        '',
        `Complaint ID: ${complaint.id}`,
        `Flat: ${complaint.flatNumber || 'Not provided'}`,
        '',
        update.message,
        '',
        'Regards,',
        'Property Management Team',
      ].join('\n'),
    })

    console.info('[Complaint] Private resident update sent:', {
      complaintId: complaint.id,
      status: update.status,
    })
  } catch (error) {
    console.error(
      '[Complaint] Team reply processing failed:',
      complaint.id,
      error,
    )
  }
}
