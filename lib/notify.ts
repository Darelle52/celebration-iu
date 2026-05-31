import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendNotifications(p: any) {
  try {
    await resend.emails.send({ from: 'Mariage IU <onboarding@resend.dev>', to: 'simodarel5@gmail.com', subject: 'RSVP - ' + p.name, html: '<p>' + p.name + ' a confirme</p>' })
    console.log('Email sent OK')
  } catch (e) { console.error('Email error:', e) }
}
