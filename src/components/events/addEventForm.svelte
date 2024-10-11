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
      [uid]: Date.now(),
    },
  }

  let errText = ''
  let loading = false

  let timeModalVisible = false
  /** @type {typeof event.days['']?} */
  let inputModalDay = null
  let timeInputOrgValue = ''
  let timeInput = ''

  const timeMinLen = 2
  const timeMaxLen = 10
  const nameMinLen = 4
  const nameMaxLen = 20

  /** @param {typeof event.days['']} day @param {string} time */
  function showTimeInputModal (day, time = '') {
    inputModalDay = day
    timeInputOrgValue = time
    timeInput = time
    timeModalVisible = true
  }

  async function submitTimeInput () {
    if (timeInput === timeInputOrgValue || inputModalDay == null) {
      return
    }

    if (timeInput.length < timeMinLen || timeInput.length > timeMaxLen) {
      throw new Error(`Only between ${timeMinLen} and ${timeMaxLen} characters allowed`)
    }

    if (timeInputOrgValue !== '') {
      inputModalDay[timeInput] = inputModalDay[timeInputOrgValue]
      delete inputModalDay[timeInputOrgValue]
    }
    else {
      inputModalDay[timeInput] = {
        votes: { [uid]: { isFavorite: false, isHome: false } },
        created: Date.now(),
      }
    }

    event = event
    await Promise.resolve()
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
      if (event.name.length < nameMinLen || event.name.length > nameMaxLen) {
        throw new Error(`Event Name must have between ${nameMinLen} and ${nameMaxLen} characters`)
      }
      const days = Object.keys(event.days)
      if (days.length === 0) {
        throw new Error('Event needs at least one date')
      }
      if (days.length === 1) {
        const times = Object.keys(event.days[days[0]])
        if (times.length === 1) {
          event.selectedDay = days[0]
          event.selectedTime = times[0]
        }
      }
      await addEvent(event)
      customDispatch(e, 'close')
    }
    catch (err) {
      errText = getErrorMessage(err)
    }
    loading = false
  }
</script>

<div class="flex flex-col gap-5 items-stretch mt-5">
  <!-- svelte-ignore a11y-autofocus -->
  <input bind:value={event.name} type="text" placeholder="event name" autofocus
    required minlength={nameMinLen} maxlength={nameMaxLen} class="bg-slate-500 rounded p-2"/>

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
    label="Change time" confirmText="Set time" minlength={timeMinLen} maxlength={timeMaxLen} />

</div>
