<script>
  import { onDestroy } from 'svelte'
  import { flip } from 'svelte/animate'
  import { gameList } from '../js/gameListStore.js'
  import GameBox from './gameBox.svelte'

  /** @type {string} */
  export let uid

  let errText = ''

  const unsubscribe = gameList.load(err => { errText = `${err}` })
  onDestroy(() => unsubscribe())

</script>

<main class="flex flex-col gap-1">
  {#each $gameList as game (game.gid)}
    <div animate:flip>
      <GameBox {game} {uid} />
    </div>
  {/each}

  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  <span>Details provided by BoardGameGeek</span>
</main>
