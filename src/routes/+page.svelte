<script lang="ts">
  import {  logWalletAdapterState, walletAdapter } from '$lib/index.js';

  /**
   * WalletProvider stuff (dapp-kit)
   */
  /**
   * Playground
   */
  const handleConnectWallet = async () => {
     await walletAdapter.connectWallet();
  };

  const handleDisconnectWallet = async () => {
    await walletAdapter.disconnectWallet();
  };

  const handleWallets = () => {
    let Wallets = walletAdapter.wallets;
    console.log('Wallets: ', Wallets);
  };
  const handleAccounts = () => {
    let Accounts = walletAdapter.accounts;
    console.log('Accounts: ', Accounts);
  };
  const handleCurrentWallet = () => {
    let CurrentWallet = walletAdapter.currentWallet;
    console.log('CurrentWallet: ', CurrentWallet);
  };
  const handleCurrentAccount = () => {
    let CurrentAccount = walletAdapter.currentAccount;
    console.log('CurrentAccount: ', CurrentAccount);
  };
  const handleLastConnectedAccountAddress = () => {
    let LastConnectedAccountAddress = walletAdapter.lastConnectedAccountAddress;
    console.log('LastConnectedAccountAddress: ', LastConnectedAccountAddress);
  };
  const handleLastConnectedWalletName = () => {
    let LastConnectedWalletName = walletAdapter.lastConnectedWalletName;
    console.log('LastConnectedWalletName: ', LastConnectedWalletName);
  };
  const handleConnectionStatus = () => {
    let ConnectionStatus = walletAdapter.connectionStatus;
    console.log('ConnectionStatus: ', ConnectionStatus);
  };
  const handleIsConnected = () => {
    let IsConnected = walletAdapter.isConnected;
    console.log('IsConnected: ', IsConnected);
  };
  const handleIsConnecting = () => {
    let IsConnecting = walletAdapter.isConnecting;
    console.log('IsConnecting: ', IsConnecting);
  };
  const handleIsDisconnected = () => {
    let IsDisconnected = walletAdapter.isDisconnected;
    console.log('IsDisconnected: ', IsDisconnected);
  };

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

<a href="/two">Page two</a>
<a href="/three">Page three</a>
<a href="/four">Page four</a>

<br />
<br />

<button on:click={handleConnectWallet}>Connect Wallet</button>
<button on:click={handleDisconnectWallet}>Disconnect Wallet</button>
<button on:click={() => logWalletAdapterState(walletAdapter)}>Log adapter state</button>

<br />
<br />

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
  <h2>Current wallet</h2>
  {@render walletDisplay(walletAdapter.currentWallet)}
</div>

<div>
  <h2>Current account</h2>
  {@render accountDisplay(walletAdapter.currentAccount)}
</div>

<h2>Misc. state</h2>
<p>Last Connected Account Address: {walletAdapter.lastConnectedAccountAddress}</p>
<p>Last Connected Wallet Name: {walletAdapter.lastConnectedWalletName}</p>
<p>Connection Status: {walletAdapter.connectionStatus}</p>
<p>Is Connected: {walletAdapter.isConnected}</p>
<p>Is Connecting: {walletAdapter.isConnecting}</p>
<p>Is Disconnected: {walletAdapter.isDisconnected}</p>

<div>
  <h2>Wallets</h2>
  {#each walletAdapter.wallets as wallet}
    {@render walletDisplay(wallet)}
    <hr />
  {/each}
</div>

<div>
  <h2>Accounts</h2>
  {#each walletAdapter.accounts as account}
    {@render accountDisplay(account)}
    <hr />
  {/each}
</div>
