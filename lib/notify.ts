import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendNotifications(p: {
  type: string
  name: string
  group?: string
  side?: string
  message?: string
  status?: string
}) {
  const isRsvp = p.type === 'rsvp'
  const confirmed = p.status === 'confirmed'

  const subject = isRsvp
    ? (confirmed ? 'RSVP Confirme' : 'RSVP Decline') + ' - ' + p.name + (p.group ? ' (' + p.group + ')' : '')
    : 'Nouveau message - ' + p.name

  const bodyContent = isRsvp
    ? '<h3 style="color:#0047AB">' + (confirmed ? 'Presence confirmee' : 'Invitation declinee') + '</h3>' +
      '<p><strong>Nom :</strong> ' + p.name + '</p>' +
      (p.group ? '<p><strong>Groupe :</strong> ' + p.group + ' (cote ' + (p.side === 'marie' ? 'Marie' : 'Mariee') + ')</p>' : '') +
      '<p><strong>Date :</strong> Vendredi 31 Juillet 2026</p>' +
      '<p><strong>Lieu :</strong> Peter Metam, Bandjoun</p>' +
      '<br><p style="color:#666;font-size:0.85rem">Transferer a : romualdmyo@gmail.com et leticianoumsi54@yahoo.com</p>'
    : '<h3 style="color:#0047AB">Nouveau message dans le livre d or</h3>' +
      '<p><strong>De :</strong> ' + p.name + '</p>' +
      '<blockquote style="border-left:4px solid #0047AB;padding-left:1rem;margin:1rem 0;font-style:italic;color:#333">' + p.message + '</blockquote>' +
      '<br><p style="color:#666;font-size:0.85rem">Transferer a : romualdmyo@gmail.com et leticianoumsi54@yahoo.com</p>'

  const html = '<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:2rem;background:#e8f0fb;border-radius:16px;">' +
    '<div style="text-align:center;margin-bottom:1.5rem">' +
    '<h2 style="color:#0047AB;font-size:1.5rem;margin:0">Mariage Ingrid et Ulrich</h2>' +
    '<p style="color:#666;font-size:0.85rem;margin:.3rem 0">31 Juillet 2026 - Peter Metam, Bandjoun</p>' +
    '</div>' +
    '<div style="background:#fff;border-radius:12px;padding:1.5rem;box-shadow:0 2px 12px rgba(0,71,171,0.1)">' +
    bodyContent +
    '</div>' +
    '</div>'

  console.log('No email - using Google Sheets')
}

