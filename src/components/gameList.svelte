<script>
  import { onDestroy } from 'svelte'
  import { flip } from 'svelte/animate'
  import { gameList } from '../js/gameListStore.js'
  import { userList } from '../js/userStore.js';
  import GameBox from './gameBox.svelte'

  /** @type {string} */
  export let uid

  let errText = ''

  const unsubUsers = userList.load(err => { errText = `${err}` })
  const unsubGame = gameList.load(err => { errText = `${err}` })
  
  onDestroy(() => {
    unsubUsers()
    unsubGame()
  })

</script>

<main class="flex flex-col gap-1">
  {#each $gameList as game (game.gid)}
    <div animate:flip={{duration: 200}}>
      <GameBox {game} {uid} />
    </div>
  {/each}

  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  <span>Details provided by BoardGameGeek</span>
</main>
