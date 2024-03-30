<script lang="ts">
  import { getRegisteredWallets, walletStore } from '$lib/index.js';
</script>

<a href="/">Home</a>

<h2>Misc. state</h2>
<p>Last Connected Account Address: {walletStore.lastConnectedAccountAddress}</p>
<p>Last Connected Wallet Name: {walletStore.lastConnectedWalletName}</p>
<p>Connection Status: {walletStore.connectionStatus}</p>
<p>Is Connected: {walletStore.isConnected}</p>
<p>Is Connecting: {walletStore.isConnecting}</p>
<p>Is Disconnected: {walletStore.isDisconnected}</p>
