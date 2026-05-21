'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const TEMPLATES = [
  {
    id: 'advertorial-news',
    name: 'News-Style Advertorial',
    description: 'Looks like a news article. Top urgency bar, journalist byline, inline CTA.',
    badge: '🔥 Most popular',
    fields: ['headline', 'subheadline', 'body_copy', 'product_name', 'cta_text', 'offer', 'author_name', 'page_title'],
  },
  {
    id: 'advertorial-listicle',
    name: 'Listicle Advertorial',
    description: '"7 Reasons Why..." style. Numbered benefits, social proof, sticky CTA.',
    badge: '📋 Listicle',
    fields: ['headline', 'intro_copy', 'benefits', 'product_name', 'cta_text', 'offer', 'page_title'],
  },
  {
    id: 'advertorial-story',
    name: 'Story / Before & After',
    description: 'Personal story format. Problem → Discovery → Transformation → CTA.',
    badge: '📖 Story',
    fields: ['headline', 'story_intro', 'problem', 'discovery', 'result', 'product_name', 'cta_text', 'offer', 'page_title'],
  },
  {
    id: 'advertorial-review',
    name: 'Review / Editorial',
    description: 'Honest review format. Star rating, pros list, verdict, and buy box.',
    badge: '⭐ Review',
    fields: ['headline', 'intro_copy', 'pros', 'verdict', 'product_name', 'cta_text', 'offer', 'page_title'],
  },
]

const FIELD_CONFIG: Record<string, { label: string, placeholder: string, type: string, rows?: number }> = {
  headline: { label: 'Main Headline', placeholder: 'e.g. From Dead For 60 Seconds Every Night To Sleeping 8 Hours Straight', type: 'textarea', rows: 2 },
  subheadline: { label: 'Subheadline / Hook', placeholder: 'e.g. Stock running low — 70% OFF today only', type: 'textarea', rows: 2 },
  body_copy: { label: 'Body Copy', placeholder: 'Paste your main article/story copy here...', type: 'textarea', rows: 8 },
  intro_copy: { label: 'Intro Paragraph', placeholder: 'Hook the reader in the first 2-3 sentences...', type: 'textarea', rows: 4 },
  story_intro: { label: 'Story Opening', placeholder: 'Start with the character and their problem...', type: 'textarea', rows: 4 },
  problem: { label: 'The Problem', placeholder: 'Describe the pain point in vivid detail...', type: 'textarea', rows: 4 },
  discovery: { label: 'The Discovery', placeholder: 'How did they find your product?', type: 'textarea', rows: 4 },
  result: { label: 'The Transformation / Result', placeholder: 'What changed? Be specific with numbers if possible.', type: 'textarea', rows: 4 },
  benefits: { label: 'Key Benefits (one per line)', placeholder: 'Supports all sleep positions\nReduces snoring\nAdjustable firmness', type: 'textarea', rows: 6 },
  pros: { label: 'Pros List (one per line)', placeholder: 'Ergonomic butterfly design\nCertified materials\n60-night trial', type: 'textarea', rows: 5 },
  verdict: { label: 'Review Verdict', placeholder: 'e.g. After 3 weeks of testing, this is the real deal for anyone with neck pain...', type: 'textarea', rows: 3 },
  product_name: { label: 'Product Name', placeholder: 'e.g. Derila Ergo Pillow', type: 'input' },
  cta_text: { label: 'CTA Button Text', placeholder: 'e.g. CHECK AVAILABILITY', type: 'input' },
  offer: { label: 'Offer / Discount', placeholder: 'e.g. 70% OFF Today Only', type: 'input' },
  author_name: { label: 'Author / Journalist Name', placeholder: 'e.g. Sarah Mitchell, Health Reporter', type: 'input' },
  page_title: { label: 'Page Title (for saving)', placeholder: 'e.g. Sleep Pillow Advertorial v1', type: 'input' },
}

export default function TemplatePage() {
  const router = useRouter()
  const [step, setStep] = useState<'pick' | 'copy' | 'generating'>('pick')
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null)
  const [copy, setCopy] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  async function handleGenerate() {
    if (!copy.page_title) return setError('Please add a page title')
    setStep('generating')
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'template', templateId: selectedTemplate!.id, copy }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      const saveRes = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: copy.page_title,
          html: data.html,
          type: 'template',
          template_name: selectedTemplate!.id,
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
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Use a Template</span>
      </nav>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '60px 40px' }}>

        {step === 'pick' && (
          <div className="fade-in">
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>Pick your template</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '40px', lineHeight: 1.6 }}>
              These are proven advertorial formats that convert. Pick the one that fits your angle.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {TEMPLATES.map(t => (
                <div
                  key={t.id}
                  className="card"
                  onClick={() => { setSelectedTemplate(t); setStep('copy') }}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  }}
                >
                  <div className="tag" style={{ marginBottom: '14px', fontSize: '11px' }}>{t.badge}</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.01em' }}>{t.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>{t.description}</p>
                  <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px' }}>
                    Use this template →
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'copy' && selectedTemplate && (
          <div className="fade-in">
            <button onClick={() => setStep('pick')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', marginBottom: '24px', padding: 0 }}>
              ← Change template
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>{selectedTemplate.name}</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '36px', lineHeight: 1.6 }}>
              Fill in your copy below. The more detail you give, the better the output.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {selectedTemplate.fields.map(fieldKey => {
                const field = FIELD_CONFIG[fieldKey]
                if (!field) return null
                return (
                  <div key={fieldKey}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="input"
                        rows={field.rows}
                        placeholder={field.placeholder}
                        value={copy[fieldKey] || ''}
                        onChange={e => setCopy(p => ({ ...p, [fieldKey]: e.target.value }))}
                      />
                    ) : (
                      <input
                        className="input"
                        type="text"
                        placeholder={field.placeholder}
                        value={copy[fieldKey] || ''}
                        onChange={e => setCopy(p => ({ ...p, [fieldKey]: e.target.value }))}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            {error && <p style={{ color: '#ff6b6b', fontSize: '14px', marginTop: '16px' }}>{error}</p>}
            <button className="btn-primary" onClick={handleGenerate} style={{ width: '100%', marginTop: '32px' }}>
              Generate Landing Page →
            </button>
          </div>
        )}

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
