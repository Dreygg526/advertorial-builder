'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ClonePage() {
  const router = useRouter()
  const [step, setStep] = useState<'input' | 'generating'>('input')
  const [rawHtml, setRawHtml] = useState('')
  const [pageTitle, setPageTitle] = useState('')
  const [error, setError] = useState('')

  async function handleGenerate() {
    
    if (!rawHtml.trim()) return setError('Please paste the page HTML')
    if (!pageTitle.trim()) return setError('Please add a page title')
    setStep('generating')
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'clone', scrapedHtml: rawHtml }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      const saveRes = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pageTitle,
          html: data.html,
          type: 'clone'
        
        }),
      })
      const saved = await saveRes.json()
      router.push(`/preview?id=${saved.id}`)
    } catch (e: any) {
      setError(e.message)
      setStep('input')
    }
  }

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
              We take screenshots of the page for the visual design, plus use the HTML for content. Together = the most accurate clone possible.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>
                Page Title (for saving)
              </label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Hollow Socks Clone v1"
                value={pageTitle}
                onChange={e => setPageTitle(e.target.value)}
              />
            </div>

            

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>
                Page HTML
              </label>
              <textarea
                className="input"
                rows={10}
                value={rawHtml}
                onChange={e => setRawHtml(e.target.value)}
                placeholder="Inspect the page → right-click <body> tag → Copy → Copy outerHTML → paste here"
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>
                This gives Claude all the text content, images, and structure.
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
            <div style={{ fontSize: '48px', marginBottom: '24px' }}>📸</div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>Cloning your page...</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '8px' }}>
              Taking screenshots + analyzing HTML then rebuilding as clean Shopify-ready HTML.
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