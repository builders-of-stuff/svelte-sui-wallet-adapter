<script lang="ts">
  import { formatAddress } from '@mysten/sui/utils';

  import type { WalletAdapter } from '$lib/wallet-adapter/wallet-adapter.type.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

  let { walletAdapter } = $props<{
    walletAdapter: WalletAdapter;
  }>();
</script>

<DropdownMenu.Root>
  <!-- Trigger button -->
  <DropdownMenu.Trigger>
    <Button>
      {walletAdapter?.currentAccount?.label ??
        formatAddress(walletAdapter?.currentAccount?.label)}
    </Button>
  </DropdownMenu.Trigger>

  <!-- Dropdown  -->
  <DropdownMenu.Content>
    <DropdownMenu.Group>
      {#each walletAdapter.accounts as account}
        {@const isActiveAccount =
          account.address && walletAdapter.currentAccount?.address === account.address}

        {#if isActiveAccount}
          <DropdownMenu.Label
            onclick={() => {
              walletAdapter.switchAccount(account);
            }}
          >
            {account.label ?? formatAddress(account.address)}
          </DropdownMenu.Label>
        {:else}
          <DropdownMenu.Item
            onclick={() => {
              walletAdapter.switchAccount(account);
            }}
          >
            {account.label ?? formatAddress(account.address)}
          </DropdownMenu.Item>
        {/if}
      {/each}

      <DropdownMenu.Separator />
      <DropdownMenu.Item
        onclick={() => {
          walletAdapter.disconnectWallet();
        }}>Disconnect</DropdownMenu.Item
      >
    </DropdownMenu.Group>
  </DropdownMenu.Content>
</DropdownMenu.Root>
