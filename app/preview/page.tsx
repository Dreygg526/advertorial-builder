'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, SavedPage } from '@/lib/supabase'
import { Suspense } from 'react'

function PreviewContent() {
  const params = useSearchParams()
  const id = params.get('id')
  const [page, setPage] = useState<SavedPage | null>(null)
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop')
  const [editMode, setEditMode] = useState(false)
  const [imageModal, setImageModal] = useState<{ show: boolean, src: string, newSrc: string, index: number } | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!id) return
    async function load() {
      const { data } = await supabase.from('saved_pages').select('*').eq('id', id).single()
      if (data) {
        setPage(data)
        setHtml(data.html)
      }
      setLoading(false)
    }
    load()
  }, [id])

  // Listen for messages from iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'IMAGE_CLICK') {
        setImageModal({ show: true, src: e.data.src, newSrc: e.data.src, index: e.data.index })
      }
      if (e.data?.type === 'TEXT_CHANGE') {
        // Text was edited inside iframe — get updated HTML
        const doc = iframeRef.current?.contentDocument
        if (doc) {
          const updated = doc.documentElement.outerHTML
          setHtml(updated)
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  function getEditableHtml(baseHtml: string) {
    const editScript = `
<script>
(function() {
  var editMode = false;

  function enableEdit() {
    editMode = true;

    // Make text elements editable
    var textTags = ['p','h1','h2','h3','h4','h5','h6','span','a','li','td','th','button'];
    textTags.forEach(function(tag) {
      document.querySelectorAll(tag).forEach(function(el) {
        if (el.querySelector('img')) return;
        if (el.closest('[contenteditable]')) return;
        el.contentEditable = 'true';
        el.style.outline = '2px dashed rgba(255,77,0,0.5)';
        el.style.minHeight = '1em';
        el.style.cursor = 'text';
        el.addEventListener('blur', function() {
          window.parent.postMessage({ type: 'TEXT_CHANGE' }, '*');
        });
      });
    });

    // Make images replaceable
    var imgs = document.querySelectorAll('img');
    imgs.forEach(function(img, i) {
      img.style.outline = '3px solid #ff4d00';
      img.style.cursor = 'pointer';
      img.dataset.imgIndex = i;
      img.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: 'IMAGE_CLICK', src: img.src, index: i }, '*');
      });
    });
  }

  function disableEdit() {
    editMode = false;
    document.querySelectorAll('[contenteditable]').forEach(function(el) {
      el.removeAttribute('contenteditable');
      el.style.outline = '';
      el.style.cursor = '';
    });
    document.querySelectorAll('img').forEach(function(img) {
      img.style.outline = '';
      img.style.cursor = '';
    });
  }

  window.addEventListener('message', function(e) {
    if (e.data === 'ENABLE_EDIT') enableEdit();
    if (e.data === 'DISABLE_EDIT') disableEdit();
    if (e.data?.type === 'REPLACE_IMAGE') {
      var imgs = document.querySelectorAll('img');
      if (imgs[e.data.index]) {
        imgs[e.data.index].src = e.data.newSrc;
        window.parent.postMessage({ type: 'TEXT_CHANGE' }, '*');
      }
    }
  });
})();
</script>
`
    // Inject script before </body>
    if (baseHtml.includes('</body>')) {
      return baseHtml.replace('</body>', editScript + '</body>')
    }
    return baseHtml + editScript
  }

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    setTimeout(() => {
      iframe.contentWindow?.postMessage(editMode ? 'ENABLE_EDIT' : 'DISABLE_EDIT', '*')
    }, 300)
  }, [editMode, html])

  function replaceImage() {
    if (!imageModal || !iframeRef.current) return
    iframeRef.current.contentWindow?.postMessage({
      type: 'REPLACE_IMAGE',
      index: imageModal.index,
      newSrc: imageModal.newSrc,
    }, '*')
    setTimeout(() => {
      const doc = iframeRef.current?.contentDocument
      if (doc) setHtml(doc.documentElement.outerHTML)
    }, 200)
    setImageModal(null)
  }

  function copyHTML() {
    const doc = iframeRef.current?.contentDocument
    const current = doc ? doc.documentElement.outerHTML : html
    navigator.clipboard.writeText(current)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function downloadHTML() {
    if (!page) return
    const doc = iframeRef.current?.contentDocument
    const current = doc ? doc.documentElement.outerHTML : html
    const blob = new Blob([current], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${page.title.replace(/\s+/g, '-').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function saveChanges() {
    if (!page) return
    const doc = iframeRef.current?.contentDocument
    const current = doc ? doc.documentElement.outerHTML : html
    await supabase.from('saved_pages').update({ html: current }).eq('id', page.id)
    setHtml(current)
    alert('Saved!')
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

      {/* Image modal */}
      {imageModal?.show && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--dark-2)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '32px', width: '500px', maxWidth: '90vw',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Replace Image
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              Paste a new image URL to replace this image
            </p>
            {imageModal.newSrc && (
              <img
                src={imageModal.newSrc}
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px', background: '#333' }}
                onError={(e) => (e.currentTarget.style.opacity = '0.3')}
              />
            )}
            <input
              className="input"
              type="url"
              placeholder="https://cdn.shopify.com/your-image.jpg"
              value={imageModal.newSrc}
              onChange={e => setImageModal({ ...imageModal, newSrc: e.target.value })}
              style={{ marginBottom: '16px' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setImageModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn-primary" onClick={replaceImage} style={{ flex: 1 }}>Replace Image</button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: '60px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '16px', flexShrink: 0,
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
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? 'var(--dark-2)' : 'transparent',
                border: view === v ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: '4px', color: view === v ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-display)',
                fontWeight: 600, padding: '5px 12px', transition: 'all 0.15s',
              }}>
                {v === 'desktop' ? '🖥 Desktop' : '📱 Mobile'}
              </button>
            ))}
          </div>

          <button onClick={() => setEditMode(!editMode)} style={{
            background: editMode ? 'rgba(255,77,0,0.15)' : 'transparent',
            border: `1px solid ${editMode ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: '6px', color: editMode ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-display)',
            fontWeight: 600, padding: '5px 14px', transition: 'all 0.15s',
          }}>
            {editMode ? '✏️ Editing ON' : '✏️ Edit'}
          </button>

          {editMode && (
            <button className="btn-secondary" onClick={saveChanges} style={{ padding: '8px 16px', fontSize: '13px' }}>
              💾 Save
            </button>
          )}

          <button className="btn-secondary" onClick={downloadHTML} style={{ padding: '8px 16px', fontSize: '13px' }}>
            ↓ Download
          </button>
          <button className="btn-primary" onClick={copyHTML} style={{ padding: '8px 20px', fontSize: '13px' }}>
            {copied ? '✓ Copied!' : 'Copy HTML'}
          </button>
        </div>
      </div>

      {/* Edit banner */}
      {editMode && (
        <div style={{ background: 'rgba(255,77,0,0.1)', borderBottom: '1px solid rgba(255,77,0,0.2)', padding: '8px 24px' }}>
          <span style={{ fontSize: '13px', color: 'var(--accent)' }}>
            ✏️ <strong>Edit mode ON</strong> — Click any text to edit. Click any image to replace it. Hit 💾 Save when done.
          </span>
        </div>
      )}

      {/* Shopify tip */}
      {!editMode && (
        <div style={{ background: 'rgba(255,77,0,0.08)', borderBottom: '1px solid rgba(255,77,0,0.15)', padding: '10px 24px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,150,100,0.9)' }}>
            💡 <strong>To publish on Shopify:</strong> Copy HTML → Shopify Admin → Online Store → Pages → Add Page → click <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '3px' }}>&lt;/&gt;</code> → Paste → Save
          </span>
        </div>
      )}

      {/* Preview iframe */}
      <div style={{
        flex: 1, background: '#e5e5e5', overflowY: 'auto',
        padding: view === 'mobile' ? '24px' : '0',
        display: 'flex', justifyContent: 'center',
      }}>
        <iframe
          ref={iframeRef}
          srcDoc={getEditableHtml(html)}
          style={{
            width: view === 'mobile' ? '390px' : '100%',
            height: view === 'mobile' ? '844px' : '5000px',
            border: view === 'mobile' ? '8px solid #222' : 'none',
            borderRadius: view === 'mobile' ? '32px' : '0',
            background: '#fff', display: 'block',
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