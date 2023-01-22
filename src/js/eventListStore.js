import { writable } from 'svelte/store'
import { listenEvents } from './firedb.js'
import { toISODay } from './helpers.js'

/** @typedef {import('./firedb.js').Event} Event */

/** @type {Event[]} */
const gl = []

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
      bToN(isEventOver(b)) - bToN(isEventOver(a))) ||
      (b.selectedDay || '').localeCompare(a.selectedDay || '') ||
      b.created - a.created)
    set(list)
  }, errCallback)
}

/** @param {boolean} b */
function bToN (b) {
  return b ? 1 : 0
}

/** @param {Event} event */
function isEventOver (event) {
  if (!event.selectedDay) return false
  const todayIso = toISODay(new Date())
  return event.selectedDay.localeCompare(todayIso) < 0
}

export const eventList = {
  subscribe,
  load
}
