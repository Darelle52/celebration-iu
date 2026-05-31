import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendNotifications({
  type, name, group, side, message, status
}: {
  type: 'rsvp' | 'message'
  name: string
  group?: string
  side?: string
  message?: string
  status?: 'confirmed' | 'declined'
}) {
  // Resend free tier: send to verified email, CC to mariés
  const emails = ['simodarel5@gmail.com']
  const phones = [process.env.NOTIFY_WHATSAPP_1!, process.env.NOTIFY_WHATSAPP_2!]

  const isRsvp = type === 'rsvp'
  const confirmed = status === 'confirmed'
  const emoji = isRsvp ? (confirmed ? '✅' : '❌') : '💬'

  const subject = isRsvp
    ? `${emoji} RSVP — ${name} a ${confirmed ? 'confirmé' : 'décliné'}${group ? ` (${group})` : ''}`
    : `${emoji} Livre d'or — Message de ${name}`

  const htmlBody = isRsvp
    ? `<p><strong>${name}</strong> a <strong>${confirmed ? 'confirmé sa présence' : 'décliné'}</strong>.</p>
       ${group ? `<p>Groupe : <strong>${group}</strong> (côté ${side === 'marie' ? 'Marié' : 'Mariée'})</p>` : ''}
       <p>📅 Vendredi 31 Juillet 2026 — Peter Metam, Bandjoun</p>`
    : `<p><strong>${name}</strong> a laissé un message :</p>
       <blockquote style="border-left:3px solid #2563a8;padding-left:1rem;font-style:italic;color:#333">${message}</blockquote>`

  const whatsappBody = isRsvp
    ? `💍 *Mariage Ingrid & Ulrich*\n\n${confirmed ? '✅' : '❌'} *${name}* a ${confirmed ? 'confirmé sa présence' : 'décliné'}.\n${group ? `👥 Groupe : ${group} (${side === 'marie' ? 'Marié' : 'Mariée'})\n` : ''}\n📅 31 Juillet 2026 — Bandjoun`
    : `💬 *Livre d'or — Ingrid & Ulrich*\n\n*${name}* écrit :\n_"${message}"_`

  // Send emails to both
  for (const email of emails) {
    try {
      await resend.emails.send({
        from: 'Mariage Ingrid & Ulrich <onboarding@resend.dev>',
        to: email,
        cc: ['romualdmyo@gmail.com', 'leticianoumsi54@yahoo.com'],
        subject,
        html: `<div style="font-family:Georgia,serif;max-width:500px;margin:0 auto;padding:2rem;background:#eef5fb;border-radius:16px;">
          <h2 style="color:#0047AB">💍 Ingrid & Ulrich — 31 Juillet 2026</h2>
          <p style="color:#666;font-size:0.8rem">Destinataires : leticianoumsi54@yahoo.com · romuldich@gmail.com</p>
          ${htmlBody}
        </div>`
      })
    } catch (e) { console.error('Email error:', email, e) }
  }

  // Send WhatsApp to both via Twilio
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM
  if (sid && token && from) {
    for (const phone of phones) {
      try {
        const creds = Buffer.from(`${sid}:${token}`).toString('base64')
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
          method: 'POST',
          headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ From: from, To: `whatsapp:${phone}`, Body: whatsappBody })
        })
      } catch (e) { console.error('WhatsApp error:', phone, e) }
    }
  }
}
