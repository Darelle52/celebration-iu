import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendNotifications } from '@/lib/notify'

export async function POST(req: NextRequest) {
  try {
    const { name, family, message } = await req.json()
    if (!name || !message) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

    const author = family ? `${name} — ${family}` : name
    const db = supabaseAdmin()
    const { data, error } = await db.from('messages').insert({ name, family, author, message }).select().single()
    if (error) throw error

    await sendNotifications({ type: 'message', name: author, message })
    return NextResponse.json({ success: true, message: data })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const db = supabaseAdmin()
    const { data, error } = await db.from('messages').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ messages: data })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
