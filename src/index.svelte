<script>
  import { onDestroy } from 'svelte'
  import AddModal from './components/addModal.svelte'
  import GameList from './components/gameList.svelte'
  import Icon from './components/icon.svelte'
  import Login from './components/login.svelte'
  import { getLogin, onEnter } from './js/helpers.js'
  import { userList } from './js/userStore.js'

  let userPromise = getLogin()
  let isAddModalVisible = false

  function toggleAddModal () {
    isAddModalVisible = !isAddModalVisible
  }

  let errText = ''
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

{#if errText}<span class="text-red-500">{errText}</span>{/if}

{#await userPromise}
  <div class="flex-grow text-center">Loading...</div>

{:then uid}
  <div class="fixed z-10 flex items-center gap-1 top-3 left-3 rounded border pl-1 pr-2 py-1 shadow">
    <Icon i="user" title="User logged in as"/>
    {$userList?.[uid]?.name || '***'}
  </div>
  <button class="fixed z-10 flex items-center gap-1 top-3 right-3 rounded border pl-1 pr-2 py-1 shadow"
    on:click={toggleAddModal} on:keyup={onEnter(toggleAddModal)}>
    <Icon i="plus" title="Add"/>Game
  </button>

  {#if isAddModalVisible}
    <AddModal on:close={ () => { isAddModalVisible = false }} />
  {:else}
    <GameList {uid} />
  {/if}

{:catch}
  <Login on:login={() => { userPromise = getLogin() }}/>
{/await}
