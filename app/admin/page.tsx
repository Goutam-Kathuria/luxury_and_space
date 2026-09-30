'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Eye, Image as ImageIcon, Layers3, Play, Save, Sparkles, Upload, Video, WandSparkles } from 'lucide-react'
import { defaultContent, getOverrides, getSessionToken, resolveContent, saveOverrides, sitePages } from '@/lib/content'
import { ExperienceScene } from '@/components/experience-scene'

type Kind = 'luxury' | 'space'
type Panel = 'dashboard' | 'editor' | 'pages' | 'media' | 'lab' | 'session'
const nav = [['dashboard', 'Dashboard'], ['editor', 'Hero / content'], ['pages', 'Page manager'], ['media', 'Media library'], ['lab', '3D lab'], ['session', 'Session / preview']] as const
const fields = [
  ['title', 'Hero title', 'input'], ['subtitle', 'Supporting thought', 'textarea'], ['cta', 'Primary CTA', 'input'],
  ['heroImage', 'Hero image URL', 'input'], ['heroVideo', 'Hero video URL', 'input'], ['backgroundMedia', 'Background media URL', 'input'],
  ['modelColor', '3D material color', 'color'], ['animationSpeed', 'Animation intensity', 'range'], ['navLabel', 'Navigation label', 'input'], ['accentColor', 'Accent color', 'color'], ['cursorMode', 'Cursor mode', 'select'], ['grain', 'Film grain strength', 'range'], ['heroHeight', 'Hero height', 'range'],
]

function AdminCursor() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const move = (event: PointerEvent) => {
      node.style.transform = `translate3d(${event.clientX + 13}px, ${event.clientY + 13}px, 0)`
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])
  return <div ref={ref} className="admin-funny-cursor" aria-hidden="true"><span>✦</span><i>nice.</i></div>
}

