<script>
  import { getICalURL } from '../../js/firedb.js'
  import { getErrorMessage } from '../../js/helpers.js'
  import Dialog from '../dialog.svelte'
  import Icon from '../icon.svelte'

  export let visible = false

  let errText = ''
  let okText = ''
  let icalURL = 'loading'
  let isLoading = true

  async function loadICSURL () {
    isLoading = true
    try {
      const url = await getICalURL()
      if (url == null) throw new Error('calendar is currently not available.')
      icalURL = url
    }
    catch (err) {
      errText = getErrorMessage(err)
    }
    isLoading = false
  }

  async function copyURL () {
    try {
      await navigator.clipboard.writeText(icalURL)
      okText = 'URL copied to clipboard'
    }
    catch (err) {
      errText = getErrorMessage(err)
    }
  }

  void loadICSURL()
</script>

<Dialog bind:visible confirmClass="hidden">
  <div class="p-4 flex flex-col gap-4">
    <span class="text-xl font-bold">See events in your calendar</span>

    {#if errText}<span class="text-red-500">{errText}</span>{/if}

    <span>Add the following URL to your calender<br>(subscribe to public calender/ical):</span>

    <textarea readonly bind:value={icalURL} rows="7"
      class="bg-slate-500 rounded-l p-2 flex-grow break-all"/>

    <button class="rounded border p-1 px-2" disabled={isLoading} on:click={copyURL}>
      {#if isLoading}
        <Icon i="cube" class="animate-spin" />
      {:else}
        Copy URL
      {/if}
    </button>
    {#if okText}<div class="text-green-500 text-center">{okText}</div>{/if}
  </div>
</Dialog>
