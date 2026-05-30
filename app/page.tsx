'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase, SavedPage } from '@/lib/supabase'

export default function Home() {
  const [savedPages, setSavedPages] = useState<SavedPage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPages() {
      const { data } = await supabase
        .from('saved_pages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6)
      if (data) setSavedPages(data)
      setLoading(false)
    }
    fetchPages()
  }, [])

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 40px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>
          adforge <span style={{ color: 'var(--accent)' }}>builder</span>
        </div>
        <Link href="/saved" style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none', fontFamily: 'var(--font-display)' }}>
          Saved pages →
        </Link>
      </nav>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 40px 40px' }}>
        {/* Hero */}
        <div style={{ marginBottom: '64px' }}>
          <div className="tag" style={{ marginBottom: '20px' }}>Advertorial Builder</div>
          <h1 style={{
            fontSize: 'clamp(40px, 5vw, 64px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: '20px',
          }}>
            Clone any landing page.<br />
            <span style={{ color: 'var(--accent)' }}>Ship in minutes.</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '520px', lineHeight: 1.6 }}>
            Paste any page's HTML and get a pixel-perfect clone ready to deploy on Shopify in seconds.
          </p>
        </div>

        {/* Clone only */}
        <div style={{ marginBottom: '64px' }}>
          <Link href="/clone" style={{ textDecoration: 'none' }}>
            <div className="card" style={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              maxWidth: '400px',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: 'rgba(255,77,0,0.12)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', marginBottom: '20px'
              }}>📋</div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                Clone a Page
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                Paste any page's HTML. AI replicates it 1:1 — every section, color, font and layout. Ready for Shopify.
              </p>
              <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px' }}>
                Start cloning →
              </div>
            </div>
          </Link>
        </div>

        {/* Recent pages */}
        {!loading && savedPages.length > 0 && (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>Recently saved</h3>
              <Link href="/saved" style={{ color: 'var(--accent)', fontSize: '14px', textDecoration: 'none', fontFamily: 'var(--font-display)' }}>View all</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {savedPages.map(page => (
                <Link key={page.id} href={`/preview?id=${page.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--dark-3)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                    <div className="tag" style={{ marginBottom: '10px', fontSize: '11px' }}>
                      {page.type === 'clone' ? 'Cloned' : 'Template'}
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', lineHeight: 1.3 }}>{page.title}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {new Date(page.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}