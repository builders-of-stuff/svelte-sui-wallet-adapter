<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  let {
    variant = 'primary',
    children,
    ...restProps
  }: {
    variant?: 'primary' | 'secondary' | 'ghost';
    children: Snippet;
  } & HTMLButtonAttributes = $props();
</script>

<button type="button" class={`sswa-button sswa-button--${variant}`} {...restProps}>
  {@render children()}
</button>

<style>
  .sswa-button {
    color-scheme: light dark;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--sswa-radius, 0.75rem);
    font-family: var(--sswa-font-sans, inherit);
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.25rem;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      opacity 0.15s ease;
    white-space: nowrap;
  }

  .sswa-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .sswa-button:focus-visible {
    outline: 2px solid var(--sswa-ring, #4da2ff);
    outline-offset: 2px;
  }

  .sswa-button--primary {
    background: var(--sswa-primary, #4da2ff);
    color: var(--sswa-primary-foreground, #ffffff);
  }

  .sswa-button--primary:hover:not(:disabled) {
    background: color-mix(in srgb, var(--sswa-primary, #4da2ff) 88%, black);
  }

  .sswa-button--secondary {
    background: var(--sswa-secondary, light-dark(#f4f4f5, #27272a));
    color: var(--sswa-secondary-foreground, light-dark(#18181b, #f4f4f5));
  }

  .sswa-button--secondary:hover:not(:disabled) {
    background: color-mix(
      in srgb,
      var(--sswa-secondary, light-dark(#f4f4f5, #27272a)) 85%,
      light-dark(black, white)
    );
  }

  .sswa-button--ghost {
    background: transparent;
    color: var(--sswa-foreground, light-dark(#18181b, #f4f4f5));
  }

  .sswa-button--ghost:hover:not(:disabled) {
    background: var(--sswa-muted, light-dark(#f4f4f5, #27272a));
  }
</style>
