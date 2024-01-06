import type { WalletAccount } from '@mysten/wallet-standard';

import { getWalletUniqueIdentifier } from './wallet-tools.js';
import type { StoreState, WalletConnectionStatus } from './wallet.type.js';

/**
 * @TODO Add support for persistance (localStorage?)
 */
export function createWalletStore({
  wallets: _wallets = [],
  // storage = localStorage,
  // storageKey = DEFAULT_STORAGE_KEY,
  autoConnectEnabled: _autoConnectEnabled = false
}): StoreState {
  const autoConnectEnabled = $state(_autoConnectEnabled);
  let wallets = $state(_wallets);
  let accounts = $state([] as WalletAccount[]);
  let currentWallet = $state(null);
  let currentAccount = $state(null as WalletAccount | null);
  let lastConnectedAccountAddress = $state(null);
  let lastConnectedWalletName = $state(null as string | null);
  let connectionStatus = $state('disconnected' as WalletConnectionStatus);

  const setConnectionStatus = (status: WalletConnectionStatus) => {
    connectionStatus = status;
  };

  const setWalletConnected = (wallet, connectedAccounts, selectedAccounts) => {
    accounts = connectedAccounts;
    currentWallet = wallet;
    currentAccount = selectedAccounts;
    lastConnectedWalletName = getWalletUniqueIdentifier(wallet);
    lastConnectedAccountAddress = selectedAccounts?.address;
    connectionStatus = 'connected';
  };

  const setWalletDisconnected = () => {
    accounts = [];
    currentWallet = null;
    currentAccount = null;
    lastConnectedWalletName = null;
    lastConnectedAccountAddress = null;
    connectionStatus = 'disconnected';
  };

  const setAccountSwitched = (selectedAccount) => {
    currentAccount = selectedAccount;
    lastConnectedAccountAddress = selectedAccount?.address;
  };

  const setWalletRegistered = (updatedWallets) => {
    wallets = updatedWallets;
  };

  const setWalletUnregistered = (updatedWallets, unregisteredWallet) => {
    if (unregisteredWallet === currentWallet) {
      wallets = updatedWallets;
      setWalletDisconnected();
    } else {
      wallets = updatedWallets;
    }
  };

  const updateWalletAccounts = (updatedAccounts) => {
    accounts = updatedAccounts;
    currentAccount =
      (currentAccount &&
        updatedAccounts?.find?.(
          ({ address }) => address === currentAccount?.address
        )) ||
      updatedAccounts?.[0];
  };

  return {
    get autoConnectEnabled() {
      return autoConnectEnabled;
    },
    get wallets() {
      return wallets;
    },
    get accounts() {
      return accounts;
    },
    get currentWallet() {
      return currentWallet;
    },
    get currentAccount() {
      return currentAccount;
    },
    get lastConnectedAccountAddress() {
      return lastConnectedAccountAddress;
    },
    get lastConnectedWalletName() {
      return lastConnectedWalletName;
    },
    get connectionStatus() {
      return connectionStatus;
    },
    setConnectionStatus,
    setWalletConnected,
    setWalletDisconnected,
    setAccountSwitched,
    setWalletRegistered,
    setWalletUnregistered,
    updateWalletAccounts
  };
}

export const walletStore = createWalletStore({});
