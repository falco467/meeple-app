import { writable } from 'svelte/store'
import { addGame, listenGames } from './firedb.js'

/** @typedef {import('./firedb.js').Game} Game */

/** @type {Game[]} */
const gl = []

const { set, subscribe } = writable(gl)

/** @param {(err: Error) => void} errCallback */
export function load (errCallback) {
  return listenGames(gameMap => {
    console.log('load games:', gameMap)
    if (!gameMap) {
      set([])
      return
    }
    const list = Object.values(gameMap)
    list.forEach(e => !e.votes && (e.votes = {}))
    list.sort((a, b) => (countVotes(b) - countVotes(a)) || b.rating.localeCompare(a.rating) || b.gid.localeCompare(a.gid))
    set(list)
  }, errCallback)
}

/** @param {Game} game */
function countVotes (game) {
  return game.votes ? Object.keys(game.votes).length : 0
}

/** @param {Game} game */
async function add (game) {
  await addGame(game)
}

export const gameList = {
  subscribe,
  load,
  add
}
