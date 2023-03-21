<script>
  import { addOwner, removeOwner, uid } from '../../js/firedb.js'
  import { getErrorMessage } from '../../js/helpers.js'
  import Icon from '../icon.svelte'
  import GameBox from './gameBox.svelte'

  /** @typedef {import('../../js/firedb.js').Game} Game */

  /** @type {Game} */
  export let game
  let errText = ''

  function openBGG () {
    window.open(`https://boardgamegeek.com/boardgame/${game.gid}`, '_blank', 'noreferrer')
  }

  /** @param {Game} game */
  function hasMeAsOwner (game) {
    return Object.keys(game.owners).includes(uid)
  }

  async function tryToggleOwner () {
    try {
      if (hasMeAsOwner(game)) {
        await removeOwner(game.gid, uid)
      } else {
        await addOwner(game.gid, uid)
      }
    } catch (err) {
      errText = getErrorMessage(err)
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
