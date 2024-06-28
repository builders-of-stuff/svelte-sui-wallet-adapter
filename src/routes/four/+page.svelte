<script lang="ts">
  import ConnectModal from '$lib/components/connect-modal/connect-modal.svelte';
  import { walletAdapter } from '$lib/index.js';
</script>

<div>
  <a href="/">Home</a>
</div>

<ConnectModal {walletAdapter} />
