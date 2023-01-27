<script>
  import { createEventDispatcher } from 'svelte'
    import { isEventOver } from '../../js/eventListStore.js'
  import { getDate, getDayList } from '../../js/helpers.js'
  import { userList } from '../../js/userStore.js'
  import Icon from '../icon.svelte'

  // import { addEventVote, removeEventVote } from '../js/firedb.js'

  /** @type {string} */
  export let uid
  /** @type {import('../../js/firedb.js').Event} */
  export let event

  const dispatch = createEventDispatcher()

  /** @param {string} voter */
  function getVoterColor (voter) {
    return hasAnyVotes(voter) ? 'bg-sky-800' : 'bg-neutral-700'
  }

  /** @param {string} voter */
  function hasAnyVotes (voter) {
    return Object.values(event.days).some(
      d => Object.values(d).some(t => t.votes?.[voter]))
  }

  /** @param {typeof event} _eventForReactivity */
  function getSortedVoters (_eventForReactivity) {
    const voters = Object.keys(event.lastVoted)
    voters.sort((a, b) => {
      if (a === event.creator) return -1
      if (b === event.creator) return 1
      return ($userList[a]?.name || '***').localeCompare($userList[b]?.name || '***')
    })

    return voters
  }

  /** @param {typeof event} _eventForReactivity */
  function getBestDays (_eventForReactivity) {
    const days = Object.entries(event.days).map(([date, day]) => {
      const d = new Date(date)
      return {
        date,
        month: getDate(d, 'month'),
        weekday: getDate(d, 'weekday'),
        dom: getDate(d, 'day', 'numeric'),
        voteCount: getVoteCount(day),
        starCount: getVoteCount(day, v => v.isFavorite),
        homeCount: getVoteCount(day, v => v.isHome)
      }
    })

    days.sort((a, b) => (getVoteScore(b) - getVoteScore(a)) || a.date.localeCompare(b.date))

    return days.slice(0, 3)
  }

  /** @param {typeof event} _eventForReactivity */
  function getSelectedDayAndTime (_eventForReactivity) {
    if (event.selectedDay == null || event.selectedTime == null) return []
    return getDayList(event.days).filter(d => d.date === event.selectedDay)
      .map(d => ({ ...d, t: event.selectedTime || '', timeSlot: d.times[event.selectedTime || ''] }))
  }

  /** @param {typeof event.days['']} times @param {((v:import('../../js/firedb.js').EventVote) => boolean)?} filter */
  function getVoteCount (times, filter = null) {
    let count = 0
    Object.values(times).forEach(t => {
      const c = Object.values(t.votes || {}).filter(v => filter == null || filter(v)).length
      if (c > count) count = c
    })
    return count
  }

  /** @param {ReturnType<getBestDays>[0]} v */
  function getVoteScore (v) {
    return v.voteCount + v.starCount * 0.3 + (v.homeCount ? 0.5 : 0)
  }

  /** @param {typeof event} _eventForReactivity */
  function getEventColor (_eventForReactivity) {
    const today = new Date()
    today.setTime(today.getTime() - today.getTime() % (24 * 60 * 60 * 1000))

    if (isEventOver(event)) {
      return ' bg-neutral-800 text-neutral-400'
    }
    return ' bg-slate-800'
  }
</script>

<button class={'flex flex-col items-stretch gap-2 rounded p-2 mb-2 ' + getEventColor(event)}
  on:click={() => dispatch('open')}>
  <div class="flex items-center gap-1">
    <h2 class="overflow-hidden text-ellipsis whitespace-nowrap text-xl">
      {event.name}
    </h2>
  </div>

  {#each getSelectedDayAndTime(event) as day}
    <div class="flex flex-col gap-1 rounded p-1 border bg-slate-700">
      <section class="flex items-center gap-2">
        <div class="basis-8 text-sm font-bold text-slate-500">
          {day.weekday}
        </div>
        <div class="basis-14 whitespace-nowrap">
          {day.dom}. {day.month}
        </div>

        <div>{day.t}</div>

        <div class="flex-grow"></div>
      </section>

      <ul class="flex gap-2 flex-wrap text-xs">
        {#each Object.entries(day.timeSlot.votes || {}) as [voter, vote] (voter)}
        <li class="flex gap-1 items-center rounded-full p-1 px-2"
          class:bg-sky-800={!vote.isFavorite} class:bg-amber-700={vote.isFavorite}>
          <span >{$userList[voter]?.name || '***'}</span>
          {#if vote.isHome}<Icon i="home" title="host" class="!h-3 !w-3" stroke={2}/>{/if}
        </li>

        {/each}
        <div class="flex-grow"></div>
      </ul>
    </div>
  {:else}
    <ul class="flex gap-2 items-center flex-wrap text-sm">
      {#each getBestDays(event) as day (day.date)}
        <div class="flex flex-col items-center gap-1 rounded border p-1">
          <div class="flex gap-1 items-baseline px-1">
            <div class="basis-8 text-base font-bold text-slate-500">
              {day.weekday}
            </div>
            <div class="basis-14 whitespace-nowrap">
              {day.dom}.&nbsp;{day.month}
            </div>
          </div>

          <div class="flex gap-1 items-center text-xs mb-1">
            <div class="flex items-center justify-center rounded-full h-5 w-5"
              class:bg-neutral-700={!day.voteCount} class:bg-sky-800={day.voteCount}>
              {day.voteCount}
            </div>
            <div class="flex items-center justify-center rounded-full h-5 w-5"
              class:bg-neutral-700={!day.starCount} class:bg-amber-700={day.starCount}>
              {day.starCount}
            </div>
            <div class="flex items-center justify-center rounded-full h-5 w-5"
              class:bg-neutral-700={!day.homeCount} class:bg-emerald-800={day.homeCount}>
              <Icon i="home" title="host" stroke={2}
                class={`!h-4 !w-4 ${day.homeCount ? '' : 'text-neutral-500'}`}/>
            </div>
          </div>
        </div>
      {/each}

      {#if Object.keys(event.days).length > 3}
        <div class="flex-shrink-0 rounded-full border h-2 w-2"></div>
        <div class="flex-shrink-0 rounded-full border h-2 w-2 -ml-1"></div>
        <div class="flex-shrink-0 rounded-full border h-2 w-2 -ml-1"></div>
      {/if}
    </ul>

    <ul class="flex gap-2 flex-wrap text-xs">
      {#each getSortedVoters(event) as voter (voter)}
        <li class={`flex gap-1 items-center rounded-full p-1 px-2 ${getVoterColor(voter)}`} >
          <span>{$userList[voter]?.name || '***'}</span>
        </li>
      {/each}
      <div class="flex-grow"></div>
      {#if !event.lastVoted[uid]}
        <button class="p-1 px-2 rounded border bg-emerald-700" on:click|stopPropagation={() => dispatch('open')}>
          Vote
        </button>
      {/if}
    </ul>
  {/each}
</button>
