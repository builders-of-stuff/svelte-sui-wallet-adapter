<script lang="ts">
  import { getRegisteredWallets, walletState } from '$lib/index.js';
</script>

<a href="/">Home</a>

<h2>Misc. state</h2>
<p>Last Connected Account Address: {walletState.lastConnectedAccountAddress}</p>
<p>Last Connected Wallet Name: {walletState.lastConnectedWalletName}</p>
<p>Connection Status: {walletState.connectionStatus}</p>
<p>Is Connected: {walletState.isConnected}</p>
<p>Is Connecting: {walletState.isConnecting}</p>
<p>Is Disconnected: {walletState.isDisconnected}</p>
