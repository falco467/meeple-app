<script>
  import { createEventDispatcher } from 'svelte'
  import { getErrorMessage } from '../../js/helpers.js'
  import Icon from '../icon.svelte'
  import GameBox from './gameBox.svelte'
  import Dialog from '../dialog.svelte'
  import { userList } from '../../js/userStore.js'
  import { updateOwners } from '../../js/firedb.js'

  /** @typedef {import('../../js/firedb.js').Game} Game */

  /** @type {Game} */
  export let game
  let errText = ''
  let ownerModalVisible = false
  /** @type {NonNullable<Game['owners']>} */
  let ownerMap = {}

  const dispatch = createEventDispatcher()

  function openBGG () {
    window.open(`https://boardgamegeek.com/boardgame/${game.gid}`, '_blank', 'noreferrer')
  }

  function openOwnerModal () {
    ownerMap = { ...game.owners }
    ownerModalVisible = true
  }

  /** @param {string} uid */
  function toggleOwner (uid) {
    if (ownerMap[uid] == null) {
      ownerMap[uid] = { created: Date.now() }
    }
    else {
      delete ownerMap[uid]
      ownerMap = ownerMap
    }
  }

  async function saveOwners () {
    errText = ''
    const ol = Object.keys(ownerMap).sort()
    const gol = Object.keys(game.owners ?? {}).sort()
    if (ol.length === gol.length && ol.every((v, i) => v === gol[i])) {
      return
    }
    try {
      await updateOwners(game.gid, ownerMap)
    }
    catch (err) {
      errText = getErrorMessage(err)
    }
  }

  $: users = Object.entries($userList).map(([uid, user]) => ({ uid, name: user.name })).sort((a, b) => a.name.localeCompare(b.name))
</script>

<article class="flex flex-col gap-2">
  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  <GameBox {game} on:open={openBGG}/>

  <div class="flex gap-2 justify-between">
    <button class="flex items-center gap-1 rounded border p-1 px-2"
      on:click={openOwnerModal}>
      <Icon i="cube"/> Set Owners
    </button>
    <button class="flex items-center gap-1 rounded border p-1 px-2"
      on:click={() => dispatch('close')}>
      <Icon i="arrow-left"/> Back to List
    </button>
  </div>

  <Dialog bind:visible={ownerModalVisible} confirmText="Set Owners" onConfirm={saveOwners}>
    <span>Who owns this game?</span>
    {#each users as user (user.uid)}
    <button class="flex items-center gap-2 rounded border p-1 pr-2 bg-slate-800"
      on:click={() => { toggleOwner(user.uid) }}>
      <span class="border">
        <Icon i="check" class="!w-4 !h-4 {ownerMap?.[user.uid] == null ? 'invisible' : ''}"/>
      </span>
      {user.name}
    </button>
    {/each}
  </Dialog>
</article>
