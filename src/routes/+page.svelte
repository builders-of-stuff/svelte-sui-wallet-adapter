<script lang="ts">
  import { onMount } from 'svelte';
  import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
  import type {
    Wallet,
    WalletAccount,
    WalletWithRequiredFeatures,
    WalletWithFeatures,
    MinimallyRequiredFeatures
  } from '@mysten/wallet-standard';
  import { getWallets, isWalletWithRequiredFeatureSet } from '@mysten/wallet-standard';
  import { getRegisteredWallets, walletStore } from '$lib/index.js';

  // import { getFaucetHost, requestSuiFromFaucetV0 } from '@mysten/sui.js/faucet';
  // import { MIST_PER_SUI } from '@mysten/sui.js/utils';

  const MY_ADDRESS =
    '0xe8468f320cf248052e931b3d0214e3f48049e86e28882b58579406cca7a51e86';

  /**
   * SuiClientProvider
   */
  const rpcUrl = getFullnodeUrl('devnet');
  const suiClient = new SuiClient({ url: rpcUrl });

  /**
   * WalletProvider stuff (dapp-kit)
   */
  /**
   * getRegisteredWallets
   */
  const suiWallets = getRegisteredWallets();

  // suiWallets.forEach((wallet) => {
  //   console.log('wallet: ', wallet.name);
  // });

  /**
   * walletStore.ts
   */

  // console.log('walletStore: ', walletStore);

  walletStore.connectWallet();

  /**
   * Playground
   */
  const makeSuiCall = async () => {
    let balance = await suiClient.getCoins({
      owner: MY_ADDRESS
    });

    return balance;
  };

  onMount(async () => {
    let response = (await makeSuiCall()) as any;

    // console.log('response: ', response);
  });
</script>

<h1>Welcome to SvelteKit</h1>