export default function AdminPage() {
  const [tab, setTab] = useState<Kind>('luxury')
  const [panel, setPanel] = useState<Panel>('dashboard')
  const [draft, setDraft] = useState<any>(defaultContent.luxury)
  const [saved, setSaved] = useState(false)
  const [visible, setVisible] = useState(true)
  const [previewMode, setPreviewMode] = useState<'scene' | 'media'>('scene')
  const [toast, setToast] = useState('')
  const [assets, setAssets] = useState<{ name: string; url: string; type: string }[]>([])
  const pagesForTab = tab === 'luxury' ? sitePages.luxury : sitePages.space
  const pageNames = Object.keys(pagesForTab)
  const [pageKey, setPageKey] = useState<string>(tab === 'luxury' ? 'Collection' : 'Origin')
  const [pageDraft, setPageDraft] = useState<any>({})
  const overrides = getOverrides<any>()
  useEffect(() => { getSessionToken(); const resolved = resolveContent((defaultContent as any)[tab], (overrides as any)[tab] || {}); setDraft(resolved); setVisible(resolved.visible !== false); setPageKey(tab === 'luxury' ? 'Collection' : 'Origin') }, [tab])
  useEffect(() => {
    const base = (pagesForTab as any)[pageKey]
    const savedPage = (overrides as any)[tab]?.pages?.[pageKey] || {}
    setPageDraft(resolveContent(base || {}, savedPage))
  }, [tab, pageKey])
  const session = useMemo(() => getSessionToken()?.slice(0, 8) || 'offline', [])
  const update = (key: string, value: any) => setDraft((d: any) => ({ ...d, [key]: value }))
  const updateNested = (key: string, value: any) => setDraft((d: any) => ({ ...d, sections: { ...(d.sections || {}), [key]: value } }))
  function save() { saveOverrides({ ...getOverrides<any>(), [tab]: { ...draft, visible, pages: { ...(draft.pages || {}), ...(getOverrides<any>()[tab]?.pages || {}) } } }); setSaved(true); setToast('Hero and site settings shipped to the active session.'); setTimeout(() => { setSaved(false); setToast('') }, 1800) }
  function savePage() {
    const current = getOverrides<any>()
    const next = { ...current, [tab]: { ...(current[tab] || {}), pages: { ...(current[tab]?.pages || {}), [pageKey]: pageDraft } } }
    saveOverrides(next)
    setSaved(true)
    setToast(`${pageKey} page shipped. Open the page to see the new copy/media.`)
    setTimeout(() => { setSaved(false); setToast('') }, 1800)
  }
  function resetPage() { setPageDraft(resolveContent((pagesForTab as any)[pageKey] || {}, {})); setToast(`${pageKey} restored to the seeded page.`) }
  function handleAsset(file?: File) { if (!file) return; const url = URL.createObjectURL(file); const asset = { name: file.name, url, type: file.type }; setAssets(a => [asset, ...a]); if (file.type.startsWith('video')) update('heroVideo', url); else update('heroImage', url); setToast(`${file.name} is live in preview. Hit Ship changes when it feels right.`) }
  const panelTitle = panel === 'dashboard' ? 'What are we cooking?' : panel === 'media' ? 'Swap the vibe' : panel === 'pages' ? 'Edit every route, not just the homepage' : panel === 'lab' ? 'Let\'s see what this does' : 'Shape the experience'
  return <main className="admin-page"><AdminCursor />
    <aside className="admin-rail"><div className="admin-logo"><span>✳</span> / CONTROL</div><div className="rail-status"><i /> SESSION ACTIVE<br /><small>{session} / TOKEN READY</small></div><nav><p>WORKSPACES</p>{nav.map(([id, label]) => <button key={id} className={panel === id ? 'active' : ''} onClick={() => setPanel(id)}>{id === 'dashboard' ? '◈' : id === 'editor' ? '✦' : id === 'pages' ? '⌘' : id === 'media' ? '▧' : id === 'lab' ? '◌' : '◎'} {label}</button>)}<p>EXPERIENCES</p><button className={tab === 'luxury' ? 'active' : ''} onClick={() => { setTab('luxury'); setPanel('editor') }}>✦ Luxury / 01</button><button className={tab === 'space' ? 'active' : ''} onClick={() => { setTab('space'); setPanel('editor') }}>◌ Space / 02</button></nav><div className="rail-bottom">What are we cooking?<br /><span>Try clicking something.</span></div></aside>
    <section className="admin-main"><header className="admin-header"><div><span className="crumb">CONTROL ROOM / {tab.toUpperCase()} / SESSION {session}</span><h1>{panelTitle} <Sparkles /></h1></div><div className="admin-actions"><span className="saved-state">{saved ? <><Check /> Saved.</> : 'Autosave-ready workspace'}</span><button className="save-button" onClick={save}><Save /> {saved ? 'Saved' : 'Ship changes'}</button></div></header>
      {panel === 'dashboard' && <div className="admin-dashboard"><div className="workspace-card luxury-card"><span>✦ LUXURY WORKSPACE</span><h2>{defaultContent.luxury.title}</h2><p>Editorial objects, material studies, and the atelier scene.</p><button onClick={() => { setTab('luxury'); setPanel('editor') }}>Open Luxury <Eye /></button></div><div className="workspace-card space-card"><span>◌ SPACE WORKSPACE</span><h2>{defaultContent.space.title}</h2><p>Mission control, orbital systems, and a living starfield.</p><button onClick={() => { setTab('space'); setPanel('editor') }}>Open Space <Eye /></button></div><div className="activity-card"><span>SESSION SIGNAL</span><strong>{session}</strong><p>One token. Every edit. Recursive fallback is online.</p><div className="signal-line"><i /> Preview connected <i /> Content ready</div></div><div className="activity-card"><span>RECENTLY LOADED</span><strong>{assets.length ? `${assets.length} local asset${assets.length > 1 ? 's' : ''}` : 'Demo media set'}</strong><p>{assets.length ? 'Your uploaded files are previewing in this session.' : 'Images, video, and a procedural 3D object are ready to explore.'}</p><button className="text-button" onClick={() => setPanel('media')}>Open media library</button></div></div>}
      {panel === 'editor' && <div className="admin-body"><div className="editor-panel"><div className="panel-title"><span>{tab.toUpperCase()} / CONTENT WORKBENCH</span><span className="live-pill"><Eye /> LIVE PREVIEW</span></div><div className="field-grid">{fields.map(([key, label, type]) => <label key={key}>{label}{type === 'textarea' ? <textarea value={draft[key] || ''} onChange={e => update(key, e.target.value)} /> : type === 'range' ? <><input type="range" min="0.2" max="2" step="0.1" value={draft[key] || 1} onChange={e => update(key, Number(e.target.value))} /><output>{draft[key] || 1}</output></> : type === 'select' ? <select value={draft[key] || 'magnetic'} onChange={e => update(key, e.target.value)}><option value="magnetic">Magnetic hover</option><option value="crosshair">Crosshair</option><option value="minimal">Minimal</option></select> : <input type={type === 'color' ? 'color' : 'text'} value={draft[key] || (type === 'color' ? '#b9874f' : '')} onChange={e => update(key, e.target.value)} />}</label>)}</div><div className="editor-section"><span>SECTION COPY / {tab === 'space' ? 'ORIGIN · MISSIONS · FUTURE' : 'STORY · OBJECT · CTA'}</span><label>Story / origin<textarea value={draft.sections?.story || ''} onChange={e => updateNested('story', e.target.value)} /></label><label>Object / mission<textarea value={draft.sections?.object || ''} onChange={e => updateNested('object', e.target.value)} /></label><label>Final / future<textarea value={draft.sections?.final || ''} onChange={e => updateNested('final', e.target.value)} /></label></div><div className="editor-section"><span>CONTENT MANAGEMENT</span><div className="control-row"><button className={visible ? 'toggle-on' : ''} onClick={() => setVisible(v => !v)}>Visibility: {visible ? 'Published' : 'Hidden'}</button><button onClick={() => setToast('Section order updated. The atelier is keeping its secrets for now.')}>Ordering</button><button onClick={() => setPreviewMode(previewMode === 'scene' ? 'media' : 'scene')}>{previewMode === 'scene' ? 'Preview media' : 'Preview 3D'}</button></div><small>Changes are scoped to {session} and recursively fall back to demo content.</small><div className="admin-experiments"><span>EXPERIMENTS</span><button onClick={() => setToast('The interface blinked. It is pretending nothing happened.')}>Trigger anomaly</button><button onClick={() => setToast('A tiny mothership is now circling the preview.')}>Spawn easter egg</button><button onClick={() => setToast('Parallax depth calibrated. Scroll like you mean it.')}>Calibrate scroll</button></div></div></div><Preview tab={tab} draft={draft} visible={visible} previewMode={previewMode} setToast={setToast} /></div>}
      {panel === 'pages' && <div className="page-manager"><div className="page-manager-head"><div><span>ROUTE CONTENT / {tab.toUpperCase()}</span><h2>Every inner page is editable.</h2><p>Titles, descriptions, tags and hero imagery now flow through the same session API as the homepage.</p></div><div className="page-switcher">{pageNames.map(name => <button key={name} className={pageKey === name ? 'active' : ''} onClick={() => setPageKey(name)}>{name}</button>)}</div></div><div className="page-manager-grid"><div className="editor-panel"><div className="panel-title"><span>{tab.toUpperCase()} / {pageKey.toUpperCase()}</span><span className="live-pill"><Eye /> ROUTE LIVE</span></div><div className="field-grid"><label>Page title<input value={pageDraft.title || ''} onChange={e => setPageDraft((d:any) => ({ ...d, title:e.target.value }))} /></label><label>Eyebrow / tag<input value={pageDraft.tag || ''} onChange={e => setPageDraft((d:any) => ({ ...d, tag:e.target.value }))} /></label><label className="full-field">Page copy<textarea value={pageDraft.copy || ''} onChange={e => setPageDraft((d:any) => ({ ...d, copy:e.target.value }))} /></label><label className="full-field">Route hero image URL<input value={pageDraft.image || ''} onChange={e => setPageDraft((d:any) => ({ ...d, image:e.target.value }))} /></label></div><div className="control-row"><button onClick={savePage}><Save /> Ship page</button><button onClick={resetPage}>Reset seeded page</button><a className="admin-route-link" href={`${tab === 'luxury' ? '/luxury' : '/space'}/${pageKey.toLowerCase()}`}>Open route ↗</a></div></div><div className="route-admin-preview"><img src={pageDraft.image} alt="" /><div><span>{pageDraft.tag}</span><h3>{pageDraft.title}</h3><p>{pageDraft.copy}</p></div></div></div></div>}
      {panel === 'media' && <div className="media-library"><div className="upload-card"><Upload /><h2>Drop a new piece into the library</h2><p>Images and videos become immediately selectable in the live preview. Local demo storage keeps this prototype honest.</p><label className="upload-button">Choose asset<input type="file" accept="image/*,video/*" onChange={e => handleAsset(e.target.files?.[0])} /></label></div><div className="asset-wall">{assets.length ? assets.map(asset => <article key={asset.url}>{asset.type.startsWith('video') ? <video src={asset.url} muted autoPlay loop playsInline /> : <img src={asset.url} alt={asset.name} />}<strong>{asset.name}</strong><small>{asset.type} · live session asset</small><button onClick={() => { update(asset.type.startsWith('video') ? 'heroVideo' : 'heroImage', asset.url); setToast('Assigned to the active hero. Preview it in Session / preview.') }}>Use for active hero</button></article>) : <div className="empty-assets">No custom assets yet. The seeded images and video are already doing the heavy lifting.</div>}</div></div>}
      {panel === 'lab' && <div className="lab-layout"><div className="lab-copy"><span>PROCEDURAL MODEL / ATELIER CORE</span><h2>Inspect the object.</h2><p>Drag to rotate. Scroll to move the camera. Hover to wake the material. Click it if you are curious.</p><button onClick={() => setToast('Model assignment saved to the active session.')}>Assign this model</button></div><ExperienceScene space={tab === 'space'} color={draft.modelColor || '#b9874f'} onDiscover={() => setToast('Object inspected. Details unlocked.')} /></div>}
      {panel === 'session' && <div className="session-layout"><div className="session-card"><span>CURRENT SESSION</span><strong>{session}</strong><p>This token is generated once in your browser and reused for every edit. No manual create button. Exactly as it should be.</p><button onClick={() => { setPreviewMode('scene'); setPanel('editor') }}>Open live preview</button></div><Preview tab={tab} draft={draft} visible={visible} previewMode="scene" setToast={setToast} /></div>}
    </section>{toast && <div className="admin-toast">{toast}<button onClick={() => setToast('')}>Dismiss</button></div>}
  </main>
}

