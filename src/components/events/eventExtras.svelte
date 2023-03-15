<script>
  import { flip } from 'svelte/animate'
  import { gameList } from '../../js/gameListStore.js'
  import { listAnimation } from '../../js/helpers.js'
  import GameBox from '../games/gameBox.svelte'

  /** @typedef {import('../../js/firedb.js').Event} Event */

  /** @type {Event} */
  export let event

  /** @param {Event} event */
  function isEventOver (event) {
    return false
  }

  /** @param {Event} event */
  function getParticipants (event) {
    if (event.selectedDay != null && event.selectedTime != null) {
      const votes = event.days[event.selectedDay][event.selectedTime].votes
      return new Set(Object.keys(votes))
    }

    return new Set(Object.values(event.days)
      .flatMap(d => Object.values(d))
      .flatMap(t => Object.keys(t.votes)))
  }

  /** @param {import('../../js/firedb.js').Game[]} gl @param {Event} event */
  function getRecommendedList (gl, event) {
    const ps = getParticipants(event)
    console.log(ps)
    gl = gl.filter(g =>
      Object.keys(g.owners).some(o => ps.has(o)) && fitsPlayerCount(g, ps))
    gl.sort((a, b) =>
      (countVotes(b, ps) - countVotes(a, ps)) ||
      b.rating.localeCompare(a.rating) ||
      b.gid.localeCompare(a.gid)
    )
    return gl
  }

  /** @param {import('../../js/firedb.js').Game} game @param {Set<string>} uids */
  function countVotes (game, uids) {
    return Object.keys(game.votes).filter(v => uids.has(v)).length
  }

  /** @param {import('../../js/firedb.js').Game} game @param {Set<string>} uids */
  function fitsPlayerCount (game, uids) {
    if (event.selectedDay == null) return true

    const rplayers = game.recPlayers
      .replaceAll(/(\d+)-(\d+)/g, (s, g1, g2) => {
        const [start, end] = [parseInt(g1), parseInt(g2)]
        let r = g1
        for (let i = start + 1; i <= end; i++) r += `,${i}`
        return r
      }).split(',')

    return rplayers.includes(`${uids.size}`)
  }

  $: filteredList = getRecommendedList($gameList, event)

</script>

{#if !isEventOver(event)}
<article class="flex flex-col gap-1 mt-4">
  <h2 class="text-xl">Recommended Games</h2>
  {#each filteredList as game (game.gid)}
    <div class="flex flex-col" animate:flip={listAnimation}>
      <GameBox {game} />
    </div>
  {/each}
</article>
{/if}
