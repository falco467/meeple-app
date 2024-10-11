<script>
  import { createEventDispatcher } from 'svelte'
  import { addStar, addVote, removeStar, removeVote, uid } from '../../js/firedb.js'
  import { getErrorMessage } from '../../js/helpers.js'
  import { userList } from '../../js/userStore.js'
  import { myStarCount } from '../../js/gameListStore.js'
  import Icon from '../icon.svelte'

  /** @typedef {import('../../js/firedb.js').Game} Game */

  /** @type {Game} */
  export let game
  export let preview = false

  let errText = ''

  const dispatch = createEventDispatcher()

  /** @param {Game} game */
  function hasMyVote (game) {
    return Object.keys(game.votes).includes(uid)
  }

  /** @param {Game} game */
  function isStarred (game) {
    return Object.keys(game.stars).includes(uid)
  }

  /** @param {Game} game */
  async function tryToggleVote (game) {
    try {
      if (hasMyVote(game)) {
        if (isStarred(game)) {
          await removeStar(game.gid, uid)
        }
        await removeVote(game.gid, uid)
      }
      else {
        await addVote(game.gid, uid)
      }
    }
    catch (err) {
      errText = getErrorMessage(err)
    }
  }

  /** @param {Game} game */
  async function tryToggleStar (game) {
    try {
      if (isStarred(game)) {
        await removeStar(game.gid, uid)
      }
      else {
        if ($myStarCount >= 3) {
          throw new Error('You can only star 3 games')
        }
        if (!hasMyVote(game)) {
          await addVote(game.gid, uid)
        }
        await addStar(game.gid, uid)
      }
    }
    catch (err) {
      errText = getErrorMessage(err)
    }
  }
</script>

<article class="flex gap-2 bg-slate-800 rounded p-2 outline-amber-900"
  class:outline={Object.keys(game.stars).length > 0}>
  <button class="flex w-20 rounded overflow-hidden flex-shrink-0 self-start"
    on:click|stopPropagation={() => dispatch('open')}>
    {#if game.pic}
      <img alt="cover" src={game.pic}>
    {:else}
      <div class="w-20 h-20 bg-slate-900 animate-pulse"></div>
    {/if}
  </button>

  <section class="flex flex-col gap-1 flex-grow min-w-0">
    <h2 class="overflow-hidden text-ellipsis whitespace-nowrap">{game.name}</h2>

    {#if errText}<span class="text-red-500">{errText}</span>{/if}

    <ul class="flex gap-2 flex-wrap text-xs items-start">
      {#each Object.keys({ ...game.owners, ...game.votes }) as uid (uid)}
      <li class="flex gap-1 items-center rounded-full p-1 px-2"
        class:bg-sky-800={game.votes[uid] && !game.stars[uid]}
        class:bg-amber-900={game.stars[uid]}
        class:bg-neutral-700={!game.votes[uid]}>
        <span class="mb-[0.1rem]">{$userList?.[uid]?.name || '***'}</span>
        {#if game.owners?.[uid]}
          <Icon i="cube" title="owner" class="!h-3 !w-3"/>
        {/if}
      </li>
      {/each}
      {#if !preview}
      <div class="flex grow">
        <span class="grow"></span>
        <button on:click={async () => { await tryToggleStar(game) }}>
          <Icon i="star" class="!w-8 !h-8 justify-self-end" stroke={1.5}
            fill={isStarred(game) ? 'rgb(100, 116, 139)' : 'none'}/>
        </button>
      </div>
      {/if}
    </ul>
  </section>

  <section class="flex flex-col items-end gap-1">
    <div class="flex items-center gap-1">
      <Icon i="chart-sqare-bar" class="!w-5 !h-5"></Icon>
      <span>{game.rating}</span>
    </div>
    <di class="flex items-center gap-1 whitespace-nowrap -mt-1">
      <Icon i="user" class="!w-5 !h-5"></Icon>
      <span>{game.recPlayers}</span>
    </di>
    <div class="flex-grow"></div>
    {#if !preview}
      <button on:click={async () => { await tryToggleVote(game) }}>
        <Icon i="thumbs-up" class="!w-8 !h-8" stroke={1.5}
          fill={hasMyVote(game) ? 'rgb(100, 116, 139)' : 'none'}/>
      </button>
    {/if}
  </section>
</article>
