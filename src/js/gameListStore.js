import { derived, writable } from 'svelte/store'
import { isLoading } from './isLoadingStore.js'
import { listenGames, repNulls, uid } from './firedb.js'
import { getSavedState, saveState } from './helpers.js'

/** @typedef {import('./firedb.js').Game} Game */

const placeholderCount = 10
const placeholderSpaces = 6

const storageKey = 'meeple:gameList'
const nbSpace = '\u00a0'
const placeholderList = Array.from(new Array(placeholderCount), (_, i) => ({
  gid: `${-i}`,
  name: '',
  pic: '',
  players: '',
  rating: nbSpace.repeat(placeholderSpaces),
  recPlayers: nbSpace.repeat(placeholderSpaces),
  votes: {},
  stars: {},
  owners: {},
}))

/** @type {Game[]} */
const gl = getSavedState(storageKey) ?? placeholderList

const { set, subscribe } = writable(gl)

/** @param {(err: Error) => void} errCallback */
export function load (errCallback) {
  isLoading.set(true)
  return listenGames(gameMap => {
    const list = Object.values(gameMap ?? {})
    list.forEach(e => {
      repNulls(e, 'votes', 'owners', 'stars')
    })
    const games = /** @type {Game[]} */(list)
    games.sort((a, b) => {
      const voteDiff = countVotes(b) - countVotes(a)
      if (voteDiff !== 0) return voteDiff
      const ratingDiff = b.rating.localeCompare(a.rating)
      if (ratingDiff !== 0) return ratingDiff
      return b.gid.localeCompare(a.gid)
    })
    set(games)
    isLoading.set(false)
    saveState(storageKey, list)
  }, errCallback)
}

const starRatingWeight = 2

/** @param {Game} game */
function countVotes (game) {
  return Object.keys(game.stars).length * starRatingWeight
    + Object.keys(game.votes).length
}

export const gameList = {
  subscribe,
  load,
}

export const myStarCount = derived(gameList,
  $gameList => $gameList.filter(g => uid in g.stars).length)
