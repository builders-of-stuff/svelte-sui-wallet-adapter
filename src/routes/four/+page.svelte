<script lang="ts">
  import ConnectButton from '$lib/components/connect-button/connect-button.svelte';
  import { walletAdapter } from '$lib/index.js';
</script>

<div>
  <a href="/">Home</a>
</div>

<ConnectButton {walletAdapter} />
