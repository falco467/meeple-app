<script>
  import { onDestroy } from 'svelte'
  import { flip } from 'svelte/animate'
  import { gameList } from '../../js/gameListStore.js'
  import { fitsPlayerCount, getErrorMessage, getGameHash, getIDFromHash, listAnimation, pushHash, pushHashOnLoad } from '../../js/helpers.js'
  import GameBox from './gameBox.svelte'
  import Icon from '../icon.svelte'
  import { scale } from 'svelte/transition'
  import GameDetails from './gameDetails.svelte'
  import { uid } from '../../js/firedb.js'
  import Dialog from '../dialog.svelte'
  import { userList } from '../../js/userStore.js'

  const playerCounts = [2, 3, 4, 5, 6, 7, 8, 9, 10]

  let errText = ''
  let gameID = getIDFromHash()
  let closing = false

  if (gameID) {
    pushHashOnLoad()
  }

  /** @param {import('../../js/firedb.js').Game?} game */
  function select (game) {
    if (game == null) {
      closing = true
      window.history.back()
      return
    }

    gameID = game.gid
    pushHash(getGameHash(game))
  }

  /** @param {HashChangeEvent} _ */
  function onHashChange (_) {
    gameID = getIDFromHash()
    closing = false
  }

  $: selectedGame = $gameList.find(g => g.gid === gameID)

  const filters = {
    searchTerm: '',
    owners: /** @type {string[]} */ ([]),
    voters: /** @type {string[]} */ ([]),
    unvoted: false,
    starred: false,
    playerCount: /** @type {number?} */ (null),
  }

  $: filterList = $gameList.filter(g =>
    (filters.searchTerm === '' || g.name.toLowerCase().includes(filters.searchTerm.toLowerCase()))
    && (filters.owners.length === 0 || Object.keys(g.owners).find(k => filters.owners.includes(k)))
    && (filters.voters.length === 0 || filters.voters.every(k => Object.keys(g.votes).includes(k)))
    && (!filters.unvoted || !Object.keys(g.votes).includes(uid))
    && (!filters.starred || Object.keys(g.stars).length > 0)
    && (filters.playerCount == null || fitsPlayerCount(g, filters.playerCount)),
  )

  if (!import.meta.env.SSR) {
    window.addEventListener('hashchange', onHashChange)

    const unsubGame = gameList.load(err => { errText = getErrorMessage(err) })
    onDestroy(() => {
      unsubGame()
      window.removeEventListener('hashchange', onHashChange)
    })
  }

  $: users = Object.entries($userList).map(([k, v]) => ({ uid: k, name: v.name })).sort((a, b) => a.name.localeCompare(b.name))

  let dialogVisible = false
  /** @type {'owners'|'voters'|'playerCount'} */
  let dialogType = 'owners'

  /** @param {'owners'|'voters'|'playerCount'} type */
  function showSelection (type) {
    dialogType = type
    dialogVisible = true
  }

  /** @param {'owners'|'voters'|'playerCount'} type @param {string} uid  */
  function toggleFilter (type, uid) {
    if (type === 'playerCount') throw Error('wrong dialog type')
    if (filters[type].includes(uid)) {
      filters[type] = filters[type].filter(e => e !== uid)
    }
    else {
      filters[type] = [...filters[type], uid]
    }
  }
</script>

