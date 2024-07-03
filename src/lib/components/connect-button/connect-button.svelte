<script lang="ts">
  import type { WalletAdapter } from '$lib/wallet-adapter/wallet-adapter.type.js';
  import AccountDropdownMenu from '$lib/components/account-dropdown-menu/account-dropdown-menu.svelte';
  import ConnectModal from '$lib/components/connect-modal/connect-modal.svelte';

  let { walletAdapter } = $props<{
    walletAdapter: WalletAdapter;
  }>();
</script>

{#if !!walletAdapter.currentAccount}
  <AccountDropdownMenu {walletAdapter} />
{:else}
  <ConnectModal {walletAdapter} />
{/if}
