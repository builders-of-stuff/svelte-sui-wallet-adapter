<script>
  import '../app.css';

  let { children } = $props();
</script>

<svelte:head>
  <title>Svelte Sui Wallet Adapter</title>
  <meta
    name="description"
    content="A Sui wallet adapter for Svelte 5 — zero UI dependencies, scoped styles, runes-reactive state."
  />
</svelte:head>

<div
  class="min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100"
>
  {@render children()}
</div>
