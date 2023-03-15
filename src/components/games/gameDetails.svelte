<script>
  import { addOwner, removeOwner, uid } from '../../js/firedb.js'
  import Icon from '../icon.svelte'
  import GameBox from './gameBox.svelte'

  /** @typedef {import('../../js/firedb.js').Game} Game */

  /** @type {Game} */
  export let game
  const errText = ''

  function openBGG () {
    window.open(`https://boardgamegeek.com/boardgame/${game.gid}`, '_blank', 'noreferrer')
  }

  /** @param {Game} game */
  function hasMeAsOwner (game) {
    return Object.keys(game.owners).includes(uid)
  }

  function tryToggleOwner () {
    if (hasMeAsOwner(game)) {
      removeOwner(game.gid, uid)
    } else {
      addOwner(game.gid, uid)
    }
  }
</script>

<article class="flex flex-col gap-1">
  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  <GameBox {game} on:open={() => openBGG()}/>

  <button class="flex items-center self-start gap-1 rounded border p-1 px-2 mt-2 -mb-11"
    on:click={tryToggleOwner}>
    <Icon i="cube"/>
    {#if hasMeAsOwner(game)}
      Remove Ownership
    {:else}
      Set Ownership
    {/if}
  </button>
</article>
