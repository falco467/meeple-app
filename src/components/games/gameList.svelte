<script>
  import { onDestroy } from 'svelte'
  import { flip } from 'svelte/animate'
  import { gameList } from '../../js/gameListStore.js'
  import { getErrorMessage, getGameHash, getIDFromHash, listAnimation, pushHash, pushHashOnLoad } from '../../js/helpers.js'
  import GameBox from './gameBox.svelte'
  import Icon from '../icon.svelte'
  import { scale } from 'svelte/transition'
  import GameDetails from './gameDetails.svelte'

  let errText = ''
  let gameID = getIDFromHash()

  if (gameID) {
    pushHashOnLoad()
  }

  /** @param {import('../../js/firedb.js').Game?} game */
  function select (game) {
    if (game == null) {
      window.history.back()
      return
    }

    gameID = game.gid
    pushHash(getGameHash(game))
  }

  /** @param {HashChangeEvent} event */
  function onHashChange (event) {
    gameID = getIDFromHash()
  }

  $: selectedGame = $gameList.find(g => g.gid === gameID)

  if (!import.meta.env.SSR) {
    window.addEventListener('hashchange', onHashChange)

    const unsubGame = gameList.load(err => { errText = getErrorMessage(err) })
    onDestroy(() => {
      unsubGame()
      window.removeEventListener('hashchange', onHashChange)
    })
  }
</script>

<main class="flex flex-col gap-1">
  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  {#if !gameID}
    {#each $gameList as game (game.gid)}
      <div class="flex flex-col" animate:flip={listAnimation}>
        <GameBox {game} on:open={() => select(game)}/>
      </div>
    {/each}
  {:else}
    {#if selectedGame}
      <div class="flex flex-col" in:scale={{ start: 0.8, duration: 200 }}>
        <GameDetails game={selectedGame} />
      </div>
    {:else}
      <span class="text-center my-10">This game does not exist.</span>
    {/if}

    <button class="flex items-center self-end gap-1 rounded border p-1 px-2 mt-2"
      on:click={() => select(null)}>
      <Icon i="arrow-left"/> Back to List
    </button>
  {/if}

  <span>Details provided by BoardGameGeek</span>

  <button class="fixed px-3 py-2 left-0 bottom-0 rounded-tr-lg bg-emerald-800"
    on:click={() => { window.location.href = '/events.html' }}>
    <Icon i="calendar" title="Events" stroke={2} class="!w-10 !h-10"/>
  </button>
</main>
