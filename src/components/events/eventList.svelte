<script>
  import { onDestroy, tick } from 'svelte'
  import { flip } from 'svelte/animate'
  import { scale } from 'svelte/transition'
  import { eventList, isEventOver } from '../../js/eventListStore.js'
  import { removeEvent } from '../../js/firedb.js'
  import { getErrorMessage, getEventHash, getIDFromHash, listAnimation, pushHash, pushHashOnLoad } from '../../js/helpers.js'
  import { isLoading } from '../../js/isLoadingStore.js'
  import { enableMessaging, wantMessaging } from '../../js/messaging.js'
  import Icon from '../icon.svelte'
  import CalSubscribeDialog from './calSubscribeDialog.svelte'
  import EventBox from './eventBox.svelte'
  import EventDetails from './eventDetails.svelte'
  import EventExtras from './eventExtras.svelte'

  let errText = ''
  let eventID = getIDFromHash()
  let showNotificationButton = wantMessaging()
  let showCalSubscibeDialog = false

  if (eventID) {
    pushHashOnLoad()
  }

  /** @param {string} eID */
  async function tryDeleteEvent (eID) {
    errText = ''
    try {
      await removeEvent(eID)
      eventID = null
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
  async function select (event) {
    if (event == null) {
      window.history.back()
      return
    }

    eventID = event.id
    pushHash(getEventHash(event))
    await tick()
    window.scrollTo(0, 0)
  }

  function onHashChange () {
    eventID = getIDFromHash()
  }

  $: selectedEvent = $eventList.find(e => e.id === eventID)
  $: pastEvents = $eventList.filter(e => isEventOver(e)).reverse()
  $: futureEvents = $eventList.filter(e => !isEventOver(e))

  if (!import.meta.env.SSR) {
    window.addEventListener('hashchange', onHashChange)

    const unsubEvents = eventList.load(err => { errText = getErrorMessage(err) })
    onDestroy(() => {
      unsubEvents()
      window.removeEventListener('hashchange', onHashChange)
    })
  }

</script>

<main class="flex flex-col gap-2 mb-10">
  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  {#if !eventID}
    {#each futureEvents as event (event.id)}
      <div class="flex flex-col" animate:flip={listAnimation}>
        <EventBox {event} on:open={() => select(event)}/>
      </div>
    {/each}

    {#if showNotificationButton}
      <button class="rounded border p-1 px-2" on:click={tryEnableMessaging}>
        Enable Notifications
      </button>
    {/if}

    <button class="rounded border p-1 px-2" on:click={() => { showCalSubscibeDialog = true }}>
      Calendar Intergration
    </button>

    <h1 class="text-center text-xl mt-5">Past events</h1>

    {#each pastEvents as event (event.id)}
      <div class="flex flex-col" animate:flip={listAnimation}>
        <EventBox {event} on:open={() => select(event)}/>
      </div>
    {/each}
  {:else}
    <div class="flex flex-col" in:scale={{ start: 0.8, duration: 200 }}>
      {#if selectedEvent}
        <EventDetails event={selectedEvent} on:close={() => select(null)}
          onRemove={() => tryDeleteEvent(/** @type {NonNullable<typeof selectedEvent>} */(selectedEvent).id)}/>
      {:else if $isLoading}
        <span class="text-center my-10">Loading...</span>
      {:else}
        <span class="text-center my-10">This event does not exist.</span>
      {/if}

      <button class="flex items-center self-end gap-1 rounded border p-1 px-2 mt-2"
        on:click={() => select(null)}>
        <Icon i="arrow-left"/> Back to List
      </button>

      {#if selectedEvent}
        <EventExtras event={selectedEvent} />
      {/if}
    </div>
  {/if}

  <CalSubscribeDialog bind:visible={showCalSubscibeDialog}/>

  <button class="fixed px-3 py-2 left-0 bottom-0 rounded-tr-lg bg-emerald-800"
    on:click={() => { window.location.href = '/' }}>
    <Icon i="cube" title="Games" stroke={2} class="!w-10 !h-10"/>
  </button>
</main>
