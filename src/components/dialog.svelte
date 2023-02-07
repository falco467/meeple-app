<script>
  import { getErrorMessage } from '../js/helpers.js'

  export let visible = false
  export let confirmText = 'ok'
  export let confirmClass = 'bg-sky-800'

  /** @type {(() => Promise<void>)|(() => void)} */
  export let onConfirm = async () => {}

  let errText = ''

  export async function tryConfirm () {
    errText = ''
    try {
      await onConfirm()
      visible = false
    } catch (err) {
      errText = getErrorMessage(err)
    }
  }
</script>

{#if visible}
<aside class="fixed inset-0 p-5 flex items-center justify-center bg-slate-800 bg-opacity-80"
  on:click|self={() => { visible = false }}
  on:keyup={e => e.key === 'Escape' && (visible = false)}>
  <div class="flex flex-col p-3 gap-3 max-w-full rounded bg-slate-900">
    <slot></slot>

    {#if errText}<span class="text-red-500">{errText}</span>{/if}
    <div class="flex items-center gap-3">
      <button class={`flex-grow rounded px-5 py-2 disabled:bg-neutral-800 ${confirmClass}`}
        on:click={tryConfirm}>
        {confirmText}
      </button>
      <button class="flex-grow bg-slate-800 rounded px-5 py-2"
        on:click={() => { visible = false }}>
        Close
      </button>
    </div>
  </div>
</aside>
{/if}
