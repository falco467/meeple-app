import { writable } from 'svelte/store'
import { listenUsers } from './firedb.js'
import { getSavedState, saveState } from './helpers.js'

/** @typedef {import('./firedb.js').UserMap} UserMap */

const storageKey = 'meeple:userList'

/** @type {UserMap} */
const users = getSavedState(storageKey) ?? {}

const { set, subscribe } = writable(users)

/** @param {(err: Error) => void} errCallback */
export function load (errCallback) {
  return listenUsers(u => {
    u ??= {}
    Object.keys(u).forEach(k => u[k].verified || delete u[k])
    set(u)
    saveState(storageKey, u)
  }, errCallback)
}

export const userList = {
  subscribe,
  load,
}
