# Svelte Sui Wallet Adapter

A Sui wallet adapter for SvelteKit and Svelte 5.

Zero setup: no Tailwind, no shadcn-svelte, no peer UI dependencies. Components ship
with their own scoped styles and are themeable via CSS custom properties.

## Getting started

```bash
pnpm install @builders-of-stuff/svelte-sui-wallet-adapter
```

### Usage

```svelte
<!-- +page.svelte -->
<script lang="ts">
  import {
    ConnectButton,
    walletAdapter
  } from '@builders-of-stuff/svelte-sui-wallet-adapter';
</script>

<ConnectButton {walletAdapter} />
```

Pre-configured adapters are exported for each network: `walletAdapter` (mainnet),
`testnetWalletAdapter`, `devnetWalletAdapter`, and `localnetWalletAdapter`. Or create
your own:

```ts
import { createWalletAdapter } from '@builders-of-stuff/svelte-sui-wallet-adapter';

const walletAdapter = createWalletAdapter({
  network: 'testnet' // 'mainnet' | 'testnet' | 'devnet' | 'localnet'
  // baseUrl: 'https://my-own-fullnode.example.com:443',
  // autoConnect: false,           // reconnect to the last wallet on load (default true)
  // storageKey: 'my-app:wallet',  // localStorage key for persistence
  // preferredWallets: ['Slush'],  // wallet names to order first in the modal
  // slushWallet: { name: 'My App' } // register the Slush web wallet
});
```

### Reading state and signing

The adapter exposes reactive state (Svelte 5 runes) and actions:

```svelte
<script lang="ts">
  import { Transaction } from '@mysten/sui/transactions';
  import {
    ConnectButton,
    walletAdapter
  } from '@builders-of-stuff/svelte-sui-wallet-adapter';

  $effect(() => {
    console.log(walletAdapter.currentAccount);
    console.log(walletAdapter.isConnected);
  });

  async function doSomething() {
    const tx = new Transaction();
    // ... build the transaction ...

    const result = await walletAdapter.signAndExecuteTransaction({
      transaction: tx
    });

    // result is a SuiClientTypes.TransactionResult tagged union:
    if (result.$kind === 'Transaction') {
      console.log('digest:', result.Transaction.digest);
    }

    // Need events/object types/balance changes? Wait for the transaction:
    const confirmed = await walletAdapter.waitForTransaction({
      digest: (result.Transaction ?? result.FailedTransaction).digest,
      include: { events: true, objectTypes: true, balanceChanges: true }
    });
  }

  async function query() {
    // walletAdapter.suiClient is a SuiGrpcClient from @mysten/sui/grpc
    const owned = await walletAdapter.suiClient.core.listOwnedObjects({
      owner: walletAdapter.currentAccount!.address,
      include: { json: true }
    });
  }
</script>

<ConnectButton {walletAdapter} />
```

Other actions: `connectWallet`, `disconnectWallet`, `switchAccount`, `switchWallet`,
`signTransaction`, `executeTransaction`, `signPersonalMessage`.

### GraphQL

The adapter's client is gRPC, but the library exports the public GraphQL endpoint
URLs for use with `SuiGraphQLClient`:

```ts
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { getGraphqlUrl } from '@builders-of-stuff/svelte-sui-wallet-adapter';

const graphqlClient = new SuiGraphQLClient({
  url: getGraphqlUrl('testnet'),
  network: 'testnet'
});
```

### Theming

Components use scoped styles with `--sswa-*` CSS custom property hooks and follow the
OS color scheme automatically (via `light-dark()`). Override any token globally:

```css
:root {
  --sswa-primary: #4da2ff;
  --sswa-primary-foreground: #ffffff;
  --sswa-background: #ffffff;
  --sswa-foreground: #18181b;
  --sswa-secondary: #f4f4f5;
  --sswa-secondary-foreground: #18181b;
  --sswa-muted: #f4f4f5;
  --sswa-muted-foreground: #71717a;
  --sswa-border: #e4e4e7;
  --sswa-ring: #4da2ff;
  --sswa-radius: 0.75rem;
  --sswa-font-sans: inherit;
  --sswa-overlay: rgb(24 24 27 / 0.4);
}
```

To force a scheme instead of following the OS, set `color-scheme: light` (or `dark`)
on an ancestor element.

![Connect Button](docs/images/button.png)

![Wallet Selection Modal](docs/images/modal.png)

![Account Dropdown Menu](docs/images/dropdown.png)

## Migrating from v2

v3 is a major overhaul:

- **No more UI peer dependencies.** Tailwind, shadcn-svelte, bits-ui, and svelte-radix
  are no longer required. Remove the `styles.css` import — the `./styles.css` export
  is gone.
- **gRPC client.** `walletAdapter.suiClient` is now a `SuiGrpcClient`
  (`@mysten/sui` v2). JSON-RPC methods like `getOwnedObjects` and
  `executeTransactionBlock` are replaced by the core API
  (`suiClient.core.listOwnedObjects`, `suiClient.core.executeTransaction`, ...).
- **`createWalletAdapter` options changed.** `rpcUrl` → `network` (+ optional
  `baseUrl`). New: `storage`, `storageKey`, `preferredWallets`.
- **Persistence + autoConnect.** Connections persist to localStorage and
  `autoConnect` now defaults to `true`.
- **Results changed.** `signAndExecuteTransaction`/`executeTransaction` return a
  `SuiClientTypes.TransactionResult` tagged union (no more `objectChanges`/`rawEffects`).
- **Removed.** `reportTransactionEffects` (feature removed from the wallet standard;
  wallets that execute transactions handle effects reporting themselves), the
  deprecated `sui:signMessage` fallback in `signPersonalMessage`, and the internal
  `setWalletRegistered`/`setWalletUnregistered`/`updateWalletAccounts` actions.
- **New.** `switchWallet`, `waitForTransaction`, `isReconnecting`, "copy address" /
  "switch wallet" in the account dropdown, install links and connecting/error states
  in the connect modal.
- **Node >= 22** is required (inherited from `@mysten/sui` v2).

## Current known issues

- Components and adapters server-render safely, but wallet detection and
  connection are browser-only (the wallet standard lives in the browser)

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev
```

Everything inside `src/lib` is part of the library, everything inside `src/routes` can be used as a showcase or preview app.
