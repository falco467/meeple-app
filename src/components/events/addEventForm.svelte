<script>
  import { addEvent, uid } from '../../js/firedb.js'
  import { customDispatch, getErrorMessage } from '../../js/helpers.js'
  import Icon from '../icon.svelte'
  import CalendarBox from './calendarBox.svelte'
  import EventDetails from './eventDetails.svelte'
  import InputModal from './inputDialog.svelte'

  /** @type {import('../../js/firedb.js').Event} */
  let event = {
    id: '',
    created: Date.now(),
    creator: uid,
    name: '',
    days: {},
    lastVoted: {
      [uid]: Date.now()
    }
  }

  let errText = ''
  let loading = false

  let timeModalVisible = false
  /** @type {typeof event.days['']} */
  let inputModalDay
  let timeInputOrgValue = ''
  let timeInput = ''

  /** @param {typeof event.days['']} day @param {string} time */
  function showTimeInputModal (day, time = '') {
    inputModalDay = day
    timeInputOrgValue = time
    timeInput = time
    timeModalVisible = true
  }

  async function submitTimeInput () {
    if (timeInput === timeInputOrgValue) {
      return
    }

    if (timeInput.length < 2 || timeInput.length > 10) {
      throw new Error('Only between 2 and 10 characters allowed')
    }

    if (timeInputOrgValue != null) {
      inputModalDay[timeInput] = inputModalDay[timeInputOrgValue]
      delete inputModalDay[timeInputOrgValue]
    } else {
      inputModalDay[timeInput] = {
        votes: { [uid]: { isFavorite: false, isHome: false } },
        created: Date.now()
      }
    }

    event = event
    return Promise.resolve()
  }

  /** @param {typeof event.days['']} day @param {string} time */
  function removeTime (day, time) {
    delete day[time]
    event = event
  }

  /** @param {Event} e */
  async function tryAddEvent (e) {
    errText = ''
    loading = true
    try {
      if (event.name.length < 4) {
        throw new Error('Event Name must at least have 4 characters')
      }
      if (Object.keys(event.days).length === 0) {
        throw new Error('Event needs at least one date')
      }
      await addEvent(event)
      customDispatch(e, 'close')
    } catch (err) {
      errText = getErrorMessage(err)
    }
    loading = false
  }

</script>

<div class="flex flex-col gap-5 items-stretch mt-5">
  <!-- svelte-ignore a11y-autofocus -->
  <input bind:value={event.name} type="text" placeholder="event name" autofocus
    required minlength="4" maxlength="30" class="bg-slate-500 rounded p-2"/>

  <CalendarBox bind:event />

  <EventDetails bind:event editing
    on:removeTime={e => { removeTime(e.detail.day, e.detail.time) }}
    on:addTime={e => { showTimeInputModal(e.detail.day) }}
    on:editTime={e => { showTimeInputModal(e.detail.day, e.detail.time) }}/>

  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  <div class="flex items-center gap-5">
    <button class="flex-grow bg-sky-800 rounded px-5 py-3 disabled:bg-neutral-800"
      class:invisible={event == null} on:click={tryAddEvent}>
      {#if loading}<Icon i="cube" class="animate-spin" />{:else}Add Event{/if}
    </button>
    <button class="flex-grow bg-slate-800 rounded px-5 py-3" on:click={e => { customDispatch(e, 'close') }}>
      Close
    </button>
  </div>

  <InputModal bind:value={timeInput} bind:visible={timeModalVisible} onConfirm={submitTimeInput}
    label="Change time" confirmText="Set time" minlength={2} maxlength={12} />

</div>
