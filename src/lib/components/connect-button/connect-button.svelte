<script lang="ts">
  import type { WalletAdapter } from '$lib/wallet-adapter/wallet-adapter.type.js';
  import AccountDropdownMenu from '../account-dropdown-menu/account-dropdown-menu.svelte';
  import ConnectModal from '../connect-modal/connect-modal.svelte';

  let {
    connectText = 'Connect wallet',
    walletAdapter,
    extraClasses,
    overrideClasses
  } = $props<{
    connectText?: string;
    walletAdapter: WalletAdapter;
    extraClasses?: string;
    overrideClasses?: string;
  }>();
</script>

{#if !!walletAdapter.currentAccount}
  <AccountDropdownMenu {walletAdapter} />
{:else}
  <ConnectModal {walletAdapter} />
{/if}
