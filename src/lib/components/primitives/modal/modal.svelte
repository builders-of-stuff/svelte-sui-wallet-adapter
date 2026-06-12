<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    open = $bindable(false),
    children
  }: {
    open?: boolean;
    children: Snippet;
  } = $props();

  let dialogElement = $state(null as HTMLDialogElement | null);

  $effect(() => {
    if (!dialogElement) return;

    if (open && !dialogElement.open) {
      dialogElement.showModal();
    } else if (!open && dialogElement.open) {
      dialogElement.close();
    }
  });

  // A click on the dialog element itself (not its content) is a backdrop click.
  function handleClick(event: MouseEvent) {
    if (event.target === dialogElement) {
      open = false;
    }
  }
</script>

<dialog
  bind:this={dialogElement}
  class="sswa-modal"
  onclose={() => (open = false)}
  onclick={handleClick}
>
  {#if open}
    <div class="sswa-modal__content">
      <button
        type="button"
        class="sswa-modal__close"
        aria-label="Close"
        onclick={() => (open = false)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {@render children()}
    </div>
  {/if}
</dialog>

<style>
  .sswa-modal {
    color-scheme: light dark;
    /* Explicit centering: CSS resets (e.g. Tailwind preflight) zero out the
       user-agent's `margin: auto` on <dialog>, pinning it to the top-left. */
    margin: auto;
    padding: 0;
    border: 1px solid var(--sswa-border, light-dark(#e4e4e7, #2e2e33));
    border-radius: calc(var(--sswa-radius, 0.75rem) * 1.25);
    background: var(--sswa-background, light-dark(#ffffff, #1c1c1f));
    color: var(--sswa-foreground, light-dark(#18181b, #f4f4f5));
    font-family: var(--sswa-font-sans, inherit);
    width: 100%;
    max-width: 24rem;
    box-shadow:
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1);
  }

  .sswa-modal::backdrop {
    background: var(--sswa-overlay, rgb(24 24 27 / 0.4));
  }

  .sswa-modal[open] {
    animation: sswa-modal-in 0.15s ease-out;
  }

  @keyframes sswa-modal-in {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .sswa-modal__content {
    position: relative;
    padding: 1.5rem;
  }

  .sswa-modal__close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: none;
    border-radius: 9999px;
    background: transparent;
    color: var(--sswa-muted-foreground, light-dark(#71717a, #a1a1aa));
    cursor: pointer;
  }

  .sswa-modal__close:hover {
    background: var(--sswa-muted, light-dark(#f4f4f5, #27272a));
    color: var(--sswa-foreground, light-dark(#18181b, #f4f4f5));
  }

  .sswa-modal__close:focus-visible {
    outline: 2px solid var(--sswa-ring, #4da2ff);
    outline-offset: 2px;
  }
</style>
