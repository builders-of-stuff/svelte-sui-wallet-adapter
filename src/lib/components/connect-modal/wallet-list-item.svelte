<script lang="ts">
  let {
    name,
    icon,
    installUrl,
    onclick
  }: {
    name: string;
    icon?: string;
    /** When set, renders an external install link instead of a connect button. */
    installUrl?: string;
    onclick?: () => void;
  } = $props();
</script>

{#snippet itemContent()}
  {#if icon}
    <img src={icon} alt={`${name} logo`} class="sswa-wallet-item__icon" />
  {:else}
    <div class="sswa-wallet-item__icon sswa-wallet-item__icon--placeholder">
      {name.charAt(0)}
    </div>
  {/if}

  <span class="sswa-wallet-item__name">{name}</span>
{/snippet}

{#if installUrl}
  <a
    class="sswa-wallet-item"
    href={installUrl}
    target="_blank"
    rel="noopener noreferrer"
  >
    {@render itemContent()}
    <span class="sswa-wallet-item__install">
      Install
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M7 17 17 7M7 7h10v10" />
      </svg>
    </span>
  </a>
{:else}
  <button type="button" class="sswa-wallet-item" {onclick}>
    {@render itemContent()}
  </button>
{/if}

<style>
  .sswa-wallet-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.5rem;
    border: none;
    border-radius: var(--sswa-radius, 0.75rem);
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }

  .sswa-wallet-item:hover {
    background: var(--sswa-muted, light-dark(#f4f4f5, #27272a));
  }

  .sswa-wallet-item:focus-visible {
    outline: 2px solid var(--sswa-ring, #4da2ff);
    outline-offset: -2px;
  }

  .sswa-wallet-item__icon {
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    object-fit: cover;
    flex-shrink: 0;
  }

  .sswa-wallet-item__icon--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--sswa-muted, light-dark(#f4f4f5, #27272a));
    color: var(--sswa-muted-foreground, light-dark(#71717a, #a1a1aa));
    font-weight: 600;
  }

  .sswa-wallet-item__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sswa-wallet-item__install {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--sswa-muted-foreground, light-dark(#71717a, #a1a1aa));
  }
</style>
