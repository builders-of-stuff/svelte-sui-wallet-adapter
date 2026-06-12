<script lang="ts">
  let {
    code,
    copyable = false,
    scrollable = false
  }: {
    code: string;
    copyable?: boolean;
    scrollable?: boolean;
  } = $props();

  let copied = $state(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }
</script>

<div
  class="relative rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
>
  {#if copyable}
    <button
      type="button"
      onclick={copy}
      class="absolute top-2 right-2 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-500 transition hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  {/if}

  <pre
    class={`overflow-x-auto p-4 font-mono text-xs leading-relaxed whitespace-pre text-zinc-800 dark:text-zinc-200 ${
      scrollable ? 'max-h-96 overflow-y-auto' : ''
    } ${copyable ? 'pr-16' : ''}`}>{code}</pre>
</div>
