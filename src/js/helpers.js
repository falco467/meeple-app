// Service Worker for fetch and web push
export const swRegistrationPromise = /** @type {Promise<ServiceWorkerRegistration>} */(
  import.meta.env.SSR || window.navigator.serviceWorker.register('/serviceWorker.js', { type: 'module' })
)

/** @param {any} anyErr */
export function getErrorMessage (anyErr) {
  if (anyErr == null) {
    return 'Unexpected null error'
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const err = /** @type {{code?:string, message?:any}} */ (anyErr)
  if (err.code === 'PERMISSION_DENIED') {
    return 'You don\'t have permission for this.'
  }
  if (err.code === 'auth/user-not-found') {
    return 'E-Mail address not found'
  }
  if (err.code === 'auth/wrong-password') {
    return 'Wrong password'
  }
  if (err.code === 'auth/email-already-in-use') {
    return 'E-Mail is already registered'
  }

  return String(err.message ?? err)
}

/** @param {Date} d */
export function toISODay (d) {
  return d.toLocaleDateString('sv')
}

/** @param {Date} d @param {string} field @param {string} variation */
export function getDate (d, field, variation = 'short') {
  return d.toLocaleString('en', { [field]: variation })
}

/** @param {import('./firedb.js').Event['days']} days */
export function getDayList (days) {
  const dl = Object.entries(days).map(([date, times]) => {
    const d = new Date(date)
    return {
      date,
      times,
      month: getDate(d, 'month'),
      weekday: getDate(d, 'weekday').toUpperCase(),
      dom: getDate(d, 'day', 'numeric'),
    }
  })
  dl.sort((a, b) => a.date.localeCompare(b.date))
  return dl
}

/** @param {object?} o */
export function isEmpty (o) {
  return Object.keys(o ?? {}).length === 0
}

/** @param {object?} o */
export function hasAny (o) {
  return Object.keys(o ?? {}).length > 0
}

/** @param {() => (void|Promise<void>)} f */
export const onEnter = f => (/** @type {KeyboardEvent} */ e) => { if (e.key === 'Enter') void f() }

/** @param {import('./firedb.js').Event} event */
export function getEventHash (event) {
  const name = encodeURIComponent(event.name.replaceAll(' ', '_'))
  return `#${event.id}:${name}`
}

/** @param {import('./firedb.js').Game} game */
export function getGameHash (game) {
  const name = encodeURIComponent(game.name.replaceAll(' ', '_'))
  return `#${game.gid}:${name}`
}

/** @param {import('./firedb.js').Event} event */
export async function shareEvent (event) {
  const baseURL = window.location.href.split('#')[0]
  const url = `${baseURL}${getEventHash(event)}`
  const shareData = {
    title: 'Meeple Event',
    text: `Event: ${event.name}`,
    url,
  }
  if (navigator.canShare(shareData)) {
    await navigator.share(shareData)
  }
  else {
    await navigator.clipboard.writeText(url)
  }
}

/** @template T @param {string} key @returns {T?} */
export function getSavedState (key) {
  if (import.meta.env.SSR) return null
  try {
    const it = window.localStorage.getItem(key)
    if (it == null) return null
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(it)
  }
  catch (err) {
    console.error(err)
    return null
  }
}

/** @param {string} key @param {any} state */
export function saveState (key, state) {
  if (import.meta.env.SSR) return
  window.localStorage.setItem(key, JSON.stringify(state))
}

export function getIDFromHash () {
  if (import.meta.env.SSR) return null
  if (window.location.hash === '') return null
  return window.location.hash.split(/[#:]/)[1]
}

export function pushHashOnLoad () {
  const h = window.location.hash
  window.history.replaceState(null, '', window.location.pathname)
  window.history.pushState(null, '', `${window.location.pathname}${h}`)
}

/** @param {string} h */
export function pushHash (h) {
  window.history.pushState(null, '', `${window.location.pathname}${h}`)
}

/** @template T @param {Event} e @param {string} name @param {T} [detail] */
export function customDispatch (e, name, detail = undefined) {
  e.target?.dispatchEvent(new window.CustomEvent(name, {
    bubbles: true,
    detail,
  }))
}

/** @template T @param {HTMLElement} node @param {{on:string, do:(e:CustomEvent<T>)=>void}} p  */
export function customListener (node, p) {
  node.addEventListener(p.on, /** @type {EventListener} */ (p.do))
  return {
    destroy: () => { node.removeEventListener(p.on, /** @type {EventListener} */ (p.do)) },
  }
}

const animationTimeMs = 300

/** @type {import('svelte/animate').FlipParams} */
export const listAnimation = {
  duration: _ => animationTimeMs,
}

/** @param {import('./firedb.js').Game} game @param {number} count */
export function fitsPlayerCount (game, count) {
  const rplayers = game.recPlayers
    .replaceAll(/(\d+)-(\d+)/g, /** @param {string} g1 @param {string} g2 */(s, g1, g2) => {
      const [start, end] = [parseInt(g1), parseInt(g2)]
      let r = g1
      for (let i = start + 1; i <= end; i++) r += `,${i}`
      return r
    }).split(',')

  return rplayers.includes(`${count}`)
}
