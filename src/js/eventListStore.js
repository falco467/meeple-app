import { writable } from 'svelte/store'
import { listenEvents } from './firedb.js'
import { getSavedState, saveState, toISODay } from './helpers.js'

/** @typedef {import('./firedb.js').Event} Event */

const storageKey = 'meeple:eventList'

/** @type {Event[]} */
const gl = getSavedState(storageKey) || []

const { set, subscribe } = writable(gl)

/** @param {(err: Error) => void} errCallback */
export function load (errCallback) {
  return listenEvents(eventMap => {
    if (!eventMap) {
      set([])
      return
    }
    const list = Object.values(eventMap)
    list.forEach(e => !e.days && (e.days = {}))
    list.sort((a, b) => (
      bToN(isEventOver(a)) - bToN(isEventOver(b))) ||
      getDay(a).localeCompare(getDay(b)) ||
      b.created - a.created)
    set(list)
    saveState(storageKey, list)
  }, errCallback)
}

/** @param {Event} event */
function getDay (event) {
  return event.selectedDay || Object.keys(event.days).sort()[0]
}

/** @param {Event} event */
function getLastDay (event) {
  return event.selectedDay || Object.keys(event.days).sort().at(-1) || ''
}

/** @param {boolean} b */
function bToN (b) {
  return b ? 1 : 0
}

/** @param {Event} event */
export function isEventOver (event) {
  const todayIso = toISODay(new Date())
  return getLastDay(event).localeCompare(todayIso) < 0
}

export const eventList = {
  subscribe,
  load
}
