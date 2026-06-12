<script lang="ts">
  import { formatAddress } from '@mysten/sui/utils';

  import type { WalletAdapter } from '../../wallet-adapter/wallet-adapter.type.js';
  import Dropdown from '../primitives/dropdown/dropdown.svelte';
  import BaseButton from '../primitives/base-button/base-button.svelte';

  let {
    walletAdapter,
    onSwitchWallet
  }: {
    walletAdapter: WalletAdapter;
    /** When provided, shows a "Switch wallet" item that calls this (e.g. to open the connect modal). */
    onSwitchWallet?: () => void;
  } = $props();

  let open = $state(false);
  let copied = $state(false);

  async function copyAddress() {
    const address = walletAdapter.currentAccount?.address;
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch (error) {
      console.error('Failed to copy address to clipboard:', error);
    }
  }
</script>

<Dropdown bind:open>
  {#snippet trigger()}
    <BaseButton variant="secondary" onclick={() => (open = !open)}>
      {walletAdapter.currentAccount?.label ??
        formatAddress(walletAdapter.currentAccount?.address ?? '')}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class={open
          ? 'sswa-account__chevron sswa-account__chevron--open'
          : 'sswa-account__chevron'}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </BaseButton>
  {/snippet}

  {#if walletAdapter.accounts.length > 1}
    <div class="sswa-account__group-label">Accounts</div>
    {#each walletAdapter.accounts as account (account.address)}
      {@const isActiveAccount =
        walletAdapter.currentAccount?.address === account.address}

      <button
        type="button"
        class="sswa-account__item"
        role="menuitem"
        onclick={() => {
          walletAdapter.switchAccount(account);
          open = false;
        }}
      >
        <span class="sswa-account__item-label">
          {account.label ?? formatAddress(account.address)}
        </span>
        {#if isActiveAccount}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        {/if}
      </button>
    {/each}

    <div class="sswa-account__separator"></div>
  {/if}

  <button
    type="button"
    class="sswa-account__item"
    role="menuitem"
    onclick={copyAddress}
  >
    <span class="sswa-account__item-label">
      {copied ? 'Copied' : 'Copy address'}
    </span>
    {#if copied}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    {:else}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </svg>
    {/if}
  </button>

  {#if onSwitchWallet}
    <button
      type="button"
      class="sswa-account__item"
      role="menuitem"
      onclick={() => {
        open = false;
        onSwitchWallet();
      }}
    >
      <span class="sswa-account__item-label">Switch wallet</span>
    </button>
  {/if}

  <div class="sswa-account__separator"></div>

  <button
    type="button"
    class="sswa-account__item"
    role="menuitem"
    onclick={() => {
      open = false;
      walletAdapter.disconnectWallet();
    }}
  >
    <span class="sswa-account__item-label">Disconnect</span>
  </button>
</Dropdown>

<style>
  .sswa-account__chevron {
    transition: transform 0.15s ease;
  }

  .sswa-account__chevron--open {
    transform: rotate(180deg);
  }

  .sswa-account__group-label {
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--sswa-muted-foreground, light-dark(#71717a, #a1a1aa));
  }

  .sswa-account__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
    padding: 0.5rem;
    border: none;
    border-radius: calc(var(--sswa-radius, 0.75rem) - 0.25rem);
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
  }

  .sswa-account__item:hover,
  .sswa-account__item:focus-visible {
    background: var(--sswa-muted, light-dark(#f4f4f5, #27272a));
    outline: none;
  }

  .sswa-account__item-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sswa-account__separator {
    height: 1px;
    margin: 0.25rem 0.5rem;
    background: var(--sswa-border, light-dark(#e4e4e7, #2e2e33));
  }
</style>
