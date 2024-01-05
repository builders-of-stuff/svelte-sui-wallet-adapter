import type { WalletAccount } from '@mysten/wallet-standard';

export function createWalletStore() {
  let count = $state(0);

  let autoConnectEnabled = $state(false);
  let wallets = $state([]);
  let accounts = $state([] as WalletAccount[]);
  let currentWallet = $state(null);
  let currentAccount = $state(null);
  let lastConnectedAccountAddress = $state(null);
  let lastConnectedWalletName = $state(null);
  let connectionStatus = $state('disconnected');

  return {
    get count() {
      return count;
    },
    increment: () => (count += 1),

    get autoConnectEnabled() {
      return autoConnectEnabled;
    },
    setAutoConnectEnabled: (value: boolean) => (autoConnectEnabled = value)
  };
}
