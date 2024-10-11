import { writable } from 'svelte/store'
import { isLoading } from './isLoadingStore.js'
import { listenEvents, repNulls } from './firedb.js'
import { getSavedState, saveState, toISODay } from './helpers.js'

/** @typedef {import('./firedb.js').Event} Event */

const storageKey = 'meeple:eventList'

/** @type {Event[]} */
const gl = getSavedState(storageKey) ?? []

const { set, subscribe } = writable(gl)

/** @param {(err: Error) => void} errCallback */
export function load (errCallback) {
  isLoading.set(true)
  return listenEvents(eventMap => {
    if (eventMap == null) {
      set([])
      return
    }
    const list = Object.values(eventMap)
    list.forEach(e => {
      repNulls(e, 'days')
      Object.values(e.days).forEach(d => {
        Object.values(d).forEach(t => { repNulls(t, 'votes') })
      },
      )
    })
    list.sort((a, b) => {
      const diffOver = bToN(isEventOver(a)) - bToN(isEventOver(b))
      if (diffOver !== 0) return diffOver
      const diffDay = getDay(a).localeCompare(getDay(b))
      if (diffDay !== 0) return diffDay
      return b.created - a.created
    })
    set(list)
    isLoading.set(false)
    saveState(storageKey, list)
  }, errCallback)
}

/** @param {Event} event */
function getDay (event) {
  return event.selectedDay ?? Object.keys(event.days).sort()[0]
}

/** @param {Event} event */
function getLastDay (event) {
  return event.selectedDay ?? Object.keys(event.days).sort().at(-1) ?? ''
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
  load,
}
