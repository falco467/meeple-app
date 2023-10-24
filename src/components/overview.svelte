<script>
  import { onDestroy } from 'svelte'
  import { customListener, getErrorMessage } from '../js/helpers.js'
  import { userList } from '../js/userStore.js'
  import { checkLogin, uid } from '../js/firedb.js'
  import Icon from './icon.svelte'
  import Login from './login.svelte'
  import { isLoading } from '../js/isLoadingStore.js'

  export let kind = 'Game'

  let errText = ''
  let showLogin = false
  let showForm = false

  function loadUsers () {
    errText = ''
    return userList.load(err => { errText = getErrorMessage(err) })
  }

  async function tryLogin () {
    const isLoggedIn = await checkLogin()
    showLogin = !isLoggedIn
    if (isLoggedIn && errText) {
      unsubUsers = loadUsers()
    }
  }

  let unsubUsers = loadUsers()
  onDestroy(() => unsubUsers())

  void tryLogin()
</script>

<div class="flex flex-col gap-3 self-center w-full max-w-lg">
  <header class="fixed z-10 inset-0 bottom-auto p-3
    flex items-center justify-between bg-slate-700 shadow-lg">
    {#if !showLogin}
      <div class="flex items-center gap-1 rounded border pl-1 pr-2 py-1 shadow">
        <Icon i="user" title="User logged in as"/>
        {$userList?.[uid]?.name || ''}
      </div>
    {/if}
    <h1 class="relative text-xl flex items-center gap-1 mx-1 flex-shrink overflow-hidden">
      <span class="max-[299px]:hidden">Meeple</span>
      <img src="favicon-32x32.png" aria-hidden="true" alt="a red die">
      <span class="max-[359px]:hidden">CGN</span>
      {#if $isLoading}
        <div class="absolute inset-0 flex justify-center items-center">
          <span class="bg-slate-800 rounded-lg p-1 px-2 text-sm text-white">updating</span>
        </div>
      {/if}
    </h1>
    {#if !showLogin}
      <button class="flex items-center gap-1 rounded border pl-1 pr-2 py-1 shadow"
        on:click={() => { showForm = !showForm }}>
        <Icon i="plus" title="Add"/>{kind}
      </button>
    {/if}
  </header>

  <div class="mb-10"></div>

  {#if showLogin}
    <Login on:login={tryLogin}/>
  {:else}
    {#if errText}<span class="text-red-500">{errText}</span>{/if}

    <div class="contents" class:hidden={!showForm}
      use:customListener={{ on: 'close', do: () => { showForm = false } }} >
      <slot name="form"/>
    </div>
    <div class="contents" class:hidden={showForm}>
      <slot name="list"/>
    </div>
  {/if}
</div>