<main class="flex flex-col gap-1">
  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  {#if !gameID}
    <aside class="flex flex-wrap gap-1">
      <div class="flex relative basis-1 grow">
        <input type="text" class="bg-slate-500 rounded p-2 px-8 min-w-[7rem] w-full"
        class:!bg-sky-800={filters.searchTerm !== ''} bind:value={filters.searchTerm} placeholder="name"/>
        <Icon i="search" class="absolute inset-y-2 left-1 pointer-events-none"/>
        {#if filters.searchTerm !== ''}
          <button on:click={() => { filters.searchTerm = '' }} class="flex absolute inset-y-2 right-1 cursor-pointer">
            <Icon i="x-mark"/>
          </button>
        {/if}
      </div>

      <button class="flex gap-1 bg-slate-500 rounded p-2 cursor-pointer"
        class:!bg-sky-800={filters.owners.length > 0} on:click={() => { showSelection('owners') }} >
        <Icon i="cube"/>
        {#if filters.owners.length === 0}
          <span class="text-slate-400 hidden md:inline">owners</span>
        {:else}
          <span class="max-w-[5rem] md:max-w-[10rem] overflow-hidden overflow-ellipsis whitespace-nowrap">
            {filters.owners.map(uid => $userList[uid].name).join(', ')}
          </span>
          <button on:click|stopPropagation={() => { filters.owners = [] }}>
            <Icon i="x-mark"/>
          </button>
        {/if}
      </button>

      <button class="flex gap-1 bg-slate-500 rounded p-2 cursor-pointer"
        class:!bg-sky-800={filters.voters.length > 0} on:click={() => { showSelection('voters') }}>
        <Icon i="thumbs-up"/>
        {#if filters.voters.length === 0}
          <span class="text-slate-400 hidden md:inline">voters</span>
        {:else}
          <span class="max-w-[5rem] md:max-w-[10rem] overflow-hidden overflow-ellipsis whitespace-nowrap">
            {filters.voters.map(uid => $userList[uid].name).join(' & ')}
          </span>
          <button on:click|stopPropagation={() => { filters.voters = [] }}>
            <Icon i="x-mark"/>
          </button>
        {/if}
      </button>

      <button class="flex gap-1 bg-slate-500 rounded p-2 cursor-pointer"
        class:!bg-sky-800={filters.playerCount != null} on:click={() => { showSelection('playerCount') }}>
        <Icon i="user"/>
        {#if filters.playerCount == null}
          <span class="text-slate-400 hidden md:inline">players</span>
        {:else}
          {filters.playerCount} players
          <button on:click|stopPropagation={() => { filters.playerCount = null }}>
            <Icon i="x-mark"/>
          </button>
        {/if}
      </button>

      <button class="flex gap-1 bg-slate-500 rounded p-2 cursor-pointer"
        class:!bg-sky-800={filters.unvoted} on:click={() => { filters.unvoted = !filters.unvoted }}>
        <Icon i="chart-sqare-bar"/>
        <span class="text-slate-400">unvoted</span>
        {#if filters.unvoted}
          <button on:click|stopPropagation={() => { filters.unvoted = false }}>
            <Icon i="x-mark"/>
          </button>
        {/if}
      </button>
      <button class="flex gap-1 bg-slate-500 rounded p-2 cursor-pointer"
        class:!bg-sky-800={filters.starred} on:click={() => { filters.starred = !filters.starred }}>
        <Icon i="chart-sqare-bar"/>
        <span class="text-slate-400">starred</span>
        {#if filters.starred}
          <button on:click|stopPropagation={() => { filters.starred = false }}>
            <Icon i="x-mark"/>
          </button>
        {/if}
      </button>
    </aside>

    {#each filterList as game (game.gid)}
      <div class="flex flex-col" animate:flip={listAnimation}>
        <GameBox {game} on:open={() => { select(game) }}/>
      </div>
    {/each}
  {:else}
    {#if selectedGame}
      <div class="flex flex-col transition-transform duration-500"
        in:scale={{ start: 0.8, duration: 200 }} class:scale-50={closing}>
        <GameDetails game={selectedGame} on:close={() => { select(null) }}/>
      </div>
    {:else}
      <span class="text-center my-10">This game does not exist.</span>

      <button class="flex items-center self-end gap-1 rounded border p-1 px-2 mt-2"
        on:click={() => { select(null) }}>
        <Icon i="arrow-left"/> Back to List
      </button>
    {/if}
  {/if}

  <span>Details provided by BoardGameGeek</span>

  <button class="fixed px-3 py-2 left-0 bottom-0 rounded-tr-lg bg-emerald-800"
    on:click={() => { window.location.href = '/events.html' }}>
    <Icon i="calendar" title="Events" stroke={2} class="!w-10 !h-10"/>
  </button>
</main>

<Dialog bind:visible={dialogVisible} confirmClass="hidden">
  <span>Filter by {dialogType}</span>
  <div class="flex flex-col gap-1 overflow-y-auto min-w-[10rem] pr-1">
    {#if dialogType === 'playerCount'}
      {#each playerCounts as num}
      <button class="flex items-center gap-1 rounded border p-1 pr-2"
        on:click={() => { filters.playerCount = num }}>
        <span class="border" class:text-transparent={filters.playerCount !== num}>
          <Icon i="check" class="!w-4 !h-4"/>
        </span>
        {num} players
      </button>
      {/each}
    {:else}
      {#each users as user}
      <button class="flex items-center gap-1 rounded border p-1 pr-2"
        on:click={() => { toggleFilter(dialogType, user.uid) }}>
        <span class="border" class:text-transparent={!filters[dialogType].includes(user.uid)}>
          <Icon i="check" class="!w-4 !h-4"/>
        </span>
        {user.name}
      </button>
      {/each}
    {/if}
  </div>
</Dialog>
