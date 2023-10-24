<script>
  import { createEventDispatcher } from 'svelte'
  import { addEventTimes, setEventFinalDate, setEventLastVoted, setEventVote, uid } from '../../js/firedb.js'
  import { getDayList, getErrorMessage, shareEvent } from '../../js/helpers.js'
  import { userList } from '../../js/userStore.js'
  import Dialog from '../dialog.svelte'
  import Icon from '../icon.svelte'
  import CalendarBox from './calendarBox.svelte'

  /** @type {import('../../js/firedb.js').Event} */
  export let event
  export let editing = false
  export let onRemove = async () => {}

  let errText = ''
  let deleteModalVisible = false
  let addTimesVisible = false
  let selectionInProgress = false

  const dispatch = createEventDispatcher()

  /** @param {string} day @param {string} time @param {'basic'|'favorite'|'home'} voteType */
  async function tryToggleVote (day, time, voteType) {
    errText = ''
    try {
      if (event.days[day][time].votes == null) event.days[day][time].votes = {}

      const vote = event.days[day][time].votes[uid]
      if (!vote) {
        await setVote(day, time, {
          isFavorite: voteType === 'favorite', isHome: voteType === 'home'
        })
      } else if (voteType === 'basic') {
        await removeVote(day, time)
      } else {
        if (voteType === 'favorite') vote.isFavorite = !vote.isFavorite
        if (voteType === 'home') vote.isHome = !vote.isHome
        await setVote(day, time, vote)
      }
    } catch (err) {
      errText = getErrorMessage(err)
    }
  }

  async function trySetNotAttending () {
    errText = ''
    try {
      await setEventLastVoted(event.id, uid)
    } catch (err) {
      errText = getErrorMessage(err)
    }
  }

  /** @param {string} day @param {string} time @param {import('../../js/firedb.js').EventVote} vote */
  async function setVote (day, time, vote) {
    if (editing) {
      event.days[day][time].votes[uid] = vote
    } else {
      await setEventVote(event.id, day, time, uid, vote)
    }
  }

  /** @param {string} day @param {string} time */
  async function removeVote (day, time) {
    if (editing) {
      delete event.days[day][time].votes[uid]
      event = event
    } else {
      await setEventVote(event.id, day, time, uid, null)
    }
  }

  async function trySaveSelection () {
    errText = ''
    try {
      if (event.selectedDay == null || event.selectedTime == null) {
        throw new Error('Please select a date first.')
      }
      await setEventFinalDate(event.id, event.selectedDay, event.selectedTime)
      selectionInProgress = false
    } catch (err) {
      errText = getErrorMessage(err)
    }
  }

  function cancelSelection () {
    delete event.selectedDay
    delete event.selectedTime
    selectionInProgress = false
  }

  /** @param {string} day @param {string} time */
  function isSelected (day, time) {
    return event.selectedDay === day && event.selectedTime === time
  }

  /** @type {{[date:string]: string}} */
  let toAddList

  async function tryAddTimes () {
    if (!Object.keys(toAddList).length) throw Error('No new dates selected')
    await addEventTimes(event.id, toAddList, uid)
  }
</script>

