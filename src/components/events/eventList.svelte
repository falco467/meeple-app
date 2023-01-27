<script>
  import { onDestroy } from 'svelte'
  import { flip } from 'svelte/animate'
  import { eventList } from '../../js/eventListStore.js'
  import { removeEvent } from '../../js/firedb.js'
  import { getErrorMessage, getEventHash } from '../../js/helpers.js'
  import { enableMessaging, wantMessaging } from '../../js/messaging.js'
  import Icon from '../icon.svelte'
  import EventBox from './eventBox.svelte'
  import EventDetails from './eventDetails.svelte'

  /** @type {string} */
  export let uid

  let errText = ''
  let selectedEvent = getEventIDFromHash()
  let showNotificationButton = wantMessaging()

  /** @param {string} eventID */
  async function tryDeleteEvent (eventID) {
    errText = ''
    try {
      await removeEvent(eventID)
      selectedEvent = null
    } catch (err) {
      errText = getErrorMessage(err)
    }
  }

  async function tryEnableMessaging () {
    try {
      await enableMessaging()
      showNotificationButton = wantMessaging()
    } catch (err) {
      errText = getErrorMessage(err)
    }
  }

  /** @param {import('../../js/firedb.js').Event?} event */
  function select (event) {
    selectedEvent = event ? event.id : null
    const newHash = event ? getEventHash(event) : ''
    window.history.pushState(null, '', `${window.location.pathname}${newHash}`)
  }

  /** @param {HashChangeEvent} event */
  function onHashChange (event) {
    selectedEvent = getEventIDFromHash()
  }

  function getEventIDFromHash () {
    return window.location.hash ? window.location.hash.split(/[#:]/)[1] : null
  }

  window.addEventListener('hashchange', onHashChange)

  const unsubEvents = eventList.load(err => { errText = getErrorMessage(err) })
  onDestroy(() => {
    unsubEvents()
    window.removeEventListener('hashchange', onHashChange)
  })
</script>

<main class="flex flex-col mb-10">
  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  {#if showNotificationButton}
    <button class="rounded border p-1 px-2" on:click={tryEnableMessaging}>
      Enable Notifications
    </button>
  {/if}

  {#each $eventList as event (event.id)}
    <div class="flex flex-col" animate:flip={{ duration: 200 }}>
      {#if selectedEvent === event.id}
        <EventDetails {event} {uid} on:close={() => select(null)}
          on:remove={() => tryDeleteEvent(event.id)}/>
      {:else if !selectedEvent}
        <EventBox {event} {uid} on:open={() => select(event)}/>
      {/if}
    </div>
  {/each}
  {#if selectedEvent}
    {#if !$eventList.some(e => e.id === selectedEvent)}
      <span class="text-center my-10">This event does not exist.</span>
    {/if}

    <button class="flex items-center self-end gap-1 rounded border p-1 px-2 mt-2" on:click={() => select(null)}>
      <Icon i="arrow-left"/> Back to List
    </button>
  {/if}

  <button class="fixed px-3 py-2 left-0 bottom-0 rounded-tr-lg bg-emerald-800"
    on:click={() => { window.location.href = '/' }}>
    <Icon i="cube" title="Games" stroke={2} class="!w-10 !h-10"/>
  </button>
</main>
