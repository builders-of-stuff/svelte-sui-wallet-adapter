<script lang="ts">
  import { getRegisteredWallets, walletAdapter } from '$lib/index.js';
</script>

<a href="/">Home</a>

<h2>Misc. state</h2>
<p>Last Connected Account Address: {walletAdapter.lastConnectedAccountAddress}</p>
<p>Last Connected Wallet Name: {walletAdapter.lastConnectedWalletName}</p>
<p>Connection Status: {walletAdapter.connectionStatus}</p>
<p>Is Connected: {walletAdapter.isConnected}</p>
<p>Is Connecting: {walletAdapter.isConnecting}</p>
<p>Is Disconnected: {walletAdapter.isDisconnected}</p>
