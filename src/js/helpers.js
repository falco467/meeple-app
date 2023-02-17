// Service Worker for fetch and web push
export const swRegistrationPromise = /** @type {Promise<ServiceWorkerRegistration>} */(
  import.meta.env.SSR || window.navigator?.serviceWorker?.register('/serviceWorker.js', { type: 'module' })
)

/** @param {*} err */
export function getErrorMessage (err) {
  if (err?.code === 'PERMISSION_DENIED') {
    return "You don't have permission for this."
  }
  if (err?.code === 'auth/user-not-found') {
    return 'E-Mail address not found'
  }
  if (err?.code === 'auth/wrong-password') {
    return 'Wrong password'
  }
  if (err?.code === 'auth/email-already-in-use') {
    return 'E-Mail is already registered'
  }

  return err?.message ?? `${err}`
}

/** @param {Date} d */
export function toISODay (d) {
  return d.toISOString().substring(0, 10)
}

/** @param {Date} d @param {string} field @param {string} variation */
export function getDate (d, field, variation = 'short') {
  return d.toLocaleString('default', { [field]: variation })
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
      dom: getDate(d, 'day', 'numeric')
    }
  })
  dl.sort((a, b) => a.date.localeCompare(b.date))
  return dl
}

/** @param {object} o */
export function isEmpty (o) {
  return Object.keys(o || {}).length === 0
}

/** @param {object} o */
export function hasAny (o) {
  return Object.keys(o || {}).length > 0
}

/** @param {() => void} f */
export const onEnter = (f) => (/** @type {KeyboardEvent} */ e) => e.key === 'Enter' && f()

/** @param {import('./firedb.js').Event} event */
export function getEventHash (event) {
  const name = encodeURIComponent(event.name.replaceAll(' ', '_'))
  return `#${event.id}:${name}`
}

/** @param {import('./firedb.js').Event} event @param {import('./firedb.js').UserMap} userList */
export async function shareEvent (event, userList) {
  const baseURL = window.location.href.split('#')[0]
  const url = `${baseURL}${getEventHash(event)}`
  const shareData = {
    title: 'Meeple Event',
    text: `Event: ${event.name}`,
    url
  }
  if (navigator.canShare(shareData)) {
    await navigator.share(shareData)
  } else {
    navigator.clipboard.writeText(url)
  }
}

/** @param {string} key */
export function getSavedState (key) {
  if (import.meta.env.SSR) return null
  try {
    const it = window.localStorage.getItem(key)
    return it && JSON.parse(it)
  } catch (err) {
    console.error(err)
    return null
  }
}

/** @param {string} key @param {any} state */
export function saveState (key, state) {
  if (import.meta.env.SSR) return
  window.localStorage.setItem(key, JSON.stringify(state))
}

export function getEventIDFromHash () {
  if (import.meta.env.SSR) return null
  return window.location.hash ? window.location.hash.split(/[#:]/)[1] : null
}

/** @template T @param {Event} e @param {string} name @param {T} [detail] */
export function customDispatch (e, name, detail = undefined) {
  e.target?.dispatchEvent(new window.CustomEvent(name, {
    bubbles: true,
    detail
  }))
}

/** @template T @param {HTMLElement} node @param {{on:string, do:(e:CustomEvent<T>)=>void}} p  */
export function customListener (node, p) {
  node.addEventListener(p.on, /** @type {EventListener} */ (p.do))
  return {
    destroy: () => node.removeEventListener(p.on, /** @type {EventListener} */ (p.do))
  }
}
