import { config } from '../../config.js'
import { getSock } from '../client.js'
import type { ComplaintRow } from '../../db/schema.js'

/**
 * Acknowledge a newly recorded resident complaint.
 */
export async function acknowledgeResident(
  complaint: ComplaintRow,
): Promise<void> {
  const message = [
    '🙏 Dear Resident,',
    '',
    'Thank you for bringing this to our attention.',
    'Your complaint has been forwarded to our Facility Management (FM) team.',
    'They will look into the issue and arrange to have it resolved at the earliest.',
    '',
    'We appreciate your patience and understanding.',
    '',
    'Regards,',
    'Property Management Team',
  ].join('\n')

  try {
    const sock = getSock()

    await sock.sendMessage(config.residentsGroupJid, {
      text: message,
    })

    console.info(
      '[Complaint] Resident acknowledgement sent:',
      complaint.id,
    )
  } catch (error) {
    console.error(
      '[Complaint] Resident acknowledgement failed:',
      complaint.id,
      error,
    )
  }
}
