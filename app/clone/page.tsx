'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ClonePage() {
  const router = useRouter()
  const [step, setStep] = useState<'input' | 'generating'>('input')
  const [rawHtml, setRawHtml] = useState('')
  const [pageTitle, setPageTitle] = useState('')
  const [screenshot, setScreenshot] = useState<string>('') // base64 data URL
  const [error, setError] = useState('')

  function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setScreenshot(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleGenerate() {
    if (!rawHtml.trim()) return setError('Please paste the page HTML + CSS blob')
    if (!pageTitle.trim()) return setError('Please add a page title')
    setStep('generating')
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'clone', scrapedHtml: rawHtml, screenshot }),
      })

      // Read as text FIRST, then parse — so a non-JSON error stays readable
      const raw = await res.text()
      let data: any
      try {
        data = JSON.parse(raw)
      } catch {
        throw new Error(`Server error (${res.status}): ${raw.slice(0, 200)}`)
      }
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      if (data.warning) alert(data.warning)

      const saveRes = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: pageTitle, html: data.html, type: 'clone' }),
      })
      const saved = await saveRes.json()
      router.push(`/preview?id=${saved.id}`)
    } catch (e: any) {
      setError(e.message)
      setStep('input')
    }
  }

  // The snippet the user pastes into the DevTools console to capture HTML + CSS.
  const consoleSnippet = `(async()=>{let c='';for(const s of document.styleSheets){try{for(const r of s.cssRules)c+=r.cssText+'\\n'}catch(e){if(s.href){try{c+=await(await fetch(s.href)).text()+'\\n'}catch(_){}}}}const d=document.documentElement.cloneNode(true);d.querySelectorAll('script,noscript,link[rel="stylesheet"],iframe').forEach(n=>n.remove());d.querySelectorAll('img').forEach(i=>{const r=i.currentSrc||i.src;if(r)i.setAttribute('src',r);i.removeAttribute('srcset')});const h=d.querySelector('head')||d;const t=document.createElement('style');t.textContent=c;h.appendChild(t);const o='<!DOCTYPE html>\\n'+d.outerHTML;try{await navigator.clipboard.writeText(o);console.log('✅ Copied '+o.length+' chars')}catch(e){console.log(o)}})();`

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 40px', height: '60px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px' }}>← Back</Link>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Clone a Page</span>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '60px 40px' }}>
        {step === 'input' && (
          <div className="fade-in">
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>
              Clone a Landing Page
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.6 }}>
              The accuracy depends entirely on capturing the page's <strong>CSS</strong>, not just its HTML.
              Use the one-line capture script below — it grabs the full HTML <em>with all styles inlined</em>.
              Optionally add a screenshot for an even closer match.
            </p>

            {/* Capture instructions */}
            <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
              <p style={{ fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: '14px', marginBottom: '12px' }}>
                📋 How to capture (do this on the page you want to clone):
              </p>
              <ol style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.8, paddingLeft: '18px', margin: 0 }}>
                <li>Open the page → press <code style={codeStyle}>F12</code> → click the <strong>Console</strong> tab</li>
                <li>Paste the script below, hit Enter (you may need to type <code style={codeStyle}>allow pasting</code> first)</li>
                <li>It copies the full HTML + CSS to your clipboard — paste it in the box below</li>
              </ol>
              <textarea
                readOnly
                value={consoleSnippet}
                onClick={e => (e.currentTarget as HTMLTextAreaElement).select()}
                style={{
                  width: '100%', marginTop: '12px', background: 'var(--dark-3)',
                  border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--accent-light)',
                  fontFamily: 'monospace', fontSize: '11px', padding: '12px', resize: 'vertical',
                  minHeight: '70px', outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Page Title (for saving)</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Hollow Socks Clone v1"
                value={pageTitle}
                onChange={e => setPageTitle(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Page HTML + CSS (from the capture script)</label>
              <textarea
                className="input"
                rows={10}
                value={rawHtml}
                onChange={e => setRawHtml(e.target.value)}
                placeholder="Paste the output of the capture script here..."
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>
                This gives Claude the real colors, fonts, spacing and layout — not just guesses.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Screenshot (optional, but improves accuracy)</label>
              <input type="file" accept="image/*" onChange={handleScreenshot}
                style={{ color: 'var(--text-muted)', fontSize: '13px' }} />
              {screenshot && (
                <img src={screenshot} alt="preview" style={{ marginTop: '10px', maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)' }} />
              )}
            </div>

            {error && <p style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

            <button className="btn-primary" onClick={handleGenerate} style={{ width: '100%', fontSize: '16px', padding: '14px' }}>
              Clone This Page →
            </button>
          </div>
        )}

        {step === 'generating' && (
          <div className="fade-in" style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '24px' }}>🧬</div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>Cloning your page...</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '8px' }}>
              Preserving the original structure, styles and content as a clean Shopify-ready file.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Takes about 30–60 seconds.</p>
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
              <div className="spinner" style={{ width: '32px', height: '32px' }} />
            </div>
            {error && <p style={{ color: '#ff6b6b', fontSize: '14px', marginTop: '24px' }}>{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 600,
  fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'rgba(255,255,255,0.7)',
}
const codeStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '3px', fontSize: '12px',
}