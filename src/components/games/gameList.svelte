<script>
  import { onDestroy } from 'svelte'
  import { flip } from 'svelte/animate'
  import { gameList } from '../../js/gameListStore.js'
  import { getErrorMessage } from '../../js/helpers.js'
  import GameBox from './gameBox.svelte'
  import Icon from '../icon.svelte'

  /** @type {string} */
  export let uid

  let errText = ''

  const unsubGame = gameList.load(err => { errText = getErrorMessage(err) })
  onDestroy(unsubGame)
</script>

<main class="flex flex-col gap-1">
  {#each $gameList as game (game.gid)}
    <div animate:flip={{ duration: (dist) => Math.sqrt(dist) * 50 }}>
      <GameBox {game} {uid} />
    </div>
  {/each}

  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  <span>Details provided by BoardGameGeek</span>

  <button class="fixed px-3 py-2 left-0 bottom-0 rounded-tr-lg bg-emerald-800"
    on:click={() => { window.location.href = '/events.html' }}>
    <Icon i="calendar" title="Events" stroke={2} class="!w-10 !h-10"/>
  </button>
</main>
