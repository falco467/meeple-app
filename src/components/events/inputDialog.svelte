<script>
  import { onEnter } from '../../js/helpers.js'
  import Dialog from '../dialog.svelte'

  export let visible = false
  export let value = ''
  export let label = 'Please enter value:'
  export let placeholder = ''
  export let confirmText = 'Set value'
  export let minlength = 1
  export let maxlength = 100
  export let onConfirm = async () => { /** default empty */ }

  /** @type {() => Promise<void>} */
  let tryConfirm
</script>

<Dialog bind:visible {confirmText} {onConfirm} bind:tryConfirm>
  <span>{label}</span>

  <!-- svelte-ignore a11y-autofocus -->
  <input bind:value type="text" {placeholder} autofocus
    required {minlength} {maxlength} class="bg-slate-500 rounded p-2"
    on:keyup|preventDefault={onEnter(tryConfirm)}/>
</Dialog>
