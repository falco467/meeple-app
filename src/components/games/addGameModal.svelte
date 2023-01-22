<script>
  import { createEventDispatcher } from 'svelte'
  import { addGame } from '../../js/firedb.js'
  import { getErrorMessage, onEnter } from '../../js/helpers.js'
  import { bggLoadGame, bggSearchGame } from '../../js/bggSearch.js'
  import Icon from '../icon.svelte'
    import GameBox from './gameBox.svelte'

  /** @type {string} */
  // eslint-disable-next-line svelte/valid-compile
  export let uid

  let searchText = ''
  /** @type {import('../../js/firedb.js').Game?} */
  let game = null

  /** @type {import('../../js/bggSearch.js').SearchResult[]?} */
  let searchResults = null

  let errText = ''
  let loading = false
  let gameAdded = false

  const dispatch = createEventDispatcher()

  async function trySearchGame () {
    gameAdded = false
    errText = ''
    loading = true
    game = null
    try {
      if (searchText.length < 3) {
        throw new Error('Please enter at least 3 characters')
      }
      searchResults = await bggSearchGame(searchText)
    } catch (err) {
      errText = getErrorMessage(err)
    }
    loading = false
  }

  /** @param {string} id */
  async function tryLoadGame (id) {
    errText = ''
    loading = true
    game = null
    try {
      game = await bggLoadGame(id)
    } catch (err) {
      errText = getErrorMessage(err)
    }
    loading = false
  }

  async function tryAddGame () {
    errText = ''
    loading = true
    try {
      if (!game) throw Error('Game not defined')

      await addGame(game)
      gameAdded = true
      game = null
      searchResults = null
    } catch (err) {
      errText = getErrorMessage(err)
    }
    loading = false
  }

</script>

<div class="w-64 flex flex-col gap-5 items-stretch self-center mt-5">

  <div class="flex items-stretch rounded focus-within:outline">
    <!-- svelte-ignore a11y-autofocus -->
    <input bind:value={searchText} type="text" placeholder="game name"
      on:keyup={onEnter(trySearchGame)} required minlength="4" autofocus
      class="flex-grow flex-shrink bg-slate-500 rounded-l p-2 focus:outline-none min-w-[5rem]"/>
    <button class="bg-slate-800 rounded-r px-2 py-2" on:click={trySearchGame}>
      {#if loading}
        <Icon i="cube" class="animate-spin" />
      {:else}
        <Icon i="search" />
      {/if}
    </button>
  </div>

  {#if gameAdded}<span class="text-emerald-600">Game added successfully</span>{/if}
  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  {#if game}
    <GameBox {game} {uid} preview/>

  {:else if searchResults != null}
    <main class="flex flex-col gap-2 items-stretch">
      {#each searchResults as r}
      <button class="bg-slate-800 rounded p-2"
        on:click={() => tryLoadGame(r.id)}>
        {r.name} ({r.year})
      </button>
      {:else}
        <span>No Games found for this query</span>
      {/each}
    </main>
  {/if}

  <div class="flex items-center gap-5">
    <button class="flex-grow bg-sky-800 rounded px-5 py-3 disabled:bg-neutral-800"
      class:invisible={game == null} on:click={tryAddGame}>
      {#if loading}<Icon i="cube" class="animate-spin" />{:else}Add Game{/if}
    </button>
    <button class="flex-grow bg-slate-800 rounded px-5 py-3" on:click={() => dispatch('close')}>
      Close
    </button>
  </div>

  <span>Search provided by BoardGameGeek</span>

</div>
