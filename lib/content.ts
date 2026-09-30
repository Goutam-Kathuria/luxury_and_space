export const demoVideo = 'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4'

export const defaultContent = {
  luxury: {
    title: 'Objects of desire', subtitle: 'A study in material, light, and the rituals that make a thing unforgettable.', cta: 'Enter the atelier',
    heroImage: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=2400&q=90', heroVideo: '/media/luxury-hero.mp4',
    sections: { story: 'We make presence tangible.', object: 'Light, held.', final: 'Make room for wonder.' }, backgroundMedia: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2200&q=80', modelColor: '#b9874f', animationSpeed: 1, visible: true,
  },
  space: {
    title: 'Beyond the known', subtitle: 'A living archive of missions, machines, and the quiet courage to look farther.', cta: 'Begin the mission',
    heroVideo: demoVideo, visible: true,
  },
}

export function resolveContent<T extends Record<string, any>>(defaults: T, overrides: Partial<T> = {}): T {
  const result = { ...defaults } as T
  for (const key of Object.keys(overrides)) {
    const value = overrides[key]
    if (value && typeof value === 'object' && !Array.isArray(value) && defaults[key] && typeof defaults[key] === 'object') (result as any)[key] = resolveContent(defaults[key], value)
    else if (value !== undefined) (result as Record<string, any>)[key] = value
  }
  return result
}

export function getSessionToken() {
  if (typeof window === 'undefined') return null
  let token = localStorage.getItem('experience-session')
  if (!token) { token = crypto.randomUUID(); localStorage.setItem('experience-session', token) }
  return token
}
export function getOverrides<T>() { if (typeof window === 'undefined') return {} as Partial<T>; try { return JSON.parse(localStorage.getItem('experience-content') || '{}') as Partial<T> } catch { return {} as Partial<T> } }
export function saveOverrides(value: Record<string, unknown>) { localStorage.setItem('experience-content', JSON.stringify(value)); const token = getSessionToken(); if (token) fetch('/api/session', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ token, content:value }) }).catch(() => {}) }
export async function getSessionOverrides<T>() { const token = getSessionToken(); if (!token) return {} as Partial<T>; try { const r = await fetch(`/api/session?token=${encodeURIComponent(token)}`, { cache:'no-store' }); const data = await r.json(); return data.content || getOverrides<T>() } catch { return getOverrides<T>() } }

export const sitePages = {
  luxury: {
    Collection: { title: 'A collection in motion.', copy: 'Objects, materials and spaces revealed through layered movement, close detail and slow editorial transitions.', tag: 'CURRENT WORKS', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2400&q=88' },
    Stories: { title: 'Stories with weight.', copy: 'A living journal of process, craft, rooms and the ideas that stay after the first impression.', tag: 'THE JOURNAL', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2400&q=88' },
    Services: { title: 'The work behind the work.', copy: 'Private commissions, spatial studies and material direction shaped around the character of each project.', tag: 'ATELIER SERVICES', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2400&q=88' },
    Experience: { title: 'Enter the atmosphere.', copy: 'A sensory sequence where light, sound, material and motion become part of the object itself.', tag: 'THE EXPERIENCE', image: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=2400&q=88' },
    Contact: { title: 'Begin a conversation.', copy: 'Request a private viewing, commission discussion or material consultation with the studio.', tag: 'CONTACT / 09', image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2400&q=88' },
  },
  space: {
    Origin: { title: 'Every journey has an origin.', copy: 'Track the first signal from Earth into orbit and discover how the archive turns distance into a navigable story.', tag: 'ORIGIN / 01', image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=2400&q=88' },
    Explore: { title: 'Choose your vantage point.', copy: 'Move between worlds, lock a target and let the interface change around your chosen horizon.', tag: 'EXPLORATION', image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=2400&q=88' },
    Missions: { title: 'Four ways to leave Earth.', copy: 'A mission archive of orbital relays, deep-field listening and the long engineering required to go farther.', tag: 'MISSION CONTROL', image: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=2400&q=88' },
    Technology: { title: 'The machine is the message.', copy: 'Propulsion, navigation, materials, energy and communication presented as one connected instrument system.', tag: 'SYSTEMS / 2049', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2400&q=88' },
    Future: { title: 'We are only at the beginning.', copy: 'A forward sequence through habitats, relays and deep-space archives built for timelines measured in decades.', tag: 'FUTURE LOG', image: 'https://images.unsplash.com/photo-1447433819943-74a20887a81e?auto=format&fit=crop&w=2400&q=88' },
  },
} as const

export const luxuryGallery = [
 ['Quiet geometry','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1400&q=85'],
 ['The warm edge','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85'],
 ['Material study','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85'],
 ['Afterlight','https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85'],
]
export const missions = [{id:'01',name:'Lunar relay',detail:'A silent handshake between two horizons.',status:'COMPLETE'},{id:'02',name:'Ares descent',detail:'Reading the red planet in a new language.',status:'IN FLIGHT'},{id:'03',name:'Deep field',detail:'Listening for the shape of what comes next.',status:'QUEUED'}]
export const planets = [{name:'EARTH',code:'SOL-03',color:'#3b82f6',copy:'The original vantage point.'},{name:'MARS',code:'SOL-04',color:'#d45d45',copy:'A red horizon, waiting.'},{name:'TITAN',code:'SAT-06',color:'#c49a52',copy:'Mist, methane, possibility.'}]
export type ExperienceContent = typeof defaultContent
export const navItems = { luxury:[['/luxury','Overview'],['/luxury/collection','Collection'],['/luxury/stories','Stories'],['/luxury/services','Services'],['/luxury/experience','Experience'],['/luxury/contact','Contact']], space:[['/space','Orbit'],['/space/origin','Origin'],['/space/explore','Explore'],['/space/missions','Missions'],['/space/technology','Technology'],['/space/future','Future']] }
export const getExperienceContent = async (kind:'luxury'|'space') => { const overrides = await getSessionOverrides<any>(); return resolveContent(defaultContent[kind], overrides[kind] as any) }
