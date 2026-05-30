'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, SavedPage } from '@/lib/supabase'
import { Suspense } from 'react'

function PreviewContent() {
  const params = useSearchParams()
  const id = params.get('id')
  const [page, setPage] = useState<SavedPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop')

  useEffect(() => {
    if (!id) return
    async function load() {
      const { data } = await supabase.from('saved_pages').select('*').eq('id', id).single()
      if (data) setPage(data)
      setLoading(false)
    }
    load()
  }, [id])

  function copyHTML() {
    if (!page) return
    navigator.clipboard.writeText(page.html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function downloadHTML() {
    if (!page) return
    const blob = new Blob([page.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${page.title.replace(/\s+/g, '-').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div className="spinner" style={{ width: '32px', height: '32px' }} />
    </div>
  )

  if (!page) return (
    <div style={{ textAlign: 'center', padding: '80px 40px' }}>
      <p style={{ color: 'var(--text-muted)' }}>Page not found.</p>
      <Link href="/" style={{ color: 'var(--accent)' }}>Go home</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', flexShrink: 0 }}>← Home</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {page.title}
          </span>
          <div className="tag" style={{ fontSize: '11px', flexShrink: 0 }}>{page.type}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', background: 'var(--dark-3)', borderRadius: '6px', padding: '3px', border: '1px solid var(--border)' }}>
            {(['desktop', 'mobile'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  background: view === v ? 'var(--dark-2)' : 'transparent',
                  border: view === v ? '1px solid var(--border)' : '1px solid transparent',
                  borderRadius: '4px',
                  color: view === v ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  padding: '5px 12px',
                  transition: 'all 0.15s',
                }}
              >
                {v === 'desktop' ? '🖥 Desktop' : '📱 Mobile'}
              </button>
            ))}
          </div>

          <button className="btn-secondary" onClick={downloadHTML} style={{ padding: '8px 16px', fontSize: '13px' }}>
            ↓ Download
          </button>
          <button className="btn-primary" onClick={copyHTML} style={{ padding: '8px 20px', fontSize: '13px' }}>
            {copied ? '✓ Copied!' : 'Copy HTML'}
          </button>
        </div>
      </div>

      {/* Shopify tip */}
      <div style={{ background: 'rgba(255,77,0,0.08)', borderBottom: '1px solid rgba(255,77,0,0.15)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,150,100,0.9)' }}>
          💡 <strong>To publish on Shopify:</strong> Copy HTML → Shopify Admin → Online Store → Pages → Add Page → click <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '3px' }}>&lt;/&gt;</code> → Paste → Save
        </span>
      </div>

      {/* Preview iframe */}
      <div style={{
        flex: 1,
        background: '#e5e5e5',
        overflowY: 'auto',
        padding: view === 'mobile' ? '24px' : '0',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <iframe
          srcDoc={page.html}
          style={{
            width: view === 'mobile' ? '390px' : '100%',
            height: view === 'mobile' ? '844px' : '5000px',
            border: view === 'mobile' ? '8px solid #222' : 'none',
            borderRadius: view === 'mobile' ? '32px' : '0',
            background: '#fff',
            display: 'block',
          }}
          title="Page Preview"
        />
      </div>
    </div>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}><div className="spinner" style={{ width: '32px', height: '32px' }} /></div>}>
      <PreviewContent />
    </Suspense>
  )
}