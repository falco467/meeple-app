<script>
  import { createEventDispatcher } from 'svelte'
  import { createAccount, login } from '../js/firedb.js'
  import { getErrorMessage, onEnter } from '../js/helpers.js'
  import Icon from './icon.svelte'

  /** @type {HTMLInputElement} */
  let inputEmail
  /** @type {HTMLInputElement} */
  let inputPassword
  /** @type {HTMLInputElement} */
  let inputName

  let confirmCreation = false
  let errText = ''
  let loading = false

  const dispatch = createEventDispatcher()

  function checkParams () {
    errText = ''
    if (!inputEmail.checkValidity()) {
      throw new Error(`Email: ${inputEmail.validationMessage}`)
    }
    if (!inputPassword.checkValidity()) {
      throw new Error(`Password: ${inputPassword.validationMessage}`)
    }
    if (confirmCreation && !inputName.checkValidity()) {
      throw new Error(`Name: ${inputName.validationMessage}`)
    }
  }

  async function tryLogin () {
    loading = true
    try {
      checkParams()
      await login(inputEmail.value, inputPassword.value)
      dispatch('login')
    } catch (err) {
      errText = getErrorMessage(err)
    }
    loading = false
  }

  async function tryCreateAccount () {
    loading = true
    try {
      checkParams()
      await createAccount(inputEmail.value, inputPassword.value, inputName.value)
      dispatch('login')
    } catch (err) {
      errText = getErrorMessage(err)
    }
    loading = false
  }
</script>

<div class="w-56 flex flex-col gap-5 items-stretch mt-5 self-center">
  <input bind:this={inputEmail} type="email" autocomplete="email" placeholder="email"
    required minlength="8" class="bg-slate-500 rounded p-2"/>
  <input bind:this={inputPassword} type="password" autocomplete="current-password" placeholder="password"
    required minlength="8" class="bg-slate-500 rounded p-2" on:keyup={onEnter(tryLogin)}/>

  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  {#if !confirmCreation}
  <button class="bg-slate-800 rounded px-5 py-3" on:click={tryLogin}>
    {#if loading}<Icon i="cube" class="animate-spin" />{:else}Login{/if}
  </button>
  <button class="bg-sky-800 rounded px-5 py-3" on:click={() => { confirmCreation = true }}>
    Create Account
  </button>

  {:else}
  <input bind:this={inputName} type="text" autocomplete="given-name" placeholder="display name"
    required minlength="2" maxlength="12" class="bg-slate-500 rounded p-2"/>
  <button class="bg-sky-800 rounded px-5 py-3" on:click={tryCreateAccount}>
    {#if loading}<Icon i="cube" class="animate-spin" />{:else}Confirm Creation{/if}
  </button>
  {/if}

</div>
