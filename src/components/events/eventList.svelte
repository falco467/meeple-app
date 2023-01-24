<script>
  import { onDestroy } from 'svelte'
  import { flip } from 'svelte/animate'
  import { eventList } from '../../js/eventListStore.js'
  import { removeEvent } from '../../js/firedb.js'
  import { getErrorMessage } from '../../js/helpers.js'
  import Icon from '../icon.svelte'
  import EventBox from './eventBox.svelte'
  import EventDetails from './eventDetails.svelte'

  /** @type {string} */
  export let uid

  let errText = ''
  let selectedEvent = window.location.hash ? window.location.hash.split(/[#:]/)[1] : null

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

  const unsubEvents = eventList.load(err => { errText = getErrorMessage(err) })
  onDestroy(unsubEvents)
</script>

<main class="flex flex-col gap-2 mb-10">
  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  {#each $eventList as event (event.id)}
    <div animate:flip={{ duration: 200 }}>
      {#if selectedEvent === event.id}
        <EventDetails {event} {uid} on:close={() => { selectedEvent = null }}
          on:remove={() => tryDeleteEvent(event.id)}/>
      {:else if !selectedEvent}
        <EventBox {event} {uid} on:open={() => { selectedEvent = event.id }}/>
      {/if}
    </div>
  {/each}

  <button class="fixed px-3 py-2 left-0 bottom-0 rounded-tr-lg bg-emerald-800"
    on:click={() => { window.location.href = '/' }}>
    <Icon i="cube" title="Games" stroke={2} class="!w-10 !h-10"/>
  </button>
</main>
