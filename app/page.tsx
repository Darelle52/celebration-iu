'use client'
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'

const GROOM_GROUPS = [
  { name: "Troupe Théâtrale",                    bg: "#7C3D12", fg: "#fff" },
  { name: "Moniteurs",                            bg: "#1e3a5c", fg: "#fff" },
  { name: "Tchakaliseurs",                        bg: "#5B2D8E", fg: "#fff" },
  { name: "Amis et connaissances",                bg: "#1B5E20", fg: "#fff" },
  { name: "Ancien d'église Ndogbong",             bg: "#37474F", fg: "#fff" },
  { name: "Famille de Nyalla",                    bg: "#7B1A2E", fg: "#fff" },
  { name: "Amis (Stephanie)",                     bg: "#880E4F", fg: "#fff" },
  { name: "Amis (Inès)",                          bg: "#4E342E", fg: "#fff" },
  { name: "Amis (Telly)",                         bg: "#00695C", fg: "#fff" },
  { name: "Invités du père (Famille et amis)",    bg: "#B8860B", fg: "#fff" },
  { name: "Invités de la mère (Famille et amis)", bg: "#556B2F", fg: "#fff" },
  { name: "Témoins",                              bg: "#1a1a2e", fg: "#fff" },
]

const BRIDE_GROUPS = [
  { name: "APJ",                                       bg: "#F48FB1", fg: "#3a1a2a" },
  { name: "ACQMT",                                     bg: "#81D4FA", fg: "#0d2a3a" },
  { name: "IBI",                                       bg: "#FFCCBC", fg: "#3a1a0a" },
  { name: "AGR",                                       bg: "#A5D6A7", fg: "#0a2a10" },
  { name: "Famille maternelle",                        bg: "#CE93D8", fg: "#2a0a3a" },
  { name: "Famille paternelle",                        bg: "#F8BBD0", fg: "#3a0a20" },
  { name: "Amis et connaissances",                     bg: "#FFF59D", fg: "#2a2a00" },
  { name: "Frères et Sœurs famille maternelle",        bg: "#CFD8DC", fg: "#1a2a2a" },
  { name: "Frères et Sœurs famille paternelle",        bg: "#F5F0E8", fg: "#2a2010" },
  { name: "Amis (Darelle)",                            bg: "#B3E5FC", fg: "#0a1a2a" },
  { name: "Amis (Claude)",                             bg: "#B2DFDB", fg: "#0a2a20" },
  { name: "Amis (William)",                            bg: "#FFCCAA", fg: "#2a1000" },
  { name: "Témoins",                                   bg: "#F5E6C8", fg: "#2a1a00" },
  { name: "Invités du père",                           bg: "#FFAB91", fg: "#2a0a00" },
  { name: "Invités de la mère",                        bg: "#E1BEE7", fg: "#1a0a2a" },
  { name: "Invités de la famille",                     bg: "#B2EBF2", fg: "#002a2a" },
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

const S: Record<string, React.CSSProperties> = {
  nav: { position:'fixed', top:0, left:0, right:0, zIndex:100, display:'flex', justifyContent:'center', gap:'1.2rem', padding:'.8rem 1rem', background:'rgba(255,255,255,.95)', backdropFilter:'blur(10px)', borderBottom:'1px solid rgba(37,99,168,.15)', flexWrap:'wrap' },
  navA: { textDecoration:'none', color:'var(--bd)', fontSize:'.6rem', letterSpacing:'.12em', textTransform:'uppercase', fontWeight:500 } as React.CSSProperties,
  heroWrap: { minHeight:'100vh', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' },
  heroOverlay: { position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(10,20,60,.35) 0%,rgba(10,20,60,.08) 40%,rgba(10,20,60,.85) 100%)' },
  heroContent: { position:'relative', zIndex:2, flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', padding:'2rem 1.5rem 3.5rem', textAlign:'center', color:'#fff' },
  eyebrow: { fontSize:'.6rem', letterSpacing:'.25em', textTransform:'uppercase', color:'var(--gd)', marginBottom:'1rem' } as React.CSSProperties,
  sectionTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(1.9rem,7vw,3rem)', fontWeight:300, color:'var(--bd)', lineHeight:1.1, marginBottom:'1rem' },
  divider: { display:'flex', alignItems:'center', justifyContent:'center', gap:'1rem', margin:'1rem auto' },
  divLine: { width:45, height:1, background:'var(--bl)' },
  detailCard: { background:'#fff', borderRadius:16, padding:'1.3rem 1rem', textAlign:'center', boxShadow:'0 2px 20px rgba(37,99,168,.08)' },
  detailIcon: { width:38, height:38, background:'var(--bp)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto .7rem', fontSize:'1rem' },
  input: { width:'100%', padding:'.85rem 1rem', border:'1.5px solid var(--bl)', borderRadius:12, fontSize:'.82rem', fontFamily:"'Montserrat',sans-serif", color:'var(--td)', outline:'none', marginBottom:'.9rem' },
  groupCard: { border:'2px solid var(--bl)', borderRadius:14, padding:'.9rem .8rem', cursor:'pointer', transition:'all .2s', background:'#fff', userSelect:'none' } as React.CSSProperties,
  btnConfirm: { flex:1, padding:'.85rem', background:'var(--bd)', color:'#fff', border:'none', borderRadius:12, fontSize:'.68rem', letterSpacing:'.1em', textTransform:'uppercase', fontFamily:"'Montserrat',sans-serif", fontWeight:500, cursor:'pointer' } as React.CSSProperties,
  btnDecline: { flex:1, padding:'.85rem', background:'transparent', color:'var(--tm)', border:'1.5px solid var(--bl)', borderRadius:12, fontSize:'.68rem', letterSpacing:'.1em', textTransform:'uppercase', fontFamily:"'Montserrat',sans-serif", fontWeight:500, cursor:'pointer' } as React.CSSProperties,
}

export default function Home() {
  const { days, hours, mins, secs } = useCountdown(new Date('2026-07-31T09:00:00'))
  const [rsvpName, setRsvpName] = useState('')
  const [activeSide, setActiveSide] = useState<'marie'|'mariee'|null>(null)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [rsvpState, setRsvpState] = useState<RsvpState>('idle')
  const [confirmedData, setConfirmedData] = useState<{name:string,group:string,side:string,bg:string,fg:string}|null>(null)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [msgText, setMsgText] = useState('')
  const [msgName, setMsgName] = useState('')
  const [msgFam, setMsgFam] = useState('')
  const [msgLoading, setMsgLoading] = useState(false)
  const [toast, setToast] = useState({msg:'', show:false})
  const toastRef = useRef<ReturnType<typeof setTimeout>>()

  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current)
    setToast({msg, show:true})
    toastRef.current = setTimeout(() => setToast(t => ({...t, show:false})), 3200)
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
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const toggleSide = (side: 'marie'|'mariee') => {
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
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({name: rsvpName.trim(), status:'confirmed', group_name: selectedGroup, side: activeSide})
      })
      setConfirmedData({name: rsvpName.trim(), group: selectedGroup, side: activeSide, bg: g.bg, fg: g.fg})
      setRsvpState('confirmed')
      showToast('Présence confirmée ! 🎉')
    } catch { showToast('Erreur, réessayez') }
    finally { setRsvpLoading(false) }
  }

  const handleDecline = async () => {
    const name = rsvpName.trim() || 'Invité(e)'
    await fetch('/api/rsvp', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({name, status:'declined'})
    }).catch(()=>{})
    setRsvpState('declined')
    showToast('Merci pour votre réponse 💙')
  }

  const handleSendMsg = async () => {
    if (!msgText.trim() || !msgName.trim()) { showToast('Merci de remplir message et prénom 😊'); return }
    setMsgLoading(true)
    try {
      const r = await fetch('/api/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({name: msgName.trim(), family: msgFam.trim(), message: msgText.trim()})
      })
      const d = await r.json()
      if (d.success) {
        setMsgText(''); setMsgName(''); setMsgFam('')
        fetchMsgs()
        showToast("Message envoyé au livre d'or ✉️")
      }
    } catch { showToast('Erreur, réessayez') }
    finally { setMsgLoading(false) }
  }

  const cd = (label: string, val: string) => (
    <div style={{minWidth:65}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(2.6rem,9vw,4.2rem)', fontWeight:300, lineHeight:1, color:'#fff'}}>{val}</div>
      <div style={{fontSize:'.5rem', letterSpacing:'.18em', textTransform:'uppercase', color:'rgba(255,255,255,.4)', marginTop:'.3rem'}}>{label}</div>
    </div>
  )

  return (
    <>
      {/* NAV */}
      <nav style={S.nav}>
        {[['#invitation','Accueil'],['#programme','Programme'],['#rsvp','Présence'],['#localisation','Lieu'],['#mots','Livre d\'or']].map(([href,label]) => (
          <a key={href} href={href} style={S.navA}>{label}</a>
        ))}
      </nav>

      {/* HERO */}
      <section style={S.heroWrap}>
        <div style={{position:'absolute', inset:0}}>
          <Image src="/hero.jpg" alt="Invitation" fill style={{objectFit:'cover', objectPosition:'center'}} priority />
        </div>
        <div style={S.heroOverlay} />
        <div style={S.heroContent}>
          <p className="afu" style={{fontSize:'.6rem', letterSpacing:'.28em', textTransform:'uppercase', color:'rgba(255,255,255,.7)', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'.8rem'}}>
            <span style={{display:'block', width:28, height:1, background:'rgba(255,255,255,.35)'}}/>
            Célébration de Mariage
            <span style={{display:'block', width:28, height:1, background:'rgba(255,255,255,.35)'}}/>
          </p>
          <h1 className="afu1" style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(3.2rem,13vw,6rem)', fontWeight:300, lineHeight:.95}}>
            Ingrid
            <span style={{fontStyle:'italic', color:'var(--gd)', display:'block', fontSize:'2.2rem', margin:'.15rem 0'}}>&amp;</span>
            Ulrich
          </h1>
          <p className="afu2" style={{marginTop:'1rem', fontSize:'.68rem', letterSpacing:'.2em', textTransform:'uppercase', color:'rgba(255,255,255,.72)'}}>
            Vendredi 31 Juillet 2026 &nbsp;·&nbsp; Bandjoun, Ouest Cameroun
          </p>
        </div>
        <div className="abounce" style={{position:'absolute', bottom:'1rem', left:'50%', display:'flex', flexDirection:'column', alignItems:'center', gap:'.3rem', color:'rgba(255,255,255,.45)', fontSize:'.55rem', letterSpacing:'.15em', textTransform:'uppercase', zIndex:2}}>
          <div style={{width:1, height:32, background:'linear-gradient(to bottom,rgba(255,255,255,.5),transparent)'}}/>
          <span>Défiler</span>
        </div>
      </section>

      {/* INVITATION */}
      <section id="invitation" style={{padding:'4.5rem 1.5rem', textAlign:'center', background:'#fff', position:'relative'}}>
        <div style={{position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:1, height:55, background:'var(--bl)'}}/>
        <div className="reveal">
          <p style={S.eyebrow}>Bienvenue à notre célébration</p>
          <h2 style={S.sectionTitle}>Cher(e) <em>Invité(e)</em></h2>
          <div style={S.divider}><div style={S.divLine}/><span style={{color:'var(--gd)', fontSize:'1.1rem'}}>💍</span><div style={S.divLine}/></div>
          <p style={{maxWidth:440, margin:'0 auto', fontSize:'.83rem', lineHeight:1.9, color:'var(--tm)', fontWeight:300}}>
            Deux cœurs, une promesse, une éternité.<br/>
            <em style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'1rem'}}>Ingrid &amp; Ulrich</em> vous invitent à partager<br/>la joie de leur union sacrée.
          </p>
        </div>
      </section>

      {/* COUPLE PHOTO */}
      <section style={{padding:'2.5rem 1.5rem', background:'var(--bp)', display:'flex', justifyContent:'center'}}>
        <div className="reveal" style={{textAlign:'center'}}>
          <div style={{width:180, height:180, borderRadius:'50%', overflow:'hidden', border:'4px solid var(--bm)', boxShadow:'0 6px 30px rgba(37,99,168,.2)', margin:'0 auto', position:'relative'}}>
            <Image src="/couple.jpg" alt="Ingrid et Ulrich" fill style={{objectFit:'cover', objectPosition:'center top'}}/>
          </div>
          <p style={{marginTop:'.9rem', fontFamily:"'Cormorant Garamond',serif", fontSize:'1.4rem', color:'var(--bd)', fontStyle:'italic'}}>Ingrid &amp; Ulrich</p>
        </div>
      </section>

      {/* DETAILS */}
      <section style={{padding:'2rem 1.5rem 3.5rem', background:'var(--bp)'}}>
        <div className="reveal" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', maxWidth:500, margin:'0 auto'}}>
          {[{icon:'📅',label:'Date',val:'Vendredi\n31 Juillet 2026'},{icon:'⏰',label:'Heure',val:'À partir\nde 9h00'}].map(({icon,label,val}) => (
            <div key={label} style={S.detailCard}>
              <div style={S.detailIcon}>{icon}</div>
              <div style={{fontSize:'.58rem', letterSpacing:'.18em', textTransform:'uppercase', color:'var(--gd)', marginBottom:'.35rem'}}>{label}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', color:'var(--bd)', lineHeight:1.2, whiteSpace:'pre-line'}}>{val}</div>
            </div>
          ))}
          <div style={{...S.detailCard, gridColumn:'1/-1'}}>
            <div style={S.detailIcon}>📍</div>
            <div style={{fontSize:'.58rem', letterSpacing:'.18em', textTransform:'uppercase', color:'var(--gd)', marginBottom:'.35rem'}}>Lieu</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', color:'var(--bd)', lineHeight:1.3}}>Peter Metam, Bandjoun<br/>Région de l'Ouest, Cameroun</div>
          </div>
        </div>
      </section>

      {/* COUNTDOWN */}
      <section style={{background:'var(--bd)', padding:'3rem 1.5rem', textAlign:'center', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 0%,rgba(37,99,168,.4),transparent 70%)'}}/>
        <p style={{position:'relative', fontSize:'.6rem', letterSpacing:'.25em', textTransform:'uppercase', color:'rgba(255,255,255,.5)', marginBottom:'1.8rem'}}>L'aventure commence dans…</p>
        <div style={{position:'relative', display:'flex', justifyContent:'center', gap:'.4rem', flexWrap:'wrap'}}>
          {cd('Jours',days)}
          <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'2.8rem', color:'var(--gd)', alignSelf:'flex-start', paddingTop:'.15rem', opacity:.6}}>·</div>
          {cd('Heures',hours)}
          <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'2.8rem', color:'var(--gd)', alignSelf:'flex-start', paddingTop:'.15rem', opacity:.6}}>·</div>
          {cd('Minutes',mins)}
          <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'2.8rem', color:'var(--gd)', alignSelf:'flex-start', paddingTop:'.15rem', opacity:.6}}>·</div>
          {cd('Sec',secs)}
        </div>
      </section>

      {/* PROGRAMME */}
      <section id="programme" style={{padding:'3.5rem 1.5rem', background:'#fff'}}>
        <div className="reveal" style={{textAlign:'center'}}>
          <p style={S.eyebrow}>Déroulement de la journée</p>
          <h2 style={S.sectionTitle}>Programme</h2>
          <div style={S.divider}><div style={S.divLine}/><span style={{color:'var(--gd)'}}>✨</span><div style={S.divLine}/></div>
        </div>
        <div className="reveal" style={{maxWidth:480, margin:'2rem auto 0'}}>
          {[
            {icon:'🏛️', time:'9h00',  name:'Cérémonie Civile',     desc:"Mairie de Bandjoun — Échange des vœux officiels.", last:false},
            {icon:'⛪',  time:'11h00', name:'Cérémonie Religieuse', desc:"Bénédiction de l'union devant Dieu et nos proches.", last:false},
            {icon:'🎉',  time:'14h00', name:'La Dote',               desc:'Célébration culturelle à Peter Metam, Bandjoun — le cœur de la fête !', last:true},
          ].map(({icon,time,name,desc,last}) => (
            <div key={name} style={{display:'flex', gap:'1.1rem', paddingBottom:last?0:'1.8rem', position:'relative'}}>
              {!last && <div style={{position:'absolute', left:18, top:38, bottom:0, width:1, background:'var(--bl)'}}/>}
              <div style={{flexShrink:0, width:38, height:38, background:'var(--bd)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', color:'#fff', position:'relative', zIndex:1}}>{icon}</div>
              <div>
                <div style={{fontSize:'.58rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--gd)', marginBottom:'.25rem'}}>{time}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', color:'var(--bd)'}}>{name}</div>
                <div style={{fontSize:'.73rem', color:'var(--tm)', marginTop:'.15rem', lineHeight:1.55}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RSVP */}
      <section id="rsvp" style={{background:'var(--bp)', padding:'3.5rem 1.5rem'}}>
        <div className="reveal" style={{background:'#fff', borderRadius:24, padding:'2.2rem 1.4rem', maxWidth:460, margin:'0 auto', boxShadow:'0 4px 40px rgba(37,99,168,.1)'}}>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'2rem', color:'var(--bd)', marginBottom:'.4rem', textAlign:'center'}}>Votre présence</h2>
          <p style={{fontSize:'.74rem', color:'var(--tm)', marginBottom:'1.4rem', textAlign:'center'}}>Confirmez votre venue pour ce grand jour</p>

          {rsvpState === 'idle' && (
            <>
              <input style={S.input} value={rsvpName} onChange={e=>setRsvpName(e.target.value)} placeholder="Votre nom complet…"/>
              <p style={{fontSize:'.6rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--gd)', marginBottom:'.7rem', textAlign:'center'}}>Je suis invité(e) du côté…</p>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.8rem', marginBottom:'1rem'}}>
                {(['marie','mariee'] as const).map(side => (
                  <div key={side} onClick={()=>toggleSide(side)}
                    style={{...S.groupCard, borderColor: activeSide===side ? 'var(--bm)':'var(--bl)', background: activeSide===side ? 'var(--bp)':'#fff'}}>
                    <div style={{fontSize:'.62rem', letterSpacing:'.1em', textTransform:'uppercase', color:'var(--bd)', fontWeight:600, marginBottom:'.5rem', display:'flex', alignItems:'center', gap:'.4rem'}}>
                      <div style={{width:24, height:24, borderRadius:'50%', background:'var(--bd)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.75rem'}}>
                        {side==='marie'?'🤵':'👰'}
                      </div>
                      {side==='marie'?'Du Marié':'De la Mariée'}
                    </div>
                    {activeSide===side && (
                      <select onClick={e=>e.stopPropagation()} value={selectedGroup} onChange={e=>setSelectedGroup(e.target.value)}
                        style={{width:'100%', padding:'.6rem .7rem', border:'1.5px solid var(--bl)', borderRadius:8, fontFamily:"'Montserrat',sans-serif", fontSize:'.75rem', color:'var(--td)', outline:'none', background:'#fff', marginTop:'.5rem'}}>
                        <option value="">-- Choisir mon groupe --</option>
                        {(side==='marie'?GROOM_GROUPS:BRIDE_GROUPS).map(g => (
                          <option key={g.name} value={g.name}>{g.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
              <div style={{display:'flex', gap:'.8rem'}}>
                <button style={{...S.btnConfirm, opacity:rsvpLoading?.7:1}} onClick={handleConfirm} disabled={rsvpLoading}>
                  {rsvpLoading ? '…' : '✓ Confirmer ma venue'}
                </button>
                <button style={S.btnDecline} onClick={handleDecline}>Décliner</button>
              </div>
            </>
          )}

          {rsvpState === 'confirmed' && confirmedData && (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem'}}>
              <p style={{fontSize:'.75rem', color:'var(--tm)', textAlign:'center'}}>Présence confirmée ! Téléchargez votre carte d'accès :</p>
              <div id="confirm-card" style={{width:'100%', maxWidth:300, borderRadius:20, padding:'1.8rem 1.4rem', textAlign:'center', background:confirmedData.bg, color:confirmedData.fg, boxShadow:'0 8px 30px rgba(0,0,0,.22)', position:'relative'}}>
                <div style={{position:'absolute', top:'.9rem', right:'.9rem', width:32, height:32, background:'rgba(255,255,255,.25)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}>✓</div>
                <div style={{fontSize:'1.8rem', marginBottom:'.4rem'}}>💍</div>
                <div style={{fontSize:'.55rem', letterSpacing:'.2em', textTransform:'uppercase', opacity:.8, marginBottom:'.3rem'}}>Mariage</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'1.55rem', fontWeight:300, marginBottom:'.2rem'}}>Ingrid &amp; Ulrich</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'1.1rem', fontStyle:'italic', opacity:.92, marginBottom:'.5rem'}}>{confirmedData.name}</div>
                <div style={{fontSize:'.6rem', letterSpacing:'.15em', textTransform:'uppercase', padding:'.3rem .75rem', borderRadius:50, background:'rgba(255,255,255,.22)', display:'inline-block', marginBottom:'.55rem'}}>
                  {confirmedData.group} · {confirmedData.side==='marie'?'Marié':'Mariée'}
                </div>
                <div style={{fontSize:'.7rem', opacity:.85, marginBottom:'.15rem'}}>📅 Vendredi 31 Juillet 2026</div>
                <div style={{fontSize:'.65rem', opacity:.75}}>📍 Peter Metam, Bandjoun</div>
              </div>
              <button onClick={()=>{
                const card = document.getElementById('confirm-card')
                if((window as any).html2canvas && card){
                  (window as any).html2canvas(card,{scale:3,backgroundColor:null,useCORS:true}).then((canvas:any)=>{
                    const a=document.createElement('a'); a.download='invitation-ingrid-ulrich.png'; a.href=canvas.toDataURL('image/png'); a.click()
                  })
                } else { window.print() }
              }} style={{padding:'.8rem 1.5rem', background:'var(--bd)', color:'#fff', border:'none', borderRadius:50, fontSize:'.68rem', letterSpacing:'.1em', textTransform:'uppercase', fontFamily:"'Montserrat',sans-serif", fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:'.5rem'}}>
                ⬇️ Télécharger ma carte
              </button>
            </div>
          )}

          {rsvpState === 'declined' && (
            <div style={{textAlign:'center', padding:'1rem 0'}}>
              <div style={{fontSize:'2rem', marginBottom:'.8rem'}}>💙</div>
              <p style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', color:'var(--bd)'}}>Merci pour votre réponse</p>
              <p style={{fontSize:'.78rem', color:'var(--tm)', marginTop:'.4rem'}}>Nous espérons vous voir bientôt 💙</p>
            </div>
          )}
        </div>
      </section>

      {/* LOCALISATION */}
      <section id="localisation" style={{padding:'3.5rem 1.5rem', background:'#fff', textAlign:'center'}}>
        <div className="reveal">
          <p style={S.eyebrow}>Comment nous trouver</p>
          <h2 style={{...S.sectionTitle, fontSize:'2rem'}}>Localisation du lieu</h2>
          <p style={{fontSize:'.76rem', color:'var(--tm)', marginBottom:'.5rem'}}>Itinéraire : Centre-ville de Bandjoun → Peter Metam</p>
        </div>
        <div className="reveal" style={{maxWidth:500, margin:'1.5rem auto', borderRadius:20, overflow:'hidden', boxShadow:'0 4px 30px rgba(37,99,168,.12)', height:240}}>
          <iframe src="https://www.google.com/maps/embed?pb=!1m24!1m8!1m3!1d7963.2!2d10.412!3d5.377!3m2!1i1024!2i768!4f13.1!4m13!3e2!4m5!1s0x105f3ba7c96c75a5%3A0xb3f3a2e0c8012345!2sBandjoun%20Centre%2C%20Cameroun!3m2!1d5.3756!2d10.4075!4m5!1s0x105f3ba7c96c75a5%3A0xb3f3a2e0c8023456!2sPeter%20Metam%2C%20Bandjoun!3m2!1d5.3800!2d10.4165!5e0!3m2!1sfr!2scm!4v1" width="100%" height="100%" style={{border:'none'}} allowFullScreen loading="lazy"/>
        </div>
        <p style={{fontSize:'.76rem', color:'var(--tm)', lineHeight:1.8, margin:'.8rem 0'}}>
          🔵 Départ : Centre-ville de Bandjoun<br/>🔴 Arrivée : Peter Metam (lieu de la cérémonie)
        </p>
        <a href="https://maps.google.com/?saddr=Bandjoun+Centre+Cameroun&daddr=Peter+Metam+Bandjoun+Cameroun&dirflg=w" target="_blank" rel="noopener noreferrer"
          style={{display:'inline-flex', alignItems:'center', gap:'.5rem', background:'var(--bd)', color:'#fff', padding:'.8rem 1.7rem', borderRadius:50, textDecoration:'none', fontSize:'.68rem', letterSpacing:'.1em', textTransform:'uppercase', fontWeight:500}}>
          📍 Lancer la navigation
        </a>
      </section>

      {/* MOTS DOUX */}
      <section id="mots" style={{background:'var(--bp)', padding:'3.5rem 1.5rem'}}>
        <div className="reveal" style={{textAlign:'center'}}>
          <p style={S.eyebrow}>Livre d'or</p>
          <h2 style={S.sectionTitle}>Mots Doux</h2>
          <p style={{fontSize:'.74rem', color:'var(--tm)', marginBottom:'1.6rem'}}>Laissez un message aux mariés ✉️</p>
        </div>
        <div className="reveal" style={{maxWidth:480, margin:'0 auto 2rem'}}>
          <textarea value={msgText} onChange={e=>setMsgText(e.target.value)} placeholder="Votre message pour les mariés…"
            style={{width:'100%', padding:'.9rem', border:'1.5px solid var(--bl)', borderRadius:14, fontFamily:"'Montserrat',sans-serif", fontSize:'.8rem', resize:'none', height:100, outline:'none', marginBottom:'.7rem', background:'#fff'}}/>
          <div style={{display:'flex', gap:'.7rem', marginBottom:'.7rem'}}>
            <input value={msgName} onChange={e=>setMsgName(e.target.value)} placeholder="Votre prénom"
              style={{flex:1, padding:'.8rem .9rem', border:'1.5px solid var(--bl)', borderRadius:11, fontFamily:"'Montserrat',sans-serif", fontSize:'.8rem', outline:'none', background:'#fff'}}/>
            <input value={msgFam} onChange={e=>setMsgFam(e.target.value)} placeholder="Famille / Groupe"
              style={{flex:1, padding:'.8rem .9rem', border:'1.5px solid var(--bl)', borderRadius:11, fontFamily:"'Montserrat',sans-serif", fontSize:'.8rem', outline:'none', background:'#fff'}}/>
          </div>
          <button onClick={handleSendMsg} disabled={msgLoading}
            style={{width:'100%', padding:'.85rem', background:'var(--bd)', color:'#fff', border:'none', borderRadius:11, fontSize:'.68rem', letterSpacing:'.1em', textTransform:'uppercase', fontFamily:"'Montserrat',sans-serif", fontWeight:500, cursor:'pointer', opacity:msgLoading?.7:1}}>
            {msgLoading ? 'Envoi…' : '✉️  Laisser un message'}
          </button>
        </div>
        <div style={{textAlign:'center', marginBottom:'1.1rem', fontSize:'.65rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--tm)'}}>
          {messages.length} message{messages.length!==1?'s':''}
        </div>
        <div style={{maxWidth:480, margin:'0 auto', display:'flex', flexDirection:'column', gap:'.9rem'}}>
          {messages.map(m => (
            <div key={m.id} style={{background:'#fff', borderRadius:14, padding:'1.1rem 1.2rem', boxShadow:'0 2px 14px rgba(37,99,168,.07)'}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'1.05rem', fontStyle:'italic', color:'var(--td)', marginBottom:'.5rem', lineHeight:1.5}}>"{m.message}"</div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'.62rem', textTransform:'uppercase', letterSpacing:'.1em'}}>
                <span style={{color:'var(--bm)', fontWeight:500}}>{m.author}</span>
                <span style={{color:'var(--tm)'}}>{new Date(m.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:'var(--bd)', color:'rgba(255,255,255,.5)', textAlign:'center', padding:'2.2rem 1.5rem', fontSize:'.7rem', letterSpacing:'.1em', lineHeight:2}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:'1.7rem', color:'rgba(255,255,255,.88)', marginBottom:'.4rem'}}>Ingrid &amp; Ulrich</div>
        <div>31 Juillet 2026 &nbsp;·&nbsp; Bandjoun, Cameroun</div>
        <div style={{marginTop:'.8rem', fontSize:'.6rem'}}>Nous avons hâte de vivre ce moment avec vous 💙</div>
      </footer>

      {/* TOAST */}
      <div style={{position:'fixed', bottom:'2rem', left:'50%', transform:`translateX(-50%) translateY(${toast.show?'0':'120px'})`, background:'var(--bd)', color:'#fff', padding:'.75rem 1.4rem', borderRadius:50, fontSize:'.76rem', fontWeight:500, boxShadow:'0 4px 20px rgba(0,0,0,.2)', transition:'transform .4s', zIndex:300, whiteSpace:'nowrap'}}>
        {toast.msg}
      </div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" async/>
    </>
  )
}
