<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    span = false,
    children
  }: {
    title: string;
    /** Span the full grid width. */
    span?: boolean;
    children: Snippet;
  } = $props();
</script>

<div
  class={`rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 ${
    span ? 'sm:col-span-2 lg:col-span-3' : ''
  }`}
>
  <h3
    class="mb-3 text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
  >
    {title}
  </h3>
  {@render children()}
</div>
