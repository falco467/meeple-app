<script>
    import { getICalURL } from '../../js/firedb.js';
    import { getErrorMessage } from '../../js/helpers.js';
    import Dialog from '../dialog.svelte'
    import Icon from '../icon.svelte';

  export let visible = false
  
  let errText = ''
  let okText = ''
  let isLoading = false
  
  /** @param {'webcal'|'copy'} type */
  async function trySubscribeWebcal(type) {
    okText = ''
    errText = ''
    isLoading = true
    try {
      const icalURL = await getICalURL()

      if (!icalURL) throw new Error('calendar is currently not available.')

      if (type === 'copy') {
        navigator.clipboard.writeText(icalURL)
        okText='URL copied to clipboard'

      } else if (type === 'webcal') {
        const wurl = icalURL.replace('https:', 'webcals:')
        window.open(wurl, '_blank')
      }

    } catch (err) {
      errText = getErrorMessage(err)
    }
    isLoading = false
  }
</script>

<Dialog bind:visible confirmClass="hidden">
  <span class="p-2">Show events in your calendar application</span>
  
  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  <button class="rounded border p-1 px-2" disabled={isLoading}
    on:click={() => trySubscribeWebcal('webcal')}>
    {#if isLoading}
      <Icon i="cube" class="animate-spin" />
    {:else}
      iPhone/Outlook
    {/if}
  </button>
  <button class="rounded border p-1 px-2" disabled={isLoading}
    on:click={() => trySubscribeWebcal('copy')}>
    {#if isLoading}
      <Icon i="cube" class="animate-spin" />
    {:else}
      Copy URL
    {/if}
  </button>
  {#if okText}<div class="text-green-500 text-center">{okText}</div>{/if}
  <div></div>
</Dialog>
