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

  // walletStore.connectWallet();

  /**
   * Playground
   */
  const handleConnectWallet = async () => {
    await walletStore.connectWallet();
  };

  const handleWallets = () => {
    let Wallets = walletStore.wallets;
    console.log('Wallets: ', Wallets);
  };
  const handleAccounts = () => {
    let Accounts = walletStore.accounts;
    console.log('Accounts: ', Accounts);
  };
  const handleCurrentWallet = () => {
    let CurrentWallet = walletStore.currentWallet;
    console.log('CurrentWallet: ', CurrentWallet);
  };
  const handleCurrentAccount = () => {
    let CurrentAccount = walletStore.currentAccount;
    console.log('CurrentAccount: ', CurrentAccount);
  };
  const handleLastConnectedAccountAddress = () => {
    let LastConnectedAccountAddress = walletStore.lastConnectedAccountAddress;
    console.log('LastConnectedAccountAddress: ', LastConnectedAccountAddress);
  };
  const handleLastConnectedWalletName = () => {
    let LastConnectedWalletName = walletStore.lastConnectedWalletName;
    console.log('LastConnectedWalletName: ', LastConnectedWalletName);
  };
  const handleConnectionStatus = () => {
    let ConnectionStatus = walletStore.connectionStatus;
    console.log('ConnectionStatus: ', ConnectionStatus);
  };
  const handleIsConnected = () => {
    let IsConnected = walletStore.isConnected;
    console.log('IsConnected: ', IsConnected);
  };
  const handleIsConnecting = () => {
    let IsConnecting = walletStore.isConnecting;
    console.log('IsConnecting: ', IsConnecting);
  };
  const handleIsDisconnected = () => {
    let IsDisconnected = walletStore.isDisconnected;
    console.log('IsDisconnected: ', IsDisconnected);
  };

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

{#snippet walletDisplay(wallet)}
  {#if !wallet}
    <p>No wallet</p>
  {:else}
    <div>
      <!-- <p>Wallet: {wallet}</p> -->
      <p>Name: {wallet?.name}</p>
      <p>Chains: {wallet?.chains}</p>
      <p>Version: {wallet?.version}</p>
      <!-- <p>Features: {wallet?.features}</p> -->
      <!-- <p>Accounts: {wallet.accounts}</p> -->
    </div>
  {/if}
{/snippet}

<!-- Just trying out snippets -->
{#snippet accountDisplay(account)}
  {#if !account}
    <p>No account</p>
  {:else}
    <div>
      <!-- <p>Account: {account}</p> -->
      <p>Address: {account.address}</p>
      <p>Public key: {account.publicKey}</p>
      <p>Label: {account.label}</p>
      <p>Features: {account.features}</p>
      <p>Chains: {account.chains}</p>
    </div>
  {/if}
{/snippet}

<h1>Actions (console logged)</h1>
<button on:click={handleConnectWallet}>Connect Wallet</button>
<button on:click={handleWallets}>Wallets</button>
<button on:click={handleAccounts}>Accounts</button>
<button on:click={handleCurrentWallet}>Current Wallet</button>
<button on:click={handleCurrentAccount}>Current Account</button>
<button on:click={handleLastConnectedAccountAddress}
  >Last Connected Account Address</button
>
<button on:click={handleLastConnectedWalletName}>Last Connected Wallet Name</button>
<button on:click={handleConnectionStatus}>Connection Status</button>
<button on:click={handleIsConnected}>Is Connected</button>
<button on:click={handleIsConnecting}>Is Connecting</button>
<button on:click={handleIsDisconnected}>Is Disconnected</button>

<div>
  <h2>Wallets</h2>
  {#each walletStore.wallets as wallet}
    {@render walletDisplay(wallet)}
    <hr />
  {/each}
</div>

<div>
  <h2>Current wallet</h2>
  {@render walletDisplay(walletStore.currentWallet)}
</div>

<div>
  <h2>Accounts</h2>
  {#each walletStore.accounts as account}
    {@render accountDisplay(account)}
    <hr />
  {/each}
</div>

<div>
  <h2>Current account</h2>
  {@render accountDisplay(walletStore.currentAccount)}
</div>

<h2>Misc. state</h2>
<p>Last Connected Account Address: {walletStore.lastConnectedAccountAddress}</p>
<p>Last Connected Wallet Name: {walletStore.lastConnectedWalletName}</p>
<p>Connection Status: {walletStore.connectionStatus}</p>
<p>Is Connected: {walletStore.isConnected}</p>
<p>Is Connecting: {walletStore.isConnecting}</p>
<p>Is Disconnected: {walletStore.isDisconnected}</p>
