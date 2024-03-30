## Use

`npm install @builders-of-stuff/svelte-sui-wallet-adapter`

```
<script lang="ts">
import { walletStore } from '@builders-of-stuff/svelte-sui-wallet-adapter';

const handleConnectWallet = async () => {
  await walletStore.connectWallet();
};

const handleDisconnectWallet = async () => {
  await walletStore.disconnectWallet();
};
</script>

<button on:click={handleConnectWallet}>Connect Wallet</button>
<button on:click={handleDisconnectWallet}>Disconnect Wallet</button>
```

## Types

```
export type WalletActions = {
  setAccountSwitched: (selectedAccount: WalletAccount) => void;
  setConnectionStatus: (connectionStatus: WalletConnectionStatus) => void;
  setWalletConnected: (
    wallet: WalletWithRequiredFeatures,
    connectedAccounts: readonly WalletAccount[],
    selectedAccount: WalletAccount | null
  ) => void;
  updateWalletAccounts: (accounts: readonly WalletAccount[]) => void;
  setWalletDisconnected: () => void;
  setWalletRegistered: (updatedWallets: WalletWithRequiredFeatures[]) => void;
  setWalletUnregistered: (
    updatedWallets: WalletWithRequiredFeatures[],
    unregisteredWallet: Wallet
  ) => void;
};

export type StoreState = {
  autoConnectEnabled: boolean;
  wallets: WalletWithRequiredFeatures[];
  accounts: readonly WalletAccount[];
  currentWallet: WalletWithRequiredFeatures | null;
  currentAccount: WalletAccount | null;
  lastConnectedAccountAddress: string | null;
  lastConnectedWalletName: string | null;
  connectionStatus: WalletConnectionStatus;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  // temporary testing only?
  connectWallet: any;
  disconnectWallet: any;
} & WalletActions;
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

Everything inside `src/lib` is part of your library, everything inside `src/routes` can be used as a showcase or preview app.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## Publishing

```bash
npm publish
```
