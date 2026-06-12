<script lang="ts">
  import type { WalletAdapter } from '../../wallet-adapter/wallet-adapter.type.js';
  import AccountDropdownMenu from '../account-dropdown-menu/account-dropdown-menu.svelte';
  import ConnectModal from '../connect-modal/connect-modal.svelte';

  let {
    walletAdapter,
    connectText = 'Connect'
  }: {
    walletAdapter: WalletAdapter;
    connectText?: string;
  } = $props();

  // Opens the connect modal from the account dropdown's "Switch wallet" item.
  let switchWalletModalOpen = $state(false);
</script>

{#if walletAdapter.currentAccount}
  <AccountDropdownMenu
    {walletAdapter}
    onSwitchWallet={() => (switchWalletModalOpen = true)}
  />
  <ConnectModal {walletAdapter} bind:open={switchWalletModalOpen} showTrigger={false} />
{:else}
  <ConnectModal {walletAdapter} {connectText} />
{/if}