function Preview({ tab, draft, visible, previewMode, setToast }: any) { return <div className="preview-panel"><div className="preview-top"><span>PREVIEW / {tab.toUpperCase()}</span><span className="preview-live"><i /> LIVE</span></div>{previewMode === 'scene' ? <><ExperienceScene space={tab === 'space'} color={draft.modelColor || (tab === 'space' ? '#2b9ac0' : '#b9874f')} onDiscover={() => setToast(tab === 'space' ? 'Target locked. Mission data revealed.' : 'Material discovered. The object noticed you.')} /><div className="preview-copy"><span>{tab === 'space' ? 'INTERACTIVE ORBIT' : 'INTERACTIVE OBJECT'}</span><h2>{draft.title}</h2><p>{draft.subtitle}</p></div></> : <div className="media-preview">{draft.heroVideo ? <video src={draft.heroVideo} poster={draft.heroImage} controls muted loop autoPlay playsInline /> : draft.heroImage ? <img src={draft.heroImage} alt="Current hero asset" /> : <p>Add a hero image or video URL to preview it here.</p>}<span><Play /> CURRENT HERO MEDIA</span></div>}<div className="preview-foot"><span>Scroll / drag the object</span><span>Data: {visible ? 'visible' : 'hidden'}</span></div></div> }
