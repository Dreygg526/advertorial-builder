'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, SavedPage } from '@/lib/supabase'

export default function SavedPages() {
  const [pages, setPages] = useState<SavedPage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('saved_pages')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setPages(data)
      setLoading(false)
    }
    load()
  }, [])

  async function deletePage(id: string) {
    if (!confirm('Delete this page?')) return
    await supabase.from('saved_pages').delete().eq('id', id)
    setPages(p => p.filter(page => page.id !== id))
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 40px', height: '60px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px' }}>← Back</Link>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Saved Pages</span>
      </nav>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '60px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>All saved pages</h1>
          <Link href="/">
            <button className="btn-primary">+ New page</button>
          </Link>
        </div>

        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" style={{ width: '32px', height: '32px' }} /></div>}

        {!loading && pages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No pages yet</p>
            <p style={{ fontSize: '14px', marginBottom: '24px' }}>Generate your first advertorial to see it here</p>
            <Link href="/"><button className="btn-primary">Create first page</button></Link>
          </div>
        )}

        {!loading && pages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pages.map(page => (
              <div key={page.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                  <div className="tag" style={{ fontSize: '11px', flexShrink: 0 }}>{page.type}</div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.title}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {new Date(page.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {page.source_url && <span> · {page.source_url.replace(/^https?:\/\//, '').slice(0, 40)}...</span>}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                  <Link href={`/preview?id=${page.id}`}>
                    <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>Preview</button>
                  </Link>
                  <button
                    onClick={() => deletePage(page.id)}
                    style={{ background: 'none', border: '1px solid rgba(255,100,100,0.2)', borderRadius: '6px', color: 'rgba(255,100,100,0.6)', cursor: 'pointer', padding: '8px 14px', fontSize: '13px', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,100,100,0.5)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,100,100,0.9)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,100,100,0.2)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,100,100,0.6)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
