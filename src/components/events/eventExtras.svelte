<script>
    import { onDestroy } from 'svelte'
  import { flip } from 'svelte/animate'
  import { gameList } from '../../js/gameListStore.js'
  import { fitsPlayerCount, getErrorMessage, listAnimation } from '../../js/helpers.js'
  import GameBox from '../games/gameBox.svelte'
    import { isEventOver } from '../../js/eventListStore.js'

  /** @typedef {import('../../js/firedb.js').Event} Event */

  /** @type {Event} */
  export let event

  let errText = ''

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
    gl = gl.filter(g =>
      Object.keys(g.owners).some(o => ps.has(o)) && (event.selectedDay == null || fitsPlayerCount(g, ps.size)))
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

  const unsubGame = gameList.load(err => { errText = getErrorMessage(err) })
    onDestroy(() => {
      unsubGame()
    })

  $: filteredList = getRecommendedList($gameList, event)
</script>

{#if errText}<span class="text-red-500">{errText}</span>{/if}

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
