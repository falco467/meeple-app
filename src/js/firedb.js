import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { get, getDatabase, onValue, push, ref, remove, set, update } from 'firebase/database'
import { getSavedState, saveState } from './helpers.js'

/** @type {ReturnType<initializeApp>} */
export let app
/** @type {ReturnType<getAuth>} */
let auth
/** @type {ReturnType<getDatabase>} */
let db

if (!import.meta.env.SSR) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  app = initializeApp(/** @type {any} */(window).firebaseConfig)
  auth = getAuth(app)
  db = getDatabase(app)
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6Ld5yeIjAAAAAAWy-JqWV4ObHjP5AUAdWsGToDWB'),
    isTokenAutoRefreshEnabled: true,
  })
}

// #region Auth

const uidStorageKey = 'meeple:uid'

/** @type {string} */
export let uid = getSavedState(uidStorageKey) ?? ''

export async function checkLogin () {
  /** @type {import('firebase/auth').User?} */
  const user = await new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub()
      resolve(user)
    })
  })
  if (user == null) return false

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
 * @prop {boolean} verified
 */

/** @param {(v:UserMap?) => void} listener @param {(err: Error) => void} errCallback */
export function listenUsers (listener, errCallback) {
  if (import.meta.env.SSR) return () => { /* do nothing */ }
  return onValue(ref(db, 'users'), snap => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    listener(snap.val())
  }, errCallback)
}

/** @param {string} uid @param {string} name */
export async function setUsername (uid, name) {
  await set(ref(db, `users/${uid}/name`), name)
}

/** @param {string} token */
export async function saveMessagingToken (token) {
  try {
    await set(ref(db, `messaging/${uid}/tokens/${token}`), Date.now())
  }
  catch (err) {
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
 * @prop {{[uid:string]:Vote}} votes - nullable
 * @prop {{[uid:string]:Vote}} stars - nullable
 * @prop {{[uid:string]:OwnerInfo}} owners - nullable
 */

/**
 * @typedef Vote
 * @prop {number} created
 */

/**
 * @typedef OwnerInfo
 * @prop {number} created
 */

/** @param {(v:GameMap?) => void} listener @param {(err: Error) => void} errCallback */
export function listenGames (listener, errCallback) {
  if (import.meta.env.SSR) return () => { /* do nothing */ }
  return onValue(ref(db, 'games'), snap => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    listener(snap.val())
  }, errCallback)
}

/** @param {Partial<Game>} game */
export async function addGame (game) {
  if (game.gid == null) {
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
export async function addStar (gid, uid) {
  /** @type Vote */
  const vote = { created: Date.now() }
  await set(ref(db, `games/${gid}/stars/${uid}`), vote)
}

/** @param {string} gid @param {string} uid */
export async function removeStar (gid, uid) {
  await remove(ref(db, `games/${gid}/stars/${uid}`))
}

/** @param {string} gid @param {Game['owners']} owners */
export async function updateOwners (gid, owners) {
  await set(ref(db, `games/${gid}/owners`), owners)
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
 * @prop {{[date:string]:EventDay}} days - nullable
 * @prop {{[uid:string]:number}} lastVoted
 */

/** @typedef {{[time:string]:{created:number, votes:{[uid:string]:EventVote}}}} EventDay */

/** @typedef {{isFavorite: boolean, isHome: boolean}} EventVote */

/** @param {(v:EventMap?) => void} listener @param {(err: Error) => void} errCallback */
export function listenEvents (listener, errCallback) {
  return onValue(ref(db, 'events'), snap => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    listener(snap.val())
  }, errCallback)
}

/** @param {Event} event */
export async function addEvent (event) {
  const eRef = push(ref(db, 'events'))
  if (eRef.key == null) throw new Error('could not push Event - key is null')
  event.id = eRef.key
  await set(eRef, event)
}

/** @param {string} id */
export async function removeEvent (id) {
  await remove(ref(db, `events/${id}`))
}

/** @param {{id:string, day:string, time:string, uid:string, vote:EventVote?}} v */
export async function setEventVote (v) {
  await update(ref(db, `events/${v.id}`), {
    [`days/${v.day}/${v.time}/votes/${v.uid}`]: v.vote,
    [`lastVoted/${v.uid}`]: Date.now(),
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
    selectedTime: time,
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
        votes: { [uid]: { isFavorite: false, isHome: false } },
      },
    }
  })

  await update(ref(db, `events/${id}/days`), updates)
}

/** @returns {Promise<string?>} */
export async function getICalURL () {
  const snap = await get(ref(db, 'calendar/icsDownloadURL'))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return snap.val()
}

// #endregion

/**
 * @template {object} T
 * @param {T} o
 * @param  {...keyof T} keys
 */
export function repNulls (o, ...keys) {
  for (const k of keys) {
    o[k] ??= /** @type {any} */ ({})
  }
}
