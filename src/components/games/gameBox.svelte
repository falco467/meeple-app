<script>
  import { scale } from 'svelte/transition'
  import { addVote, removeVote } from '../../js/firedb.js'
  import { userList } from '../../js/userStore.js'
  import Icon from '../icon.svelte'

  /** @type {string} */
  export let uid
  /** @type {import('../../js/firedb.js').Game} */
  export let game

  export let preview = false

  /** @param {import('../../js/firedb.js').Game} game */
  function hasMyVote (game) {
    return Object.keys(game.votes).includes(uid)
  }

  /** @param {import('../../js/firedb.js').Game} game */
  function toggleVote (game) {
    if (hasMyVote(game)) {
      removeVote(game.gid, uid)
    } else {
      addVote(game.gid, uid)
    }
  }
</script>

<article class="flex gap-2 bg-slate-800 rounded p-2">
  <a class="flex w-20 rounded overflow-hidden flex-shrink-0 self-start"
    href={`https://boardgamegeek.com/boardgame/${game.gid}`} target="_blank" rel="noreferrer">
    <img alt="cover" src={game.pic}>
  </a>

  <section class="flex flex-col gap-1 flex-grow min-w-0">
    <h2 class="overflow-hidden text-ellipsis whitespace-nowrap">{game.name}</h2>

    <ul class="flex gap-2 flex-wrap text-xs">
      {#each Object.keys(game.votes) as voteUid (voteUid)}
      <li class="flex gap-1 items-center bg-sky-800 rounded-full p-1 px-2"
        transition:scale|local>
        <span class="mb-[0.1em]">{$userList?.[voteUid]?.name || '***'}</span>
      </li>
      {/each}
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
      <button on:click={() => toggleVote(game)}>
        <Icon i="thumbs-up" class="!w-8 !h-8" stroke={1.5}
          fill={hasMyVote(game) ? 'rgb(100, 116, 139)' : 'none'}/>
      </button>
    {/if}
  </section>
</article>
