import { getDatabase, onValue, ref, remove, set } from 'firebase/database'
import { app } from './helpers.js'

const db = getDatabase(app)

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

/** @typedef {{[id:string]:Game}} GameMap */

/**
 * @typedef Game
 * @prop {string} gid
 * @prop {string} name
 * @prop {string} pic
 * @prop {string} players
 * @prop {string} recPlayers
 * @prop {string} rating
 * @prop {{[name:string]:Vote}} votes
 */

/**
 * @typedef Vote
 * @prop {number} created
 */

/** @param {(v:GameMap) => void} listener @param {(err: Error) => void} errCallback */
export function listenGames (listener, errCallback) {
  return onValue(ref(db, 'games_test'), snap => listener(snap.val()), errCallback)
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
