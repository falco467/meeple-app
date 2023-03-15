import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { get, getDatabase, onValue, push, ref, remove, set, update } from 'firebase/database'
import { getSavedState, saveState } from './helpers.js'

export const app = /** @type {ReturnType<initializeApp>} */
  (import.meta.env.SSR || initializeApp(/** @type {any} */(window).firebaseConfig))

import.meta.env.SSR || initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6Ld5yeIjAAAAAAWy-JqWV4ObHjP5AUAdWsGToDWB'),
  isTokenAutoRefreshEnabled: true
})

const auth = /** @type {ReturnType<getAuth>} */ (import.meta.env.SSR || getAuth(app))
const db = /** @type {ReturnType<getDatabase>} */ (import.meta.env.SSR || getDatabase(app))

// #region Auth

const uidStorageKey = 'meeple:uid'

export let uid = getSavedState(uidStorageKey) || ''

export async function checkLogin () {
  if (import.meta.env.SSR) return

  /** @type {import('firebase/auth').User?} */
  const user = await new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub()
      resolve(user)
    })
  })
  if (!user) return false

  uid = user.uid
  saveState(uidStorageKey, uid)
  return true
}

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
// #endregion

// #region User
/** @typedef {{[id:string]:UserInfo}} UserMap */

/**
 * @typedef UserInfo
 * @prop {string} name
 */

/** @param {(v:UserMap) => void} listener @param {(err: Error) => void} errCallback */
export function listenUsers (listener, errCallback) {
  if (import.meta.env.SSR) return () => {}
  return onValue(ref(db, 'users'), snap => listener(snap.val()), errCallback)
}

/** @param {string} uid @param {string} name */
export async function setUsername (uid, name) {
  await set(ref(db, `users/${uid}/name`), name)
}

/** @param {string} token */
export async function saveMessagingToken (token) {
  try {
    await set(ref(db, `messaging/${uid}/tokens/${token}`), Date.now())
  } catch (err) {
    console.error(err)
  }
}
// #endregion

// #region Game
/** @typedef {{[id:string]:Game}} GameMap */

/**
 * @typedef Game
 * @prop {string} gid
 * @prop {string} name
 * @prop {string} pic
 * @prop {string} players
 * @prop {string} recPlayers
 * @prop {string} rating
 * @prop {{[uid:string]:Vote}} votes
 * @prop {{[uid:string]:OwnerInfo}} owners
 */

/**
 * @typedef Vote
 * @prop {number} created
 */

/**
 * @typedef OwnerInfo
 * @prop {number} created
 */

/** @param {(v:GameMap) => void} listener @param {(err: Error) => void} errCallback */
export function listenGames (listener, errCallback) {
  if (import.meta.env.SSR) return () => {}
  return onValue(ref(db, 'games'), snap => listener(snap.val()), errCallback)
}

/** @param {Partial<Game>} game */
export async function addGame (game) {
  if (!game.gid) {
    throw new Error('No Game-Id specified')
  }
  delete game.votes
  await update(ref(db, `games/${game.gid}`), game)
}

/** @param {string} gid @param {string} uid */
export async function addVote (gid, uid) {
  /** @type Vote */
  const vote = { created: Date.now() }
  await set(ref(db, `games/${gid}/votes/${uid}`), vote)
}

/** @param {string} gid @param {string} uid */
export async function removeVote (gid, uid) {
  await remove(ref(db, `games/${gid}/votes/${uid}`))
}

/** @param {string} gid @param {string} uid */
export async function addOwner (gid, uid) {
  /** @type OwnerInfo */
  const owner = { created: Date.now() }
  await set(ref(db, `games/${gid}/owners/${uid}`), owner)
}

/** @param {string} gid @param {string} uid */
export async function removeOwner (gid, uid) {
  await remove(ref(db, `games/${gid}/owners/${uid}`))
}
// #endregion

// #region Event
/** @typedef {{[id:string]:Event}} EventMap */

/**
 * @typedef Event
 * @prop {string} id
 * @prop {string} name
 * @prop {string} creator
 * @prop {number} created
 * @prop {string} [selectedDay]
 * @prop {string} [selectedTime]
 * @prop {{[date:string]:EventDay}} days
 * @prop {{[uid:string]:number}} lastVoted
 */

/** @typedef {{[time:string]:{created:number, votes:{[uid:string]:EventVote}}}} EventDay */

/** @typedef {{isFavorite: boolean, isHome: boolean}} EventVote */

/** @param {(v:EventMap) => void} listener @param {(err: Error) => void} errCallback */
export function listenEvents (listener, errCallback) {
  return onValue(ref(db, 'events'), snap => listener(snap.val()), errCallback)
}

/** @param {Event} event */
export async function addEvent (event) {
  const eRef = push(ref(db, 'events'))
  if (!eRef.key) throw new Error('could not push Event - key is null')
  event.id = eRef.key
  await set(eRef, event)
}

/** @param {string} id */
export async function removeEvent (id) {
  await remove(ref(db, `events/${id}`))
}

/** @param {string} id @param {string} day @param {string} time @param {string} uid @param {EventVote?} vote */
export async function setEventVote (id, day, time, uid, vote) {
  await update(ref(db, `events/${id}`), {
    [`days/${day}/${time}/votes/${uid}`]: vote,
    [`lastVoted/${uid}`]: Date.now()
  })
}

/** @param {string} id @param {string} uid  */
export async function setEventLastVoted (id, uid) {
  await set(ref(db, `events/${id}/lastVoted/${uid}`), Date.now())
}

/** @param {string} id @param {string} day @param {string} time */
export async function setEventFinalDate (id, day, time) {
  await update(ref(db, `events/${id}`), {
    selectedDay: day,
    selectedTime: time
  })
}

/** @param {string} id @param {{[date:string]:string}} dayTimes @param {string} uid */
export async function addEventTimes (id, dayTimes, uid) {
  /** @type {{[path:string]: EventDay}} */
  const updates = {}
  Object.entries(dayTimes).forEach(([date, time]) => {
    updates[date] = {
      [time]: {
        created: Date.now(),
        votes: { [uid]: { isFavorite: false, isHome: false } }
      }
    }
  })

  await update(ref(db, `events/${id}/days`), updates)
}

/** @returns {Promise<string>} */
export async function getICalURL () {
  return (await get(ref(db, 'calendar/icsDownloadURL'))).val()
}

// #endregion
