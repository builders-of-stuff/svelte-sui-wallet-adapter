<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
  import type { WalletAdapter } from '$lib/wallet-adapter/wallet-adapter.type.js';
  import { getWalletUniqueIdentifier } from '$lib/wallet-adapter/wallet-adapter-tools.js';

  import SuiIcon from '../icons/sui-icon.svelte';
  import WalletListItem from './wallet-list-item.svelte';

  let { walletAdapter } = $props<{
    walletAdapter: WalletAdapter;
  }>();

  let selectedWallet = $state() as any;
  let isDialogOpen = $state(false);
</script>

<Dialog.Root bind:open={isDialogOpen}>
  <!-- Trigger/button -->
  <Dialog.Trigger><Button>Open</Button></Dialog.Trigger>

  <!-- Modal -->
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Connect</Dialog.Title>
    </Dialog.Header>

    <Dialog.Description>
      {#if walletAdapter?.wallets?.length > 0}
        <RadioGroup.Root value="" class="grid grid-cols-3 gap-4">
          {#each walletAdapter.wallets as wallet}
            <WalletListItem
              name={wallet.name}
              icon={wallet.icon}
              isSelected={getWalletUniqueIdentifier(wallet) ===
                getWalletUniqueIdentifier(selectedWallet)}
              onClick={() => {
                if (
                  getWalletUniqueIdentifier(wallet) !==
                  getWalletUniqueIdentifier(selectedWallet)
                ) {
                  selectedWallet = wallet;
                  walletAdapter.connectWallet({
                    wallet
                  });
                  isDialogOpen = false;
                }
              }}
            />
          {/each}
        </RadioGroup.Root>
      {:else}
        <WalletListItem name="Sui Wallet" icon={SuiIcon} isSelected />
      {/if}
    </Dialog.Description>
  </Dialog.Content>
</Dialog.Root>
