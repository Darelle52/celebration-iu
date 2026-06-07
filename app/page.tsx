'use client'
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'

const GROOM_GROUPS = [
  { name: "Amis et connaissances", bg: "#2E7D32", fg: "#fff" },
  { name: "Famille",               bg: "#C62828", fg: "#fff" },
  { name: "Invités des parents",   bg: "#F9A825", fg: "#fff" },
  { name: "Moniteurs",             bg: "#1565C0", fg: "#fff" },
  { name: "Troupe Théâtrale",      bg: "#E65100", fg: "#fff" },
]

const BRIDE_GROUPS = [
  { name: "Amis et connaissances", bg: "#AD1457", fg: "#fff" },
  { name: "Collègues",             bg: "#6A1B9A", fg: "#fff" },
  { name: "Familles",              bg: "#4E342E", fg: "#fff" },
  { name: "Invité des parents",    bg: "#00838F", fg: "#fff" },
  { name: "Reunion",               bg: "#BF360C", fg: "#fff" },
]

type Msg = { id: string; author: string; message: string; created_at: string }
type RsvpState = 'idle' | 'confirmed' | 'declined'

function useCountdown(target: Date) {
  const [diff, setDiff] = useState(target.getTime() - Date.now())
  useEffect(() => {
    const id = setInterval(() => setDiff(target.getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [target])
  const d = Math.max(0, diff)
  return {
    days:  String(Math.floor(d / 86400000)).padStart(2, '0'),
    hours: String(Math.floor((d % 86400000) / 3600000)).padStart(2, '0'),
    mins:  String(Math.floor((d % 3600000) / 60000)).padStart(2, '0'),
    secs:  String(Math.floor((d % 60000) / 1000)).padStart(2, '0'),
  }
}

export default function Home() {
  const { days, hours, mins, secs } = useCountdown(new Date('2026-07-31T09:00:00'))
  const [rsvpName, setRsvpName] = useState('')
  const [activeSide, setActiveSide] = useState<'marie'|'mariee'|null>(null)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [rsvpState, setRsvpState] = useState<RsvpState>('idle')
  const [confirmedData, setConfirmedData] = useState<{name:string;group:string;side:string;bg:string;fg:string}|null>(null)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [msgText, setMsgText] = useState('')
  const [msgName, setMsgName] = useState('')
  const [msgFam, setMsgFam] = useState('')
  const [msgLoading, setMsgLoading] = useState(false)
  const [toast, setToast] = useState({ msg: '', show: false })
  const [musicPlaying, setMusicPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastRef = useRef<ReturnType<typeof setTimeout>>()

  const toggleMusic = () => {
    if (!audioRef.current) {
      const audio = new Audio('/music/goodness-compressed.mp3')
      audio.currentTime = 0 // Start at 1min 10s
      audio.loop = true
      audio.volume = 0.4
      audioRef.current = audio
    }
    if (musicPlaying) {
      audioRef.current.pause()
      setMusicPlaying(false)
    } else {
      audioRef.current.play()
      setMusicPlaying(true)
    }
  }

  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current)
    setToast({ msg, show: true })
    toastRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200)
  }

  const fetchMsgs = async () => {
    try {
      const r = await fetch('/api/messages')
      const d = await r.json()
      if (d.messages) setMessages(d.messages)
    } catch {}
  }

  useEffect(() => {
    fetchMsgs()
    const id = setInterval(fetchMsgs, 15000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const toggleSide = (side: 'marie' | 'mariee') => {
    if (activeSide === side) { setActiveSide(null); setSelectedGroup('') }
    else { setActiveSide(side); setSelectedGroup('') }
  }

  const handleConfirm = async () => {
    if (!rsvpName.trim()) { showToast('Veuillez entrer votre nom 😊'); return }
    if (!activeSide || !selectedGroup) { showToast('Veuillez sélectionner votre groupe 😊'); return }
    setRsvpLoading(true)
    const list = activeSide === 'marie' ? GROOM_GROUPS : BRIDE_GROUPS
    const g = list.find(x => x.name === selectedGroup)!
    try {
      await fetch('/api/rsvp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: rsvpName.trim(), status: 'confirmed', group_name: selectedGroup, side: activeSide })
      })
      setConfirmedData({ name: rsvpName.trim(), group: selectedGroup, side: activeSide, bg: g.bg, fg: g.fg })
      setRsvpState('confirmed')
      showToast('Présence confirmée ! 🎉')
    } catch { showToast('Erreur, réessayez') }
    finally { setRsvpLoading(false) }
  }

  const handleDecline = async () => {
    await fetch('/api/rsvp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: rsvpName.trim() || 'Invité(e)', status: 'declined' })
    }).catch(() => {})
    setRsvpState('declined')
    showToast('Merci pour votre réponse 💙')
  }

  const handleSendMsg = async () => {
    if (!msgText.trim() || !msgName.trim()) { showToast('Merci de remplir message et prénom 😊'); return }
    setMsgLoading(true)
    try {
      const r = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: msgName.trim(), family: '', message: msgText.trim() })
      })
      const d = await r.json()
      if (d.success) { setMsgText(''); setMsgName(''); setMsgFam(''); fetchMsgs(); showToast("Message envoyé au livre d'or ✉️") }
    } catch { showToast('Erreur, réessayez') }
    finally { setMsgLoading(false) }
  }

  const blue = '#0047AB', blueDark = '#003380', blueLight = '#e8f0fb', gold = '#C9A84C'
  const border = '#dce8f8', muted = '#5a6a7a', textColor = '#1a1a2e'

  const sectionTag = (label: string) => (
    <div style={{ fontSize: '.58rem', letterSpacing: '.25em', textTransform: 'uppercase' as const, color: gold, fontWeight: 600, marginBottom: '.8rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
      <span style={{ display: 'block', width: 20, height: 2, background: gold, borderRadius: 2 }} />
      {label}
    </div>
  )

  const sectionTitle = (text: React.ReactNode, dark = false) => (
    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,6vw,2.8rem)', fontWeight: 600, color: dark ? '#003380' : '#fff', lineHeight: 1.1, marginBottom: '1rem' }}>{text}</h2>
  )
  const sectionTagDark = (label: string) => (
    <div style={{ fontSize: '.58rem', letterSpacing: '.25em', textTransform: 'uppercase' as const, color: gold, fontWeight: 600, marginBottom: '.8rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
      <span style={{ display: 'block', width: 20, height: 2, background: gold, borderRadius: 2 }} />
      {label}
    </div>
  )
  const dividerDark = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', margin: '1.2rem 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,.3)' }} />
      <div style={{ width: 8, height: 8, background: gold, transform: 'rotate(45deg)', flexShrink: 0 }} />
      <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,.3)' }} />
    </div>
  )

  const divider = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', margin: '1.2rem 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,.4)' }} />
      <div style={{ width: 8, height: 8, background: gold, transform: 'rotate(45deg)', flexShrink: 0 }} />
      <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,.4)' }} />
    </div>
  )

  return (
    <>
      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, display: 'flex', justifyContent: 'center', gap: '1rem', padding: '.75rem 1rem', background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}`, flexWrap: 'wrap' as const }}>
        {[['#invitation','Accueil'],['#programme','Programme'],['#rsvp','Présence'],['#localisation','Lieu'],['#mots',"Livre d'or"]].map(([href, label]) => (
          <a key={href} href={href} style={{ textDecoration: 'none', color: blueDark, fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase' as const, fontWeight: 600, padding: '.3rem .5rem', borderRadius: 6 }}>{label}</a>
        ))}
      </nav>

      {/* HERO */}
       <section style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column' as const, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Image src="/hero.jpg" alt="Invitation Mariage" fill style={{ objectFit: 'contain', objectPosition: 'center center' }} priority />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(175deg,rgba(0,51,128,.6) 0%,rgba(0,71,171,.2) 40%,rgba(0,30,80,.92) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'flex-end', padding: '2rem 1.5rem 4rem', textAlign: 'center' as const, color: '#fff' }}>
          <div className="afu" style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', fontSize: '.6rem', letterSpacing: '.25em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.75)', marginBottom: '1.5rem', padding: '.4rem 1rem', border: '1px solid rgba(255,255,255,.25)', borderRadius: 50, background: 'rgba(255,255,255,.08)' }}>
            💍 Célébration de Mariage
          </div>
          <h1 className="afu1" style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(3rem,13vw,6rem)', fontWeight: 600, lineHeight: .92 }}>
            Ingrid
            <span style={{ fontStyle: 'italic', color: gold, display: 'block', fontSize: 'clamp(1.8rem,6vw,3rem)', margin: '.25rem 0', fontWeight: 400 }}>&amp;</span>
            Ulrich
          </h1>
          <p className="afu2" style={{ marginTop: '1.2rem', fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.7)', fontWeight: 300 }}>
            Vendredi 31 Juillet 2026 &nbsp;·&nbsp; Bandjoun
          </p>
        </div>
        <div className="abounce" style={{ position: 'absolute', bottom: '1.2rem', left: '50%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '.35rem', color: 'rgba(255,255,255,.45)', fontSize: '.55rem', letterSpacing: '.15em', textTransform: 'uppercase' as const, zIndex: 3 }}>
          <div style={{ width: 1, height: 30, background: 'linear-gradient(to bottom,rgba(255,255,255,.6),transparent)' }} />
          <span>Défiler</span>
        </div>
      </section>


      {/* HISTOIRE */}
      <section style={{ padding: '4rem 1.5rem', background: '#003380', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,.04), transparent 70%)' }} />
        <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 }} className="reveal">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-block', width: 40, height: 1, background: 'rgba(201,168,76,.6)', verticalAlign: 'middle', marginRight: '1rem' }} />
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '.75rem', letterSpacing: '.25em', textTransform: 'uppercase', color: '#C9A84C' }}>Notre Histoire</span>
            <div style={{ display: 'inline-block', width: 40, height: 1, background: 'rgba(201,168,76,.6)', verticalAlign: 'middle', marginLeft: '1rem' }} />
          </div>
          <div style={{ fontFamily: "'Playfair Display',serif", color: '#fff', lineHeight: 2, textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', fontStyle: 'italic', color: 'rgba(255,255,255,.7)', marginBottom: '1.5rem', letterSpacing: '.05em' }}>
              Un ami commun... Un simple message...<br />
              Une rencontre que rien ne laissait présager.
            </p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#C9A84C', marginBottom: '1.5rem', letterSpacing: '.05em' }}>
              Ce jour-là, le destin avait décidé de jouer.
            </p>
            <p style={{ fontSize: '.95rem', color: 'rgba(255,255,255,.85)', marginBottom: '1.5rem', lineHeight: 2 }}>
              De cette rencontre naquit une amitié,<br />
              De cette amitié émergea une complicité troublante,<br />
              De cette complicité... quelque chose que ni l'un ni l'autre<br />
              n'osait encore appeler par son nom.
            </p>
            <p style={{ fontSize: '1.6rem', fontWeight: 600, color: '#fff', marginBottom: '1.5rem', letterSpacing: '.1em' }}>
              L'amour.
            </p>
            <p style={{ fontSize: '.95rem', color: 'rgba(255,255,255,.85)', marginBottom: '1.5rem', lineHeight: 2 }}>
              Ils auraient pu l'ignorer.<br />
              <span style={{ color: '#C9A84C', fontStyle: 'italic' }}>Ils ont choisi de le vivre.</span>
            </p>
            <p style={{ fontSize: '.9rem', color: 'rgba(255,255,255,.75)', marginBottom: '1.5rem', lineHeight: 2 }}>
              Entre les joies qui unissent,<br />
              les peines qui forgent<br />
              et les difficultés qui révèlent,<br />
              grandir ensemble est devenu leur plus belle nécessité.
            </p>
            <div style={{ width: 60, height: 1, background: 'rgba(201,168,76,.4)', margin: '1.5rem auto' }} />
            <p style={{ fontSize: '.95rem', color: 'rgba(255,255,255,.85)', marginBottom: '1rem', lineHeight: 2 }}>
              Alors aujourd'hui, après tout ce chemin parcouru côte à côte,<br />
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>Ingrid & Ulrich</span> ont décidé de rendre éternel<br />
              ce qui a commencé par un simple message.
            </p>
            <p style={{ fontSize: '1rem', fontStyle: 'italic', color: '#C9A84C', marginTop: '1rem' }}>
              Et ils veulent que vous en soyez témoins.
            </p>
          </div>
        </div>
      </section>

      {/* INVITATION */}
      <section id="invitation" style={{ padding: '4rem 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }} className="reveal">
          {sectionTagDark('Bienvenue')}
          {sectionTitle(<>Cher(e) <em style={{ fontStyle: 'italic' }}>Invité(e)</em></>, true)}
          {dividerDark}
          <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
            <svg width="90" height="42" viewBox="0 0 90 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="21" r="18" stroke="#C9A84C" strokeWidth="3.5" fill="none"/>
              <circle cx="60" cy="21" r="18" stroke="#0047AB" strokeWidth="3.5" fill="none"/>
            </svg>
          </div>
          <p style={{ fontSize: '.88rem', lineHeight: 1.9, color: '#5a6a7a', fontWeight: 300 }}>
            Vous êtes cordialement invité(e) à la célébration de notre mariage et nous serons ravis de partager ce nouveau chapitre de notre vie avec ceux qui nous sont chers.
          </p>
        </div>
      </section>

      {/* DETAILS */}
      <section style={{ padding: '2rem 1.5rem 3.5rem', background: '#0047AB' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }} className="reveal">
          {[{ icon: '📅', label: 'Date', val: 'Vendredi\n31 Juillet 2026' }, { icon: '⏰', label: 'Heure', val: 'À partir\nde 9h00' }].map(({ icon, label, val }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 16, padding: '1.4rem 1rem', textAlign: 'center' as const, border: `1px solid ${border}`, boxShadow: '0 2px 16px rgba(0,71,171,.06)' }}>
              <div style={{ width: 42, height: 42, background: blueLight, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem', fontSize: '1.1rem' }}>{icon}</div>
              <div style={{ fontSize: '.55rem', letterSpacing: '.2em', textTransform: 'uppercase' as const, color: blue, fontWeight: 600, marginBottom: '.4rem' }}>{label}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.15rem', color: textColor, lineHeight: 1.3, whiteSpace: 'pre-line' as const }}>{val}</div>
            </div>
          ))}
          <div style={{ gridColumn: '1/-1', background: '#fff', borderRadius: 16, padding: '1.4rem 1rem', textAlign: 'center' as const, border: `1px solid ${border}`, boxShadow: '0 2px 16px rgba(0,71,171,.06)' }}>
            <div style={{ width: 42, height: 42, background: blueLight, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem', fontSize: '1.1rem' }}>📍</div>
            <div style={{ fontSize: '.55rem', letterSpacing: '.2em', textTransform: 'uppercase' as const, color: blue, fontWeight: 600, marginBottom: '.4rem' }}>Lieu</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.15rem', color: textColor, lineHeight: 1.3 }}>Pete Metam, Bandjoun</div>
          </div>
        </div>
      </section>

      {/* COUNTDOWN */}
      <section style={{ background: blue, padding: '3.5rem 1.5rem', textAlign: 'center' as const, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%,rgba(255,255,255,.06),transparent 60%)' }} />
        <p style={{ position: 'relative', fontSize: '.58rem', letterSpacing: '.25em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.55)', marginBottom: '2rem' }}>L'aventure commence dans…</p>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: '.5rem', flexWrap: 'wrap' as const }}>
          {[['Jours', days], ['Heures', hours], ['Min', mins], ['Sec', secs]].map(([label, val], i) => (
            <>
              {i > 0 && <div key={`sep${i}`} style={{ fontFamily: "'Playfair Display',serif", fontSize: '2.5rem', color: gold, alignSelf: 'center', opacity: .7, paddingBottom: '.5rem' }}>·</div>}
              <div key={label} style={{ minWidth: 72, background: 'rgba(255,255,255,.1)', borderRadius: 14, padding: '.8rem .5rem' }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(2.4rem,8vw,3.8rem)', fontWeight: 700, lineHeight: 1, color: '#fff' }}>{val}</div>
                <div style={{ fontSize: '.5rem', letterSpacing: '.15em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.5)', marginTop: '.3rem' }}>{label}</div>
              </div>
            </>
          ))}
        </div>
      </section>

      {/* PROGRAMME */}
      <section id="programme" style={{ padding: '4rem 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className="reveal">{sectionTagDark('Déroulement')}{sectionTitle('Programme', true)}{dividerDark}</div>
          <div className="reveal" style={{ marginTop: '1.5rem' }}>
            {[
              { icon: '🎉',  time: '10h00', name: 'La Dote',              desc: 'Célébration Traditionnelle.', last: false },
              { icon: '🏛️', time: '13h00', name: 'Cérémonie Civile',     desc: "Échange des vœux officiels.", last: false },
              { icon: '⛪',  time: '14h00', name: 'Cérémonie Religieuse', desc: "Bénédiction de l'union devant Dieu et nos proches.", last: true },
            ].map(({ icon, time, name, desc, last }) => (
              <div key={name} style={{ display: 'flex', gap: '1.1rem', paddingBottom: last ? 0 : '2rem', position: 'relative' }}>
                {!last && <div style={{ position: 'absolute', left: 19, top: 40, bottom: 0, width: 1, background: border }} />}
                <div style={{ flexShrink: 0, width: 40, height: 40, background: blue, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#fff', position: 'relative', zIndex: 1, boxShadow: '0 4px 14px rgba(0,71,171,.3)' }}>{icon}</div>
                <div>
                  <div style={{ fontSize: '.58rem', letterSpacing: '.15em', textTransform: 'uppercase' as const, color: gold, fontWeight: 600, marginBottom: '.25rem' }}>{time}</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.25rem', color: '#003380', fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: '.76rem', color: '#5a6a7a', marginTop: '.2rem', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RSVP */}
      <section id="rsvp" style={{ background: '#e8f0fb', padding: '4rem 1.5rem', '--section-color': '#003380', '--section-muted': '#5a6a7a' } as React.CSSProperties}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className="reveal"><div style={{ fontSize: '.58rem', letterSpacing: '.25em', textTransform: 'uppercase' as const, color: gold, fontWeight: 600, marginBottom: '.8rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <span style={{ display: 'block', width: 20, height: 2, background: gold, borderRadius: 2 }} />
              Confirmation
            </div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,6vw,2.8rem)', fontWeight: 600, color: '#003380', lineHeight: 1.1, marginBottom: '1rem' }}>Votre présence</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', margin: '1.2rem 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,.4)' }} />
              <div style={{ width: 8, height: 8, background: gold, transform: 'rotate(45deg)', flexShrink: 0 }} />
              <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,.4)' }} />
            </div></div>
          <div className="reveal" style={{ background: '#fff', borderRadius: 20, padding: '2rem 1.4rem', boxShadow: '0 4px 40px rgba(0,71,171,.1)', border: `1px solid ${border}`, marginTop: '1.5rem' }}>
            <p style={{ fontSize: '.76rem', color: '#5a6a7a', marginBottom: '1.3rem', textAlign: 'center' as const }}>Confirmez votre venue pour ce grand jour</p>
            {rsvpState === 'idle' && (
              <>
                <input value={rsvpName} onChange={e => setRsvpName(e.target.value)} placeholder="Votre nom complet…"
                  style={{ width: '100%', padding: '.85rem 1rem', border: `1.5px solid ${border}`, borderRadius: 12, fontSize: '.84rem', fontFamily: "'Inter',sans-serif", color: textColor, outline: 'none', marginBottom: '1rem', background: '#fff' }} />
                <p style={{ fontSize: '.58rem', letterSpacing: '.18em', textTransform: 'uppercase' as const, color: blue, fontWeight: 600, marginBottom: '.75rem', textAlign: 'center' as const }}>Je suis invité(e) du côté…</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem', marginBottom: '1rem' }}>
                  {(['marie', 'mariee'] as const).map(side => (
                    <div key={side} onClick={() => toggleSide(side)}
                      style={{ border: `2px solid ${activeSide === side ? blue : border}`, borderRadius: 14, padding: '.9rem .75rem', cursor: 'pointer', background: activeSide === side ? blueLight : '#fff', boxShadow: activeSide === side ? '0 2px 12px rgba(0,71,171,.12)' : 'none', WebkitUserSelect: 'none', userSelect: 'none' as const }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.4rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', flexShrink: 0 }}>{side === 'marie' ? '🤵' : '👰'}</div>
                        <div style={{ fontSize: '.62rem', letterSpacing: '.08em', textTransform: 'uppercase' as const, color: textColor, fontWeight: 700 }}>{side === 'marie' ? 'Du Marié' : 'De la Mariée'}</div>
                      </div>
                      {activeSide === side && (
                        <select onClick={e => e.stopPropagation()} value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}
                          style={{ width: '100%', padding: '.55rem .7rem', border: `1.5px solid ${border}`, borderRadius: 8, fontFamily: "'Inter',sans-serif", fontSize: '.76rem', color: textColor, outline: 'none', background: '#fff', marginTop: '.5rem' }}>
                          <option value="">-- Choisir mon groupe --</option>
                          {(side === 'marie' ? GROOM_GROUPS : BRIDE_GROUPS).map(g => (
                            <option key={g.name} value={g.name}>{g.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '.75rem' }}>
                  <button onClick={handleConfirm} disabled={rsvpLoading}
                    style={{ flex: 1, padding: '.9rem', background: blue, color: '#fff', border: 'none', borderRadius: 12, fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase' as const, fontFamily: "'Inter',sans-serif", fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,71,171,.3)', opacity: rsvpLoading ? .6 : 1 }}>
                    {rsvpLoading ? '…' : '✓ Confirmer ma venue'}
                  </button>
                  <button onClick={handleDecline}
                    style={{ flex: 1, padding: '.9rem', background: 'transparent', color: muted, border: `1.5px solid ${border}`, borderRadius: 12, fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase' as const, fontFamily: "'Inter',sans-serif", fontWeight: 600, cursor: 'pointer' }}>
                    Décliner
                  </button>
                </div>
              </>
            )}
            {rsvpState === 'confirmed' && confirmedData && (
              <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '1.2rem' }}>
                <p style={{ fontSize: '.76rem', color: muted, textAlign: 'center' as const }}>Présence confirmée ! Téléchargez votre carte d'accès :</p>
                <div id="confirm-card" style={{ width: '100%', maxWidth: 300, borderRadius: 20, padding: '2rem 1.5rem', textAlign: 'center' as const, background: confirmedData.bg, color: confirmedData.fg, boxShadow: '0 12px 40px rgba(0,0,0,.2)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .8rem', fontSize: '1.2rem', position: 'relative', zIndex: 1 }}>✓</div>
                  <div style={{ fontSize: '.55rem', letterSpacing: '.2em', textTransform: 'uppercase' as const, opacity: .75, marginBottom: '.3rem', position: 'relative', zIndex: 1 }}>Mariage · Invitation</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 600, marginBottom: '.2rem', position: 'relative', zIndex: 1 }}>Ingrid &amp; Ulrich</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem', fontStyle: 'italic', opacity: .9, marginBottom: '.6rem', position: 'relative', zIndex: 1 }}>{confirmedData.name}</div>
                  <div style={{ fontSize: '.72rem', opacity: .9, fontStyle: 'italic', lineHeight: 1.5, padding: '0 .5rem', marginBottom: '.6rem', position: 'relative', zIndex: 1 }}>
                    Merci d'avoir confirmé votre présence au mariage. Nous serons ravis de célébrer ce moment avec vous.
                  </div>
                  <div style={{ fontSize: '.58rem', letterSpacing: '.12em', textTransform: 'uppercase' as const, padding: '.3rem .8rem', borderRadius: 50, background: 'rgba(255,255,255,.2)', display: 'inline-block', position: 'relative', zIndex: 1 }}>
                    ({confirmedData.group}) · {confirmedData.side === 'marie' ? 'Marié' : 'Mariée'}
                  </div>
                </div>
                <button onClick={() => {
                  const card = document.getElementById('confirm-card')
                  if ((window as any).html2canvas && card) {
                    (window as any).html2canvas(card, { scale: 3, backgroundColor: null, useCORS: true }).then((canvas: any) => {
                      const a = document.createElement('a'); a.download = 'invitation-ingrid-ulrich.png'; a.href = canvas.toDataURL('image/png'); a.click()
                    })
                  } else { window.print() }
                }} style={{ padding: '.8rem 1.6rem', background: blue, color: '#fff', border: 'none', borderRadius: 50, fontSize: '.68rem', letterSpacing: '.1em', textTransform: 'uppercase' as const, fontFamily: "'Inter',sans-serif", fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,71,171,.3)' }}>
                  ⬇️ Télécharger ma carte
                </button>
              </div>
            )}
            {rsvpState === 'declined' && (
              <div style={{ textAlign: 'center' as const, padding: '1.5rem 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: '.8rem' }}>💙</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.15rem', color: textColor, lineHeight: 1.6, marginBottom: '.5rem' }}>Désolé(e) que vous ne puissez pas participer à notre cérémonie.</div>
                <div style={{ fontSize: '.78rem', color: muted, lineHeight: 1.6 }}>Toutefois, merci d&apos;avoir répondu. 💙</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LOCALISATION */}
      <section id="localisation" style={{ padding: '4rem 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className="reveal">{sectionTagDark('Itinéraire')}{sectionTitle('Localisation', true)}{dividerDark}
            <p style={{ fontSize: '.8rem', color: '#5a6a7a' }}>Pete Metam, Bandjoun</p>
          </div>
          <div className="reveal" style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,71,171,.1)', height: 230, margin: '1.5rem 0', border: `1px solid ${border}` }}>
            <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d500!2d10.4150!3d5.3848!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sfr!2scm!4v1"
              width="100%" height="100%" style={{ border: 'none' }} allowFullScreen loading="lazy" />
          </div>
          <div className="reveal" style={{ textAlign: 'center' as const }}>
            <p style={{ fontSize: '.78rem', color: '#5a6a7a', lineHeight: 1.8, marginBottom: '1rem' }}>📍 Depuis votre position actuelle<br />🔴 Arrivée : Pete Metam, Bandjoun</p>
            <a href="https://maps.google.com/?daddr=5.3848,10.4150" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: blue, color: '#fff', padding: '.8rem 1.6rem', borderRadius: 50, textDecoration: 'none', fontSize: '.68rem', letterSpacing: '.1em', textTransform: 'uppercase' as const, fontWeight: 600, boxShadow: '0 4px 14px rgba(0,71,171,.3)' }}>
              📍 Lancer la navigation
            </a>
          </div>
        </div>
      </section>

      {/* MOTS DOUX */}
      <section id="mots" style={{ background: '#003380', padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className="reveal">{sectionTag("Livre d'or")}{sectionTitle('Mots Doux')}{divider}
            <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.85)', marginBottom: '1.5rem' }}>Laissez un message aux mariés ✉️</p>
          </div>
          <div className="reveal">
            <textarea value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Votre message pour les mariés…"
              style={{ width: '100%', padding: '.9rem', border: `1.5px solid ${border}`, borderRadius: 14, fontFamily: "'Inter',sans-serif", fontSize: '.82rem', resize: 'none', height: 100, outline: 'none', marginBottom: '.7rem', background: '#fff' }} />
            <div style={{ display: 'flex', gap: '.7rem', marginBottom: '.7rem' }}>
              <input value={msgName} onChange={e => setMsgName(e.target.value)} placeholder="Votre prénom"
                style={{ flex: 1, padding: '.8rem .9rem', border: `1.5px solid ${border}`, borderRadius: 11, fontFamily: "'Inter',sans-serif", fontSize: '.8rem', outline: 'none', background: '#fff' }} />

            </div>
            <button onClick={handleSendMsg} disabled={msgLoading}
              style={{ width: '100%', padding: '.9rem', background: blue, color: '#fff', border: 'none', borderRadius: 12, fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase' as const, fontFamily: "'Inter',sans-serif", fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,71,171,.3)', opacity: msgLoading ? .6 : 1 }}>
              {msgLoading ? 'Envoi…' : '✉️  Laisser un message'}
            </button>
          </div>
          <div style={{ textAlign: 'center' as const, margin: '1.5rem 0 1rem', fontSize: '.62rem', letterSpacing: '.18em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.6)' }}>
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '.8rem' }}>
            {messages.map(m => (
              <div key={m.id} style={{ background: '#fff', borderRadius: 14, padding: '1.2rem 1.3rem', boxShadow: '0 2px 12px rgba(0,71,171,.07)', border: `1px solid ${border}` }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem', fontStyle: 'italic', color: textColor, marginBottom: '.6rem', lineHeight: 1.6 }}>"{m.message}"</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.6rem', textTransform: 'uppercase' as const, letterSpacing: '.1em' }}>
                  <span style={{ color: blue, fontWeight: 600 }}>{m.author}</span>
                  <span style={{ color: muted }}>{new Date(m.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: blueDark, color: 'rgba(255,255,255,.5)', textAlign: 'center' as const, padding: '2.5rem 1.5rem', fontSize: '.7rem', letterSpacing: '.1em', lineHeight: 2 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.8rem', color: 'rgba(255,255,255,.92)', marginBottom: '.4rem', fontWeight: 600 }}>Ingrid &amp; Ulrich</div>
        <div>31 Juillet 2026 &nbsp;·&nbsp; Bandjoun</div>
        <div style={{ marginTop: '.8rem', fontSize: '.6rem' }}>Nous avons hâte de vivre ce moment avec vous 💙</div>
      </footer>

      {/* MUSIC BUTTON */}
      <button onClick={toggleMusic} style={{
        position: 'fixed', bottom: '1.5rem', right: '1.2rem', zIndex: 400,
        width: 46, height: 46, borderRadius: '50%',
        background: musicPlaying ? '#0047AB' : 'rgba(0,71,171,0.85)',
        color: '#fff', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem', boxShadow: '0 4px 16px rgba(0,71,171,.35)',
        backdropFilter: 'blur(8px)'
      }}>
        {musicPlaying ? '🔊' : '🔇'}
      </button>

      {/* TOAST */}
      <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: `translateX(-50%) translateY(${toast.show ? '0' : '120px'})`, background: blueDark, color: '#fff', padding: '.75rem 1.4rem', borderRadius: 50, fontSize: '.76rem', fontWeight: 500, boxShadow: '0 4px 24px rgba(0,0,0,.25)', transition: 'transform .4s cubic-bezier(.34,1.56,.64,1)', zIndex: 500, whiteSpace: 'nowrap' as const, maxWidth: '90vw', textAlign: 'center' as const }}>
        {toast.msg}
      </div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" async />
    </>
  )
}

