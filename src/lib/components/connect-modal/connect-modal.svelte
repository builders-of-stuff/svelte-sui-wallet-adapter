<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import type { WalletAdapter } from '$lib/wallet-adapter/wallet-adapter.type.js';
  import {
    getWalletUniqueIdentifier,
    logWalletAdapterState
  } from '$lib/wallet-adapter/wallet-adapter-tools.js';

  import SuiIcon from '../icons/sui-icon.svelte';
  import WalletListItem from './wallet-list-item.svelte';

  let { walletAdapter } = $props<{
    walletAdapter: WalletAdapter;
  }>();

  let selectedWallet = $state();
  let isDialogOpen = $state(false);

  const resetSelection = () => {
    selectedWallet = undefined;
  };
</script>

<Dialog.Root bind:open={isDialogOpen}>
  <!-- Trigger/button -->
  <Dialog.Trigger><Button>Open</Button></Dialog.Trigger>

  <!-- Modal -->
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Connect</Dialog.Title>

      <Dialog.Description>
        <ul>
          {#if walletAdapter?.wallets?.length > 0}
            {#each walletAdapter.wallets as wallet}
              <WalletListItem
                name={wallet.name}
                icon={wallet.icon}
                isSelected={getWalletUniqueIdentifier(wallet) ===
                  getWalletUniqueIdentifier(selectedWallet as any)}
                onClick={() => {
                  if (
                    getWalletUniqueIdentifier(wallet) !==
                    getWalletUniqueIdentifier(selectedWallet as any)
                  ) {
                    selectedWallet = wallet
                    walletAdapter.connectWallet({
                      wallet
                    })
                    isDialogOpen = false
                  }
                }}
              />
            {/each}
          {:else}
            <WalletListItem name="Sui Wallet" icon={SuiIcon} isSelected />
          {/if}
        </ul>
      </Dialog.Description>
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>
