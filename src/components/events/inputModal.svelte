<script>
  import { getErrorMessage, onEnter } from '../../js/helpers.js'

  export let visible = false
  export let value = ''
  export let label = 'Please Enter Value:'
  export let submit = async () => {}

  let errText = ''

  async function trySubmit () {
    errText = ''
    try {
      await submit()
      visible = false
    } catch (err) {
      errText = getErrorMessage(err)
    }
  }
</script>

{#if visible}
<aside class="fixed inset-0 flex items-center justify-center bg-slate-800 bg-opacity-80"
  on:click|self={() => { visible = false }}
  on:keyup={e => e.key === 'Escape' && (visible = false)}>

  <div class="flex flex-col p-3 gap-3 w-64 rounded bg-slate-900">
    <span>{label}</span>
    <!-- svelte-ignore a11y-autofocus -->
    <input bind:value type="text" placeholder="time" autofocus
      required minlength="2" maxlength="12" class="bg-slate-500 rounded p-2"
      on:keyup|preventDefault={onEnter(trySubmit)}/>

    {#if errText}<span class="text-red-500">{errText}</span>{/if}
    <div class="flex items-center gap-3">
      <button class="flex-grow bg-sky-800 rounded px-5 py-2 disabled:bg-neutral-800"
        on:click={trySubmit}>
        Set Time
      </button>
      <button class="flex-grow bg-slate-800 rounded px-5 py-2"
        on:click={() => { visible = false }}>
        Close
      </button>
    </div>
  </div>
</aside>
{/if}
