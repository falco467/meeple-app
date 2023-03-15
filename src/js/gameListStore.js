import { writable } from 'svelte/store'
import { listenGames } from './firedb.js'
import { getSavedState, saveState } from './helpers.js'

/** @typedef {import('./firedb.js').Game} Game */

const storageKey = 'meeple:gameList'
const nbSpace = '\u00a0'
const placeholderList = Array.from(new Array(10), (_, i) => ({
  gid: `${-i}`,
  name: '',
  pic: '',
  players: '',
  rating: nbSpace.repeat(6),
  recPlayers: nbSpace.repeat(6),
  votes: {},
  owners: {}
}))

/** @type {Game[]} */
const gl = getSavedState(storageKey) || placeholderList

const { set, subscribe } = writable(gl)

/** @param {(err: Error) => void} errCallback */
export function load (errCallback) {
  return listenGames(gameMap => {
    if (!gameMap) {
      set([])
      return
    }
    const list = Object.values(gameMap)
    list.forEach(e => {
      e.votes ??= {}
      e.owners ??= {}
    })
    list.sort((a, b) => (
      countVotes(b) - countVotes(a)) ||
      b.rating.localeCompare(a.rating) ||
      b.gid.localeCompare(a.gid)
    )
    set(list)
    saveState(storageKey, list)
  }, errCallback)
}

/** @param {Game} game */
function countVotes (game) {
  return game.votes ? Object.keys(game.votes).length : 0
}

export const gameList = {
  subscribe,
  load
}
