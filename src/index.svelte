<script>
  import { onDestroy } from 'svelte'
  import { getErrorMessage, getSavedState, saveState } from './js/helpers.js'
  import { userList } from './js/userStore.js'
  import { getLogin } from './js/firedb.js'
  import AddEventModal from './components/events/addEventModal.svelte'
  import AddGameModal from './components/games/addGameModal.svelte'
  import EventList from './components/events/eventList.svelte'
  import GameList from './components/games/gameList.svelte'
  import Icon from './components/icon.svelte'
  import Login from './components/login.svelte'

  /** @type {'game'|'events'} */
  export let kind = 'game'

  const uidStorageKey = 'meeple:uid'

  let errText = ''
  let uid = getSavedState(uidStorageKey) || ''
  let showLogin = false
  let showAddModal = false

  tryLogin()

  let unsubUsers = loadUsers()
  onDestroy(() => unsubUsers())

  function loadUsers () {
    errText = ''
    return userList.load(err => { errText = getErrorMessage(err) })
  }

  async function tryLogin () {
    try {
      showLogin = false
      uid = await getLogin()
      saveState(uidStorageKey, uid)
      if (errText) {
        unsubUsers = loadUsers()
      }
    } catch (err) {
      console.log(err)
      showLogin = true
    }
  }
</script>

<header class="fixed z-10 inset-0 bottom-auto h-14 flex flex-col
  items-center justify-center bg-slate-700 shadow-lg">
  <h1 class="text-xl flex items-center gap-1">
    Meeple
    <img src="favicon-32x32.png" aria-hidden="true" alt="a red die">
    CGN
  </h1>
</header>

<div class="mb-10"></div>

{#if showLogin}
  <Login on:login={tryLogin}/>
{:else}
  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  <div class="fixed z-10 flex items-center gap-1 top-3 left-3 rounded border pl-1 pr-2 py-1 shadow">
    <Icon i="user" title="User logged in as"/>
    {$userList?.[uid]?.name || ''}
  </div>
  <button class="fixed z-10 flex items-center gap-1 top-3 right-3 rounded border pl-1 pr-2 py-1 shadow"
    on:click={() => { showAddModal = !showAddModal }}>
    <Icon i="plus" title="Add"/>{kind === 'game' ? 'Game' : 'Event'}
  </button>

  {#if showAddModal}
    <svelte:component this={kind === 'game' ? AddGameModal : AddEventModal} {uid}
      on:close={ () => { showAddModal = false }} />
  {:else}
    <svelte:component this={kind === 'game' ? GameList : EventList} {uid} />
  {/if}
{/if}
