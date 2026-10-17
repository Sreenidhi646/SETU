import { useEffect, useRef, useState } from 'react'
import { T, STATES } from './i18n'
import { matchSchemes } from './api'

// UI languages (English, Tamil). To add one: add a block in i18n.js and a line here.
const LANGS = [['en', 'English'], ['ta', 'தமிழ்']]
// Voice input languages (depends on the browser's speech service)
const SPEECH = [['en-IN', 'English'], ['ta-IN', 'தமிழ்']]
const SPEECH_DEFAULT = { en: 'en-IN', ta: 'ta-IN' }

const MicIcon = ({ s = 56 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
)
const Logo = ({ size = 44 }) => <img src="/logo.png" width={size} height={size} alt="" />

function Intake({ t, lang }) {
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  const rec = useRef(null)
  const summaryRef = useRef(null)
  const [speakLang, setSpeakLang] = useState(SPEECH_DEFAULT[lang])
  const [listening, setListening] = useState(false)
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')
  const [f, setF] = useState({ state: '', level: '', course: '', income: '', cat: '' })
  const [err, setErr] = useState({})
  const [profile, setProfile] = useState(null)

  useEffect(() => { setSpeakLang(SPEECH_DEFAULT[lang]) }, [lang])
  useEffect(() => () => rec.current && rec.current.abort(), [])
  useEffect(() => { if (profile && summaryRef.current) summaryRef.current.focus() }, [profile])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  function toggleMic() {
    if (!SR) { setMsg(t.noSR); return }
    if (listening) { rec.current && rec.current.stop(); return }
    const r = new SR()
    r.lang = speakLang
    r.interimResults = true
    r.continuous = false
    const base = text.trim()
    r.onresult = (e) => {
      let s = ''
      for (const x of e.results) s += x[0].transcript
      setText((base ? base + ' ' : '') + s)
    }
    r.onerror = (e) => {
      setListening(false)
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setMsg(t.denied)
      else if (e.error === 'no-speech') setMsg(t.nospeech)
      else if (e.error !== 'aborted') setMsg(t.srFail)
    }
    r.onend = () => setListening(false)
    rec.current = r
    setMsg('')
    try { r.start(); setListening(true) } catch { setMsg(t.srFail) }
  }

  function submit(e) {
    e.preventDefault()
    const er = {}
    if (!f.state) er.state = t.errReq
    if (!f.level) er.level = t.errReq
    const inc = Number(f.income)
    if (f.income === '') er.income = t.errReq
    else if (!Number.isFinite(inc) || inc < 0) er.income = t.errInc
    setErr(er)
    if (Object.keys(er).length) return
    const p = { ...f, income: inc, transcript: text.trim() }
    matchSchemes(p) // stub: replace in src/api.js. Returns connected:false for now.
    setProfile(p)
  }

  const show = (v) => v || t.notGiven
  const L = t.sumLabels

  return (
    <section className="panel" id="start" aria-labelledby="intake-h">
      <div className="stage">
        <button type="button" className={'bigmic' + (listening ? ' on' : '')} onClick={toggleMic} aria-pressed={listening} aria-label={listening ? t.micStop : t.micStart}>
          <span className="ring" /><span className="ring r2" /><MicIcon />
        </button>
        <p className="miclabel" role="status" aria-live="polite">{listening ? t.listening : t.micStart}</p>
        <h2 id="intake-h">{t.intake}</h2>
        <p className="muted">{t.intakeHelp}</p>
        <p className="mention">{t.mention}</p>
        <label className="inline">
          <span>{t.speakLang}</span>
          <select value={speakLang} onChange={(e) => setSpeakLang(e.target.value)} disabled={listening}>
            {SPEECH.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </label>
      </div>
      {msg && <p className="alert" role="alert">{msg}</p>}

      <form onSubmit={submit} noValidate>
        <label className="field">
          <span>{t.transcript}</span>
          <textarea rows="3" value={text} onChange={(e) => setText(e.target.value)} placeholder={t.transcriptPh} />
        </label>

        <div className="grid">
          <label className="field">
            <span>{t.state}</span>
            <select value={f.state} onChange={set('state')} aria-invalid={!!err.state} aria-describedby="e-state">
              <option value="">{t.choose}</option>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <small className="hint">{t.hintState}</small>
            <small id="e-state" className="err">{err.state}</small>
          </label>
          <label className="field">
            <span>{t.level}</span>
            <select value={f.level} onChange={set('level')} aria-invalid={!!err.level} aria-describedby="e-level">
              <option value="">{t.choose}</option>
              {Object.entries(t.levels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <small id="e-level" className="err">{err.level}</small>
          </label>
          {f.level && f.level !== 'c10' && (<label className="field"><span>{t.course}</span><input type="text" value={f.course} onChange={set('course')} placeholder={t.coursePh} /></label>)}
          <label className="field">
            <span>{t.income}</span>
            <input type="number" inputMode="numeric" min="0" value={f.income} onChange={set('income')} aria-invalid={!!err.income} aria-describedby="e-inc" />
            <small className="hint">{t.hintInc}</small>
            <small id="e-inc" className="err">{err.income}</small>
          </label>
          <label className="field">
            <span>{t.cat}</span>
            <select value={f.cat} onChange={set('cat')}>
              <option value="">{t.choose}</option>
              {Object.entries(t.cats).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <small className="hint">{t.hintCat}</small>
          </label>
        </div>

        <button className="btn" type="submit">{t.submit}</button>
        <p className="tiny">{t.privacy}</p>
      </form>

      {profile && (
        <div className="summary" ref={summaryRef} tabIndex="-1" aria-live="polite">
          <h3>{t.summary}</h3>
          <dl>
            <dt>{L.state}</dt><dd>{profile.state}</dd>
            <dt>{L.level}</dt><dd>{t.levels[profile.level]}</dd>
            {profile.course && <><dt>{L.course}</dt><dd>{profile.course}</dd></>}
            <dt>{L.income}</dt><dd>₹ {profile.income.toLocaleString('en-IN')}</dd>
            <dt>{L.cat}</dt><dd>{profile.cat ? t.cats[profile.cat] : t.notGiven}</dd>
            <dt>{L.said}</dt><dd>{show(profile.transcript)}</dd>
          </dl>
          <h3>{t.next}</h3>
          <ul>{t.nextItems.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      )}
    </section>
  )
}

function SchemeCard({ t }) {
  return (
    <article className="result">
      <div className="result-head"><h3>{t.schName}</h3><span className="badge">{t.sample}</span></div>
      <h4>{t.reasonsT}</h4>
      <ul className="rules">
        {t.rules.map((r) => <li key={r}><span>{r}</span><em>{t.ruleSt}</em></li>)}
      </ul>
      <dl className="meta">
        <dt>{t.src}</dt><dd>{t.srcV}</dd>
        <dt>{t.ver}</dt><dd>{t.verV}</dd>
      </dl>
    </article>
  )
}

export default function App() {
  const [lang, setLang] = useState('en')
  const t = T[lang]
  useEffect(() => { document.documentElement.lang = lang }, [lang])

  return (
    <>
      <a className="skip" href="#main">{t.skip}</a>
      <header className="nav">
        <div className="wrap nav-in">
          <a className="brand" href="#top" aria-label="SETU home"><Logo size={48} /><span>SETU</span></a>
          <nav aria-label="Main">
            <a className="hide-sm" href="#how">{t.nav.how}</a>
            <a className="hide-sm" href="#scholarships">{t.nav.sch}</a>
            <select className="lang" value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t.chooseLang}>{LANGS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
            <a className="btn small" href="#start">{t.nav.start}</a>
          </nav>
        </div>
      </header>

      <a className="fab" href="#start" aria-label={t.micStart}><MicIcon s={30} /></a>
      <main id="main">
        <div className="herobg"><section className="hero wrap" id="top">
          <div className="hero-text">
            <div className="langs" role="group" aria-label={t.chooseLang}>
              <span>{t.chooseLang}</span>
              {LANGS.map(([c, n]) => <button key={c} type="button" aria-pressed={lang === c} onClick={() => setLang(c)}>{n}</button>)}
            </div>
            <h1>{t.h1}</h1>
            <p className="lead">{t.sub}</p>
            <svg className="edu-art" viewBox="0 0 120 104" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" strokeDasharray="0.1 6">
              <path d="M60 8 105 26 60 44 15 26Z" stroke="#FFF3E8" fill="rgba(255,154,131,.22)" />
              <path d="M32 37V53Q60 67 88 53V37" stroke="#FFF3E8" />
              <path d="M105 26V46" stroke="#FF9A83" />
              <path d="M12 64C12 84 28 95 52 95" stroke="#FF9A83" />
              <path d="M108 64C108 84 92 95 68 95" stroke="#FF9A83" />
              <path d="M24 70C26 82 36 88 48 89M96 70C94 82 84 88 72 89" stroke="#FF9A83" />
            </svg>
          </div>
          <Intake t={t} lang={lang} />
        </section></div>

        <section className="band" id="how" aria-labelledby="how-h">
          <div className="wrap">
            <h2 id="how-h">{t.howT}</h2>
            <p className="muted">{t.howNote}</p>
            <ol className="steps">
              {t.steps.map(([h, d], i) => (
                <li key={h}><span className="n" aria-hidden="true">{i + 1}</span><h3>{h}</h3><p>{d}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <section className="wrap sect" id="scholarships" aria-labelledby="sch-h">
          <h2 id="sch-h">{t.schT}</h2>
          <p className="muted">{t.schNote}</p>
          <div className="two">
            <div><h3 className="grp">{t.central}</h3><SchemeCard t={t} /></div>
            <div><h3 className="grp">{t.stateSch}</h3><SchemeCard t={t} /></div>
          </div>
        </section>

        <section className="wrap sect" aria-labelledby="sit-h">
          <h2 id="sit-h">{t.sitT}</h2>
          <ul className="sits">{t.sit.map((s) => <li key={s}>{s}</li>)}</ul>
        </section>

        <section className="band alt" aria-labelledby="aud-h">
          <div className="wrap">
            <h2 id="aud-h">{t.audT}</h2>
            <div className="cols3">
              {t.aud.map(([h, d]) => <div key={h} className="col"><h3>{h}</h3><p>{d}</p></div>)}
            </div>
          </div>
        </section>

        <section className="trust" aria-labelledby="tr-h">
          <div className="wrap">
            <h2 id="tr-h">{t.trustT}</h2>
            <div className="cols4">
              {t.trust.map(([h, d]) => <div key={h} className="col"><h3>{h}</h3><p>{d}</p></div>)}
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <div className="brand"><Logo size={28} /><span>SETU</span></div>
          <p>{t.foot}</p>
          <p>{t.sdg}</p>
          <p>{t.priv}</p>
          <p className="disc">{t.disc}</p>
        </div>
      </footer>
    </>
  )
}
