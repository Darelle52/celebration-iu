import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendNotifications } from '@/lib/notify'

export async function POST(req: NextRequest) {
  try {
    const { name, status, group_name, side } = await req.json()
    if (!name || !status) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

    const db = supabaseAdmin()
    const { error } = await db.from('rsvps').insert({ name, status, group_name, side })
    if (error) throw error

    await sendNotifications({ type: 'rsvp', name, group: group_name, side, status })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const db = supabaseAdmin()
    const { data, error } = await db.from('rsvps').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({
      rsvps: data,
      confirmed: data.filter(r => r.status === 'confirmed').length,
      declined: data.filter(r => r.status === 'declined').length,
      total: data.length
    })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
