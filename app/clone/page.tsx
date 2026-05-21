'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const COPY_FIELDS = [
  { key: 'headline', label: 'Main Headline', placeholder: 'From "Dead For 60 Seconds" Every Night... To Sleeping 8 Hours Straight', type: 'textarea', rows: 2 },
  { key: 'subheadline', label: 'Subheadline / Hook', placeholder: 'New Year\'s Sale: This pillow is in high demand, stock running low FAST', type: 'textarea', rows: 2 },
  { key: 'body_copy', label: 'Body Copy', placeholder: 'Tell the story of your product. What problem does it solve? What\'s the transformation?', type: 'textarea', rows: 6 },
  { key: 'product_name', label: 'Product Name', placeholder: 'Derila Ergo Pillow', type: 'input' },
  { key: 'cta_text', label: 'CTA Button Text', placeholder: 'CHECK AVAILABILITY', type: 'input' },
  { key: 'offer', label: 'Offer / Discount', placeholder: '70% OFF Today Only', type: 'input' },
  { key: 'page_title', label: 'Page Title (for saving)', placeholder: 'Sleep Apnea Advertorial - Jan 2025', type: 'input' },
]

export default function ClonePage() {
  const router = useRouter()
  const [step, setStep] = useState<'url' | 'copy' | 'generating'>('url')
  const [url, setUrl] = useState('')
  const [copy, setCopy] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [scraping, setScraping] = useState(false)

  async function handleScrape() {
    if (!url) return setError('Please enter a URL')
    setScraping(true)
    setError('')
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to scrape')
      setStep('copy')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setScraping(false)
    }
  }

  async function handleGenerate() {
    if (!copy.page_title) return setError('Please add a page title')
    setStep('generating')
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'clone', url, copy }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      const saveRes = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: copy.page_title,
          html: data.html,
          type: 'clone',
          source_url: url,
        }),
      })
      const saved = await saveRes.json()
      router.push(`/preview?id=${saved.id}`)
    } catch (e: any) {
      setError(e.message)
      setStep('copy')
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 40px', height: '60px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px' }}>← Back</Link>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Clone a URL</span>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '60px 40px' }}>

        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '48px' }}>
          {['Paste URL', 'Your Copy', 'Generate'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: i <= ['url', 'copy', 'generating'].indexOf(step) ? 'var(--accent)' : 'var(--dark-3)',
                border: `1px solid ${i <= ['url', 'copy', 'generating'].indexOf(step) ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-display)',
                transition: 'all 0.3s',
              }}>{i + 1}</div>
              <span style={{ fontSize: '13px', color: i <= ['url', 'copy', 'generating'].indexOf(step) ? '#fff' : 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{s}</span>
              {i < 2 && <div style={{ width: '32px', height: '1px', background: 'var(--border)' }} />}
            </div>
          ))}
        </div>

        {/* Step 1: URL */}
        {step === 'url' && (
          <div className="fade-in">
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>Paste the landing page URL</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
              Find a winning advertorial you want to clone — could be a competitor's, a native ad you saw, anything. We'll grab its structure.
            </p>
            <input
              className="input"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/article/product-advertorial"
              onKeyDown={e => e.key === 'Enter' && handleScrape()}
              style={{ marginBottom: '16px' }}
            />
            {error && <p style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}
            <button className="btn-primary" onClick={handleScrape} disabled={scraping} style={{ width: '100%' }}>
              {scraping ? <><span className="spinner" style={{ marginRight: '10px' }} />Scraping structure...</> : 'Scrape Structure →'}
            </button>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>
              Tip: Right-click any page → "Copy page source" and you can also paste HTML directly
            </p>
          </div>
        )}

        {/* Step 2: Copy */}
        {step === 'copy' && (
          <div className="fade-in">
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>Add your copy</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
              Fill in your product's copy. The AI will inject this into the cloned template structure.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {COPY_FIELDS.map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="input"
                      rows={field.rows}
                      placeholder={field.placeholder}
                      value={copy[field.key] || ''}
                      onChange={e => setCopy(p => ({ ...p, [field.key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      className="input"
                      type="text"
                      placeholder={field.placeholder}
                      value={copy[field.key] || ''}
                      onChange={e => setCopy(p => ({ ...p, [field.key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
            {error && <p style={{ color: '#ff6b6b', fontSize: '14px', marginTop: '16px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button className="btn-secondary" onClick={() => setStep('url')}>← Back</button>
              <button className="btn-primary" onClick={handleGenerate} style={{ flex: 1 }}>
                Generate Landing Page →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 'generating' && (
          <div className="fade-in" style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '24px' }}>⚡</div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>Building your page...</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Claude is generating your advertorial.<br />This takes about 15–30 seconds.
            </p>
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
