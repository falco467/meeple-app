import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { setUsername } from './firedb.js'
import { firebaseConfig } from './firebaseConfig.js'


export const app = initializeApp(firebaseConfig)

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6Ld5yeIjAAAAAAWy-JqWV4ObHjP5AUAdWsGToDWB'),
  isTokenAutoRefreshEnabled: true
})

const auth = getAuth(app)

export async function getLogin () {
  /** @type {import('firebase/auth').User} */
  const user = await new Promise((resolve, reject) => {
    onAuthStateChanged(auth, user => {
      if (user) resolve(user)
      else reject(new Error('Not logged in'))
    })
  })
  return user.uid
}

/** @param {() => void} f */
export const onEnter = (f) => (/** @type {KeyboardEvent} */ e) => e.key === 'Enter' && f()

/** @param {string} email @param {string} password */
export async function login (email, password) {
  return await signInWithEmailAndPassword(auth, email, password)
}

/** @param {string} email @param {string} password @param {string} name */
export async function createAccount (email, password, name) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await setUsername(cred.user.uid, name)
  return cred
}

/** @param {*} err */
export function getErrorMessage (err) {
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

const functions = getFunctions(app, 'europe-west1')
const bggSearchGameFunc = httpsCallable(functions, 'bggSearchGame')

/** @typedef {{id: string, name: string, year: string}} SearchResult */

/** @param {string} name @returns {Promise<SearchResult[]>} */
export async function bggSearchGame (name) {
  const result = /** @type {{ok: boolean, status: number, text: string}} */
    ((await bggSearchGameFunc({ name })).data)
  if (!result.ok) {
    throw new Error(`Error calling BGG Search (${result.status}): ${result.text}`)
  }

  const searchXML = new window.DOMParser().parseFromString(result.text, 'text/xml')
  const list = Array.from(searchXML.querySelectorAll('item')).map(node => ({
    id: node.id,
    name: node.querySelector('name')?.getAttribute('value') || '',
    year: node.querySelector('yearpublished')?.getAttribute('value') || ''
  }))
  list.sort((a, b) => {
    const aMatch = a.name.toLowerCase().includes(name.toLowerCase())
    const bMatch = b.name.toLowerCase().includes(name.toLowerCase())
    if (aMatch !== bMatch) return aMatch ? -1 : 1
    return getSortString(a).localeCompare(getSortString(b))
  })

  return list.slice(0, 10)
}

/** @param {string} id @returns {Promise<import('./firedb.js').Game>} */
export async function bggLoadGame (id) {
  const result = /** @type {{ok: boolean, status: number, text: string}} */
    ((await bggSearchGameFunc({ id })).data)
  if (!result.ok) {
    throw new Error(`Error calling BGG Load (${result.status}): ${result.text}`)
  }

  const searchXML = new window.DOMParser().parseFromString(result.text, 'text/xml')

  const it = searchXML.querySelector('item')
  const name = getValue(it, 'name')
  const pic = it?.querySelector('thumbnail')?.textContent || ''
  const players = `${getValue(it, 'minplayers')}-${getValue(it, 'maxplayers')}`
  const rating = parseFloat(getValue(it, 'average')).toFixed(1)
  const recPlayers = calculateRecommendedPlayers(it)

  const g = {
    gid: id,
    name,
    pic,
    players,
    rating,
    recPlayers,
    votes: {}
  }

  return g
}

/** @param {Element?} it */
function calculateRecommendedPlayers (it) {
  const npRatings = Array.from(
    it?.querySelectorAll('poll[name="suggested_numplayers"] results') || [])
    .map(n => ({
      num: n.getAttribute('numplayers') || '',
      best: getVoteCount(n, 'Best'),
      rec: getVoteCount(n, 'Recommended'),
      not: getVoteCount(n, 'Not Recommended')
    }))

  /** @type {string[]} */
  const recPlayerList = []
  npRatings.forEach(r => (r.best > r.not || (r.best + r.rec) > 3 * r.not) && recPlayerList.push(r.num))
  recPlayerList.sort()

  let recPlayers = ''
  let lastN = ''
  let span = false
  for (const n of recPlayerList) {
    if (!recPlayers) {
      recPlayers = n
    } else if (parseInt(n) === parseInt(lastN) + 1 || n === `${lastN}+`) {
      span = true
    } else {
      recPlayers += span ? `-${lastN},${n}` : `,${n}`
      span = false
    }
    lastN = n
  }
  if (span) {
    recPlayers += `-${lastN}`
  }
  return recPlayers
}

/** @param {Element?} node @param {string} name */
function getVoteCount (node, name) {
  const vt = node?.querySelector(`result[value="${name}"]`)?.getAttribute('numvotes')
  return vt ? parseInt(vt) : 0
}

/** @param {Element?} it @param {string} tag */
function getValue (it, tag) {
  return it?.querySelector(tag)?.getAttribute('value') || ''
}

/** @param {{id: string, name: string, year: string}} r */
function getSortString (r) {
  return `${String(r.name.length).padStart(2, '0')}${10000 - parseInt(r.year)}  ${r.name}`
}
