import { app } from './firedb.js'
import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = /** @type {ReturnType<getFunctions>} */ (import.meta.env.SSR || getFunctions(app, 'europe-west1'))

/** @typedef {{name?: string, id?: string}} BggCallRequest */
/** @typedef {{ok: boolean, status: number, text: string}} BggCallResult */

const bggSearchGameFunc
= /** @type {(r:BggCallRequest) => Promise<{data:BggCallResult}>} */ (import.meta.env.SSR || httpsCallable(functions, 'bggSearch'))

/** @typedef {{id: string, name: string, year: string}} SearchResult */

const searchReturnCount = 10

/** @param {string} name @returns {Promise<SearchResult[]>} */
export async function bggSearchGame (name) {
  const result = (await bggSearchGameFunc({ name })).data
  if (!result.ok) {
    throw new Error(`Error calling BGG Search (${result.status}): ${result.text}`)
  }

  const searchXML = new window.DOMParser().parseFromString(result.text, 'text/xml')

  let list = Array.from(searchXML.querySelectorAll('item')).map(node => ({
    id: node.id,
    type: node.getAttribute('type'),
    name: node.querySelector('name')?.getAttribute('value') ?? '',
    year: node.querySelector('yearpublished')?.getAttribute('value') ?? '',
  }))

  list = list.filter(b => !(b.type === 'boardgameexpansion' || list.find(x => b.id === x.id && x.type === 'boardgameexpansion') != null))

  list.sort((a, b) => {
    const aMatch = a.name.toLowerCase().includes(name.toLowerCase())
    const bMatch = b.name.toLowerCase().includes(name.toLowerCase())
    if (aMatch !== bMatch) { return aMatch ? -1 : 1 }
    return getSortString(a).localeCompare(getSortString(b))
  })

  return list.slice(0, searchReturnCount)
}

/** @param {string} id @returns {Promise<import('./firedb.js').Game>} */
export async function bggLoadGame (id) {
  const result = (await bggSearchGameFunc({ id })).data

  if (!result.ok) {
    throw new Error(`Error calling BGG Load (${result.status}): ${result.text}`)
  }

  const searchXML = new window.DOMParser().parseFromString(result.text, 'text/xml')
  const it = searchXML.querySelector('item')

  return {
    gid: id,
    name: getValue(it, 'name'),
    pic: it?.querySelector('thumbnail')?.textContent ?? '',
    players: `${getValue(it, 'minplayers')}-${getValue(it, 'maxplayers')}`,
    rating: parseFloat(getValue(it, 'average')).toFixed(1),
    recPlayers: calculateRecommendedPlayers(it),
    votes: {},
    owners: {},
    stars: {},
  }
}
/** @param {Element?} it */
function calculateRecommendedPlayers (it) {
  const npRatings = Array.from(
    it?.querySelectorAll('poll[name="suggested_numplayers"] results') ?? [])
    .map(n => ({
      num: n.getAttribute('numplayers') ?? '',
      best: getVoteCount(n, 'Best'),
      rec: getVoteCount(n, 'Recommended'),
      not: getVoteCount(n, 'Not Recommended'),
    }))

  /** @type {string[]} */
  const recPlayerList = []
  const goodPlayercountFactor = 3
  npRatings.forEach(r => {
    if (r.best > r.not || (r.best + r.rec) > goodPlayercountFactor * r.not) {
      recPlayerList.push(r.num)
    }
  })
  recPlayerList.sort()

  let recPlayers = ''
  let lastN = ''
  let span = false
  for (const n of recPlayerList) {
    if (recPlayers === '') {
      recPlayers = n
    }
    else if (parseInt(n) === parseInt(lastN) + 1 || n === `${lastN}+`) {
      span = true
    }
    else {
      recPlayers += span ? `-${lastN},${n}` : `,${n}`
      span = false
    }
    lastN = n
  }
  if (span) {
    recPlayers += `-${lastN}`
  }
  return recPlayers
}

/** @param {Element?} node @param {string} name */
function getVoteCount (node, name) {
  const vt = node?.querySelector(`result[value="${name}"]`)?.getAttribute('numvotes') ?? ''
  return vt !== '' ? parseInt(vt) : 0
}

/** @param {Element?} it @param {string} tag */
function getValue (it, tag) {
  return it?.querySelector(tag)?.getAttribute('value') ?? ''
}

/** @param {{id: string, name: string, year: string}} r */
function getSortString (r) {
  const nameLengthPadding = 2
  const yearReverseNum = 10000
  return `${String(r.name.length).padStart(nameLengthPadding, '0')} ${yearReverseNum - parseInt(r.year)}  ${r.name}`
}
