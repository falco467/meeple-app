<script>
  import { onDestroy } from 'svelte'
  import { flip } from 'svelte/animate'
  import { countVotes, gameList } from '../../js/gameListStore.js'
  import { fitsPlayerCount, getErrorMessage, listAnimation } from '../../js/helpers.js'
  import GameBox from '../games/gameBox.svelte'
  import { isEventOver } from '../../js/eventListStore.js'
  import Icon from '../icon.svelte'

  /** @typedef {import('../../js/firedb.js').Event} Event */

  /** @type {Event} */
  export let event

  let errText = ''

  /** @param {Event} event */
  function getParticipants (event) {
    if (event.selectedDay != null && event.selectedTime != null) {
      const votes = event.days[event.selectedDay]?.[event.selectedTime].votes ?? {}
      return new Set(Object.keys(votes))
    }

    return new Set(Object.values(event.days)
      .flatMap(d => Object.values(d ?? {}))
      .flatMap(t => Object.keys(t.votes ?? {})))
  }

  /** @param {import('../../js/firedb.js').Game[]} gl @param {Event} event @param {boolean} matchPC  */
  function getRecommendedList (gl, event, matchPC) {
    const ps = getParticipants(event)

    gl = gl.filter(g => Object.keys(g.owners).some(o => ps.has(o))
      && (!matchPC || fitsPlayerCount(g, ps.size)))

    gl.sort((a, b) => {
      const voteDiff = countVotes(b, ps) - countVotes(a, ps)
      if (voteDiff !== 0) return voteDiff
      const ratingDiff = b.rating.localeCompare(a.rating)
      if (ratingDiff !== 0) return ratingDiff
      return b.gid.localeCompare(a.gid)
    })
    return gl
  }

  const unsubGame = gameList.load(err => { errText = getErrorMessage(err) })
    onDestroy(() => {
      unsubGame()
    })

  const voteCount = (event.selectedDay != null && event.selectedTime != null)
    ? Object.keys(event.days[event.selectedDay]?.[event.selectedTime].votes ?? {}).length
    : 0
  let matchPC = voteCount > 1 && voteCount <= 6

  $: filteredList = getRecommendedList($gameList, event, matchPC)
</script>

{#if errText}<span class="text-red-500">{errText}</span>{/if}

{#if !isEventOver(event)}
<article class="flex flex-col gap-1 mt-4">
  <h2 class="text-xl flex flex-wrap items-baseline">
    <span class="flex-grow">Recommended Games</span>
    {#if event.selectedDay != null}
    <button class="flex items-center gap-2 rounded border p-1 pr-2 bg-slate-800 text-sm"
      on:click={() => { matchPC = !matchPC }}>
      <span class="border">
        <Icon i="check" class="!w-4 !h-4 {matchPC ? '' : 'invisible'}"/>
      </span>
      match player count
    </button>
    {/if}
  </h2>
  {#each filteredList as game (game.gid)}
    <div class="flex flex-col" animate:flip={listAnimation}>
      <GameBox {game} />
    </div>
  {/each}
</article>
{/if}
