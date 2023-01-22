import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { getDatabase, onValue, push, ref, remove, set, update } from 'firebase/database'
import { firebaseConfig } from './firebaseConfig.js'

export const app = initializeApp(firebaseConfig)

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6Ld5yeIjAAAAAAWy-JqWV4ObHjP5AUAdWsGToDWB'),
  isTokenAutoRefreshEnabled: true
})

// #region Auth
const auth = getAuth(app)

export async function getLogin () {
  /** @type {import('firebase/auth').User} */
  const user = await new Promise((resolve, reject) => {
    onAuthStateChanged(auth, user => {
      if (user) { resolve(user) } else { reject(new Error('Not logged in')) }
    })
  })
  return user.uid
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

const db = getDatabase(app)

// #region User
/** @typedef {{[id:string]:UserInfo}} UserMap */

/**
 * @typedef UserInfo
 * @prop {string} name
 */

/** @param {(v:UserMap) => void} listener @param {(err: Error) => void} errCallback */
export function listenUsers (listener, errCallback) {
  return onValue(ref(db, 'users'), snap => listener(snap.val()), errCallback)
}

/** @param {string} uid @param {string} name */
export async function setUsername (uid, name) {
  await set(ref(db, `users/${uid}`), { name })
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
 */

/**
 * @typedef Vote
 * @prop {number} created
 */

/** @param {(v:GameMap) => void} listener @param {(err: Error) => void} errCallback */
export function listenGames (listener, errCallback) {
  return onValue(ref(db, 'games'), snap => listener(snap.val()), errCallback)
}

/** @param {Game} game */
export async function addGame (game) {
  if (!game.gid) {
    throw new Error('No Game-Id specified')
  }
  await set(ref(db, `games/${game.gid}`), game)
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

/** @param {string} id @param {string} day @param {string} time @param {string} uid @param {EventVote} vote */
export async function setEventVote (id, day, time, uid, vote) {
  await set(ref(db, `events/${id}/days/${day}/${time}/votes/${uid}`), vote)
}

/** @param {string} id @param {string} day @param {string} time @param {string} uid */
export async function removeEventVote (id, day, time, uid) {
  await remove(ref(db, `events/${id}/days/${day}/${time}/votes/${uid}`))
}

/** @param {string} id @param {string} day @param {string} time */
export async function setEventFinalDate (id, day, time) {
  await update(ref(db, `events/${id}`), {
    selectedDay: day,
    selectedTime: time
  })
}
// #endregion
