import { writable } from 'svelte/store'
import { listenUsers } from './firedb.js'

/** @typedef {import('./firedb.js').UserMap} UserMap */

/** @type {UserMap} */
const users = {}

const { set, subscribe } = writable(users)

/** @param {(err: Error) => void} errCallback */
export function load (errCallback) {
  return listenUsers((/** @type {UserMap} */ u) => set(u || {}), errCallback)
}

export const userList = {
  subscribe,
  load
}