<article class="flex flex-col gap-2 bg-slate-800 rounded p-2" class:border={!event.lastVoted[uid]}>
  <div class="flex items-center gap-1">
    <h2 class="overflow-hidden text-ellipsis whitespace-nowrap text-xl">
      {event.name}
    </h2>
    <div class="flex-grow"></div>
    {#if !editing}
      <button class="p-2 rounded border" on:click={async () => { await shareEvent(event) }}>
        <Icon i="share" stroke={2} class="!w-4 !h-4"/>
      </button>
    {/if}
  </div>

  <div class="flex items-center gap-1">
    Vote:
    <Icon i="thumbs-up" class="ml-2" stroke={2} />ok
    <Icon i="star" class="ml-2" stroke={2} />favorite
    <Icon i="home" class="ml-2" stroke={2} />can host
  </div>

  {#each getDayList(event.days) as day (day.date)}
    <article class="flex flex-col gap-2 rounded p-1 border">
      {#each Object.entries(day.times) as [t, timeSlot], i (t)}
        <div class="flex flex-col rounded p-1"
          class:border={isSelected(day.date, t)} class:bg-slate-700={isSelected(day.date, t)}>
          <section class="flex items-center gap-2 flex-wrap">
            {#if i === 0 || isSelected(day.date, t)}
              <div class="basis-8 text-sm font-bold text-slate-500">
                {day.weekday}
              </div>
              <div class="basis-14 whitespace-nowrap">
                {day.dom}. {day.month}
              </div>
              {#if editing}
                <button class="border rounded p-1" on:click={() => dispatch('addTime', { day: day.times })}>
                  <Icon i="plus" title="add time" class="!h-4 !w-4"/>
                </button>
              {/if}
            {:else}
              <div class="basis-24"></div>
              {#if editing}
                <button class="border rounded p-1" on:click={() => dispatch('removeTime', { day: day.times, time: t })}>
                  <Icon i="minus" title="remove time" class="!h-4 !w-4"/>
                </button>
              {/if}
            {/if}

            {#if editing}
              <button class="flex items-center gap-1" on:click={() => dispatch('editTime', { day: day.times, time: t })}>
                <Icon i="pencil" class="!h-4 !w-4" title="edit time"/>{t}
              </button>
            {:else}
              <div>{t}</div>
            {/if}

            <div class="flex-grow"></div>

            {#if selectionInProgress}
              <button class="flex items-center gap-1 rounded border p-1 pr-2"
                on:click={() => { event.selectedDay = day.date; event.selectedTime = t }}>
                <span class:text-transparent={!isSelected(day.date, t)}>
                  <Icon i="check" class="!w-4 !h-4 border"/>
                </span>Select
              </button>
            {:else}
            <div class="flex items-center">
              <button class="rounded-full p-1" class:bg-sky-800={timeSlot.votes?.[uid]}
                on:click={async () => { await tryToggleVote(day.date, t, 'basic') }}>
                <Icon i="thumbs-up" title="ok" stroke={2}/>
              </button>
              <button class="rounded-full p-1" class:bg-amber-700={timeSlot.votes?.[uid]?.isFavorite}
                on:click={async () => { await tryToggleVote(day.date, t, 'favorite') }}>
                <Icon i="star" title="favorite" stroke={2}/>
              </button>
              <button class="rounded-full p-1" class:bg-emerald-800={timeSlot.votes?.[uid]?.isHome}
                on:click={async () => { await tryToggleVote(day.date, t, 'home') }}>
                <Icon i="home" title="host" stroke={2}/>
              </button>
            </div>
            {/if}
          </section>

          <ul class="flex gap-2 flex-wrap text-xs">
            {#each Object.entries(timeSlot.votes) as [voter, vote] (voter)}
              <li class="flex gap-1 items-center rounded-full p-1 px-2"
                class:bg-sky-800={!vote.isFavorite} class:bg-amber-700={vote.isFavorite}>
                <span >{$userList[voter]?.name || '***'}</span>
                {#if vote.isHome}<Icon i="home" title="host" class="!h-3 !w-3" stroke={2}/>{/if}
              </li>
            {/each}
            <div class="flex-grow"></div>
          </ul>
        </div>
      {/each}
    </article>
  {/each}

  {#if errText}<span class="text-red-500">{errText}</span>{/if}

  {#if !editing && event.creator === uid}
    {#if selectionInProgress}
      <div class="flex gap-5">
        <button class="rounded border p-1 px-2 text-emerald-800 border-emerald-800"
          on:click={trySaveSelection}>
          Confirm Selection
        </button>
        <div class="flex-grow"></div>
        <button class="rounded border p-1 px-2" on:click={cancelSelection}>
          Cancel
        </button>
      </div>
    {:else}
      <div class="flex gap-3">
        <button class="rounded border p-1 px-2 text-amber-700 border-amber-700"
          on:click={() => { deleteModalVisible = true }}>
          Delete
        </button>
        <div class="flex-grow"></div>
        <button class="rounded border p-1 px-2"
          on:click={() => { addTimesVisible = true }}>
          Add times
        </button>
        <button class="rounded border p-1 px-2" on:click={() => { selectionInProgress = true }}>
          {event.selectedDay ? 'Change' : 'Select'} date
        </button>
      </div>
    {/if}
  {:else if !editing && !event.lastVoted[uid]}
  <div class="flex gap-5">
    <div class="flex-grow"></div>
    <button class="rounded border p-1 px-2" on:click={trySetNotAttending}>
      Mark as not attending
    </button>
  </div>
  {/if}

  <Dialog bind:visible={addTimesVisible} confirmText="Add Times" onConfirm={tryAddTimes}>
    <div class="flex flex-col gap-5 max-h-96 overflow-y-scroll">
      <CalendarBox bind:toAddList {event} readOnly/>
    </div>
  </Dialog>

  <Dialog bind:visible={deleteModalVisible} confirmText="Delete Event" confirmClass="bg-amber-700"
    onConfirm={onRemove}>
    <span>Confirm deletion of Event</span>
    <span>{event.name}</span>
  </Dialog>
</article>
