'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ClonePage() {
  const router = useRouter()
  const [step, setStep] = useState<'input' | 'generating'>('input')
  const [rawHtml, setRawHtml] = useState('')
  const [pageTitle, setPageTitle] = useState('')
  const [screenshot, setScreenshot] = useState<string>('')
  const [error, setError] = useState('')

  // Resize screenshot so neither dimension exceeds the API's 8000px limit.
  function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 7600 // safely under 8000
        let { width, height } = img
        if (width > MAX || height > MAX) {
          const scale = MAX / Math.max(width, height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        // JPEG keeps the file small for tall pages
        setScreenshot(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  async function handleGenerate() {
    if (!rawHtml.trim()) return setError('Please paste the page content from the capture script')
    if (!pageTitle.trim()) return setError('Please add a page title')
    setStep('generating')
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'clone', scrapedHtml: rawHtml, screenshot }),
      })

      const raw = await res.text()
      let data: any
      try { data = JSON.parse(raw) }
      catch { throw new Error(`Server error (${res.status}): ${raw.slice(0, 200)}`) }
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

  // Lean-extract one-liner (minified). Copies content only — no CSS, no div soup.
  const consoleSnippet = `(()=>{const out=[],seen=new Set();const walk=n=>{if(!n)return;n.childNodes.forEach(c=>{if(c.nodeType===1){const t=c.tagName.toLowerCase();if(/^(script|style|svg|noscript|iframe|link|meta)$/.test(t))return;if(t==='img'){const s=c.currentSrc||c.src;if(s&&!s.startsWith('data:')&&!seen.has(s)){seen.add(s);const a=(c.alt||'').trim();out.push('[IMAGE'+(a?' "'+a+'"':'')+'] '+s)}return}if(t==='a'||t==='button'){const x=(c.innerText||'').trim().replace(/\\s+/g,' ');const h=t==='a'?c.href:'';if(x){out.push('['+t.toUpperCase()+' "'+x+'"]'+(h?' '+h:''));return}}if(/^h[1-6]$/.test(t)){const x=(c.innerText||'').trim().replace(/\\s+/g,' ');if(x&&!seen.has(t+x)){seen.add(t+x);out.push('['+t.toUpperCase()+'] '+x);return}}walk(c)}else if(c.nodeType===3){const x=c.textContent.trim().replace(/\\s+/g,' ');if(x.length>1&&!seen.has(x)){seen.add(x);out.push(x)}}})};walk(document.body);const r=out.join('\\n');navigator.clipboard.writeText(r).then(()=>console.log('✅ Copied '+r.length+' chars. Now take a full-page screenshot.')).catch(()=>console.log(r))})();`

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
              This works in two parts: a <strong>content script</strong> grabs all the text and image links,
              and a <strong>screenshot</strong> shows the exact design. Together, Claude rebuilds a clean,
              editable copy that matches the original — even for heavy page-builder sites.
            </p>

            <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
              <p style={{ fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: '14px', marginBottom: '12px' }}>
                📋 How to capture (do this on the page you want to clone):
              </p>
              <ol style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.9, paddingLeft: '18px', margin: 0 }}>
                <li><strong>Step 1 — Content:</strong> Open the page → press <code style={c}>F12</code> → click the <strong>Console</strong> tab</li>
                <li>Paste the script below, hit Enter (type <code style={c}>allow pasting</code> first if asked). It copies the content to your clipboard → paste it into the <strong>Page Content</strong> box below.</li>
                <li><strong>Step 2 — Screenshot:</strong> Press <code style={c}>Ctrl+Shift+P</code> → type <strong>"screenshot"</strong> → click <strong>"Capture full size screenshot"</strong>. It saves a PNG of the whole page.</li>
                <li>Upload that PNG in the <strong>Screenshot</strong> box below. (Big screenshots are auto-resized — no need to worry about size.)</li>
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
              <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>
                Click the box to select all, then copy.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={l}>Page Title (for saving)</label>
              <input className="input" type="text" placeholder="e.g. Ultra Liver Clone v1"
                value={pageTitle} onChange={e => setPageTitle(e.target.value)} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={l}>Page Content (from the capture script)</label>
              <textarea className="input" rows={8} value={rawHtml}
                onChange={e => setRawHtml(e.target.value)}
                placeholder="Paste the output of the capture script here — text, headings, image URLs..."
                style={{ fontFamily: 'monospace', fontSize: '12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>
                This gives Claude the exact copy and image links.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={l}>Screenshot (strongly recommended for accuracy)</label>
              <input type="file" accept="image/*" onChange={handleScreenshot}
                style={{ color: 'var(--text-muted)', fontSize: '13px' }} />
              {screenshot && (
                <img src={screenshot} alt="preview" style={{ marginTop: '10px', maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)' }} />
              )}
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>
                This shows Claude the exact layout, colors and fonts to match.
              </p>
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
              Rebuilding a clean, editable copy that matches the original design.
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

const l: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 600,
  fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'rgba(255,255,255,0.7)',
}
const c: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '3px', fontSize: '12px',
}