<script>
    import { uid } from '../../js/firedb.js'
  import { getDate, toISODay } from '../../js/helpers.js'
  import InputModal from './inputDialog.svelte'

  /** @type {import('../../js/firedb.js').Event} */
  export let event

  export let readOnly = false
  /** @type {{[date:string]:string}} */
  export const toAddList = {}

  let displayWeeks = 4
  let defaultTime = 'evening'

  /** @type {{isFiller?: boolean, isMonth?: boolean, label?: string, date?: string,
   * dom?: number, isWeekend?:boolean, active?:boolean, disabled?:boolean, isInset?: boolean }[]} */
  let calendarList

  $: generateCalendarList(displayWeeks)

  /** @param {number} weeks */
  function generateCalendarList (weeks) {
    const d = new Date()

    const l = []
    let currentMonth = -1

    for (let i = daysAfterMonday(d); i < 7 * weeks; ++i) {
      if (d.getMonth() !== currentMonth) {
        currentMonth = d.getMonth()
        const fillCount = daysAfterMonday(d)

        l.push({ isMonth: true, label: getDate(d, 'month', 'long'), isInset: fillCount > 1 })
        for (let j = 0; j < fillCount; j++) {
          l.push({ isFiller: true })
        }
      }

      const date = toISODay(d)

      l.push({
        date,
        dom: d.getDate(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        active: event.days[date] != null || toAddList[date] != null,
        disabled: event.days[date] != null && readOnly
      })
      d.setDate(d.getDate() + 1)
    }

    calendarList = l
  }

  /** @param {Date} d */
  function daysAfterMonday (d) {
    return (d.getDay() || 7) - 1
  }

  /** @param {typeof calendarList[0]} d */
  function toggleDay (d) {
    if (!d.date) return
    if (readOnly) {
      if (d.disabled) return
      if (d.active) {
        delete toAddList[d.date]
      } else {
        toAddList[d.date] = defaultTime
      }
    } else if (d.active) {
      delete event.days[d.date]
      event = event
    } else {
      event.days[d.date] = {
        [defaultTime]: {
          votes: {
            [uid]: {
              isFavorite: false,
              isHome: false
            }
          },
          created: Date.now()
        }
      }
    }
    d.active = !d.active
    calendarList = calendarList
  }

  let timeModalVisible = false
  let timeInput = ''

  function showTimeInputModal () {
    timeInput = defaultTime
    timeModalVisible = true
  }

  async function submitTimeInput () {
    if (timeInput.length < 2 || timeInput.length > 10) {
      throw new Error('Only between 2 and 10 characters allowed')
    }

    defaultTime = timeInput
  }

  /** @param {string} time */
  function updateToAddListTime (time) {
    Object.keys(toAddList).forEach(k => { toAddList[k] = time })
  }

  $: updateToAddListTime(defaultTime)
</script>

<span class="-mb-3">Please select avaiable days:</span>
<article class="grid grid-cols-7 gap-2 border rounded p-2">
  {#each calendarList as d}
  {#if d.isMonth}
    <span class="col-span-7 p-1" class:-mb-8={d.isInset}>{d.label}</span>
  {:else if d.isFiller}
    <span></span>
  {:else}
    <button class="rounded p-2" class:text-amber-700={d.isWeekend}
      class:bg-slate-800={!d.active}
      class:bg-neutral-800={d.active && d.disabled}
      class:bg-emerald-800={d.active && !d.disabled}
      on:click={() => toggleDay(d)}>
      {d.dom}
    </button>
  {/if}
  {/each}
  <div class="col-span-7 flex gap-1">
    <button class="flex-grow p-1 rounded border" on:click={() => { displayWeeks += 4 }}>Show more</button>
    <button class="flex-grow p-1 rounded border" on:click={() => showTimeInputModal()}>
      Defaut Time: {defaultTime}
    </button>
  </div>

  <InputModal bind:value={timeInput} bind:visible={timeModalVisible} onConfirm={submitTimeInput}
    label="Change default time" confirmText="Set time" minlength={2} maxlength={12} />
</article>
