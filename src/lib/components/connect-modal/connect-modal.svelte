<script lang="ts">
  import {
    isWalletStandardError,
    WALLET_STANDARD_ERROR__USER__REQUEST_REJECTED,
    type WalletWithRequiredFeatures
  } from '@mysten/wallet-standard';

  import type { WalletAdapter } from '../../wallet-adapter/wallet-adapter.type.js';
  import Modal from '../primitives/modal/modal.svelte';
  import BaseButton from '../primitives/base-button/base-button.svelte';
  import WalletListItem from './wallet-list-item.svelte';
  import { KNOWN_WALLETS } from './wallet-registry.js';

  type View = 'wallet-selection' | 'connecting' | 'error' | 'what-is-a-wallet';

  let {
    walletAdapter,
    open = $bindable(false),
    showTrigger = true,
    connectText = 'Connect'
  }: {
    walletAdapter: WalletAdapter;
    open?: boolean;
    /** Render the built-in trigger button. Set false when opening the modal externally. */
    showTrigger?: boolean;
    connectText?: string;
  } = $props();

  let view = $state('wallet-selection' as View);
  let selectedWallet = $state(null as WalletWithRequiredFeatures | null);
  let connectionError = $state(null as unknown);

  // Bumped on every connect attempt and modal close so stale promises are ignored.
  let attemptId = 0;

  const undetectedWallets = $derived(
    KNOWN_WALLETS.filter(
      (known) => !walletAdapter.wallets.some((wallet) => wallet.name === known.name)
    )
  );

  const isUserRejection = $derived(
    isWalletStandardError(
      connectionError,
      WALLET_STANDARD_ERROR__USER__REQUEST_REJECTED
    )
  );

  function resetView() {
    attemptId += 1;
    view = 'wallet-selection';
    selectedWallet = null;
    connectionError = null;
  }

  $effect(() => {
    if (!open) {
      resetView();
    }
  });

  async function connectToWallet(wallet: WalletWithRequiredFeatures) {
    selectedWallet = wallet;
    connectionError = null;

    const id = ++attemptId;

    // Avoid flashing the connecting view for wallets that resolve instantly.
    const connectingTimer = setTimeout(() => {
      if (id === attemptId) {
        view = 'connecting';
      }
    }, 100);

    try {
      await walletAdapter.connectWallet({ wallet });

      if (id === attemptId) {
        open = false;
      }
    } catch (error) {
      if (id === attemptId) {
        connectionError = error;
        view = 'error';
      }
    } finally {
      clearTimeout(connectingTimer);
    }
  }
</script>

{#if showTrigger}
  <BaseButton onclick={() => (open = true)}>{connectText}</BaseButton>
{/if}

<Modal bind:open>
  {#if view === 'wallet-selection'}
    <div class="sswa-connect__header">Connect a wallet</div>

    <div class="sswa-connect__list">
      {#each walletAdapter.wallets as wallet (wallet.name)}
        <WalletListItem
          name={wallet.name}
          icon={wallet.icon}
          onclick={() => connectToWallet(wallet)}
        />
      {/each}

      {#if walletAdapter.wallets.length && undetectedWallets.length}
        <div class="sswa-connect__divider"></div>
      {/if}

      {#each undetectedWallets as wallet (wallet.name)}
        <WalletListItem
          name={wallet.name}
          icon={wallet.icon}
          installUrl={wallet.installUrl}
        />
      {/each}
    </div>

    <button
      type="button"
      class="sswa-connect__info-link"
      onclick={() => (view = 'what-is-a-wallet')}
    >
      What is a wallet?
    </button>
  {:else if view === 'connecting'}
    <div class="sswa-connect__status">
      {#if selectedWallet?.icon}
        <img
          src={selectedWallet.icon}
          alt={`${selectedWallet.name} logo`}
          class="sswa-connect__status-icon"
        />
      {/if}

      <div class="sswa-connect__header">Awaiting connection...</div>
      <p class="sswa-connect__text">
        Accept the connection request from {selectedWallet?.name ?? 'your wallet'} to continue.
      </p>

      <BaseButton variant="secondary" onclick={resetView}>Cancel</BaseButton>
    </div>
  {:else if view === 'error'}
    <div class="sswa-connect__status">
      <div class="sswa-connect__header">
        {isUserRejection ? 'Request canceled' : 'Connection failed'}
      </div>
      <p class="sswa-connect__text">
        {#if isUserRejection}
          You canceled the connection request in {selectedWallet?.name ??
            'your wallet'}.
        {:else}
          Could not connect to {selectedWallet?.name ?? 'your wallet'}. Make sure the
          wallet is unlocked and try again.
        {/if}
      </p>

      <div class="sswa-connect__actions">
        <BaseButton variant="secondary" onclick={resetView}>Back</BaseButton>
        {#if selectedWallet}
          {@const retryWallet = selectedWallet}
          <BaseButton onclick={() => connectToWallet(retryWallet)}>Retry</BaseButton>
        {/if}
      </div>
    </div>
  {:else if view === 'what-is-a-wallet'}
    <div class="sswa-connect__header">What is a wallet?</div>

    <div class="sswa-connect__info">
      <p class="sswa-connect__text">
        A wallet stores your digital assets and acts as your login for Sui applications.
        Connecting a wallet lets this app see your address — it cannot move your assets
        without your approval.
      </p>
      <p class="sswa-connect__text">
        You approve every transaction from your wallet, so you stay in control at all
        times.
      </p>
      <a
        class="sswa-connect__external-link"
        href="https://sui.io/get-started"
        target="_blank"
        rel="noopener noreferrer"
      >
        Get started on Sui
      </a>
    </div>

    <div class="sswa-connect__actions">
      <BaseButton variant="secondary" onclick={resetView}>Back</BaseButton>
    </div>
  {/if}
</Modal>

<style>
  .sswa-connect__header {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    padding-right: 2rem;
  }

  .sswa-connect__list {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .sswa-connect__divider {
    height: 1px;
    margin: 0.375rem 0.5rem;
    background: var(--sswa-border, light-dark(#e4e4e7, #2e2e33));
  }

  .sswa-connect__info-link {
    display: block;
    margin: 1rem auto 0;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--sswa-muted-foreground, light-dark(#71717a, #a1a1aa));
    font-family: inherit;
    font-size: 0.75rem;
    cursor: pointer;
  }

  .sswa-connect__info-link:hover {
    color: var(--sswa-foreground, light-dark(#18181b, #f4f4f5));
    text-decoration: underline;
  }

  .sswa-connect__status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    text-align: center;
    padding: 0.5rem 0;
  }

  .sswa-connect__status .sswa-connect__header {
    margin-bottom: 0;
    padding-right: 0;
  }

  .sswa-connect__status-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    object-fit: cover;
  }

  .sswa-connect__text {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.4;
    color: var(--sswa-muted-foreground, light-dark(#71717a, #a1a1aa));
  }

  .sswa-connect__info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .sswa-connect__actions {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .sswa-connect__external-link {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--sswa-primary, #4da2ff);
    text-decoration: none;
  }

  .sswa-connect__external-link:hover {
    text-decoration: underline;
  }
</style>
