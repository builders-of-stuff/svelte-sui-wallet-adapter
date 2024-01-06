import type {
  WalletAccount,
  WalletWithRequiredFeatures
} from '@mysten/wallet-standard';
import { getWallets } from '@mysten/wallet-standard';

import {
  getRegisteredWallets,
  getSelectedAccount,
  getWalletUniqueIdentifier
} from './wallet-tools.js';
import type { StoreState, WalletConnectionStatus } from './wallet.type.js';
import { untrack } from 'svelte';

/**
 * Mostly ported logic from sui/sdk/dapp-kit/...WalletProvider.tsx
 *
 * @TODO Add support for persistance (localStorage?)
 * @TODO useUnsafeBurnerWallet
 */
export function createWalletStore({
  wallets: _wallets = [],
  // storage = localStorage,
  // storageKey = DEFAULT_STORAGE_KEY,
  // enableUnsafeBurner = false,
  autoConnect = false
}): StoreState {
  /**
   * State
   */
  const autoConnectEnabled = $state(autoConnect);
  let wallets = $state(_wallets);
  let accounts = $state([] as WalletAccount[]);
  let currentWallet = $state(null as WalletWithRequiredFeatures | null);
  let currentAccount = $state(null as WalletAccount | null);
  let lastConnectedAccountAddress = $state(null as string | null);
  let lastConnectedWalletName = $state(null as string | null);
  let connectionStatus = $state('disconnected' as WalletConnectionStatus);

  /**
   * Derived state
   */
  const isConnected = $derived(connectionStatus === 'connected');
  const isConnecting = $derived(connectionStatus === 'connecting');
  const isDisconnected = $derived(connectionStatus === 'disconnected');

  /**
   * Update functions
   */
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

  /**
   * Effects
   */
  // useWalletsChanged
  $effect(() => {
    const walletsApi = getWallets();

    const unsubscribeFromRegister = walletsApi.on('register', () => {
      setWalletRegistered(getRegisteredWallets());
    });

    const unsubscribeFromUnregister = walletsApi.on(
      'unregister',
      (unregisteredWallet) => {
        setWalletUnregistered(getRegisteredWallets(), unregisteredWallet);
      }
    );

    return () => {
      unsubscribeFromRegister();
      unsubscribeFromUnregister();
    };
  });

  // useWalletPropertiesChanged
  $effect(() => {
    const unsubscribeFromEvents = currentWallet?.features['standard:events'].on(
      'change',
      ({ accounts }) => {
        // TODO: We should handle features changing that might make the list of wallets
        // or even the current wallet incompatible with the dApp.
        if (accounts) {
          updateWalletAccounts(accounts);
        }
      }
    );

    return () => {
      unsubscribeFromEvents?.();
    };
  });

  // useUnsafeBurnerWallet (TODO)

  /**
   * useAutoConnectWallet
   *
   * Original implementation returns 'disabled' | 'idle' | 'attempted', but does not seem to be used anywhere.
   * This implementation currently only auto-connects, no use of the return value.
   */
  $effect(() => {
    async function queryFn() {
      if (!autoConnectEnabled) {
        return 'disabled';
      }

      if (
        !untrack(() => lastConnectedWalletName) ||
        !untrack(() => lastConnectedAccountAddress) ||
        untrack(() => isConnected)
      ) {
        return 'attempted';
      }

      const wallet = untrack(() => wallets)?.find?.(
        (wallet) =>
          getWalletUniqueIdentifier(wallet) === untrack(() => lastConnectedWalletName)
      ) as any;

      if (wallet) {
        try {
          setConnectionStatus('connecting');
          const connectResult = await wallet?.features?.['standard:connect']?.connect?.(
            {
              silent: true
            }
          );
          const connectedSuiAccounts = connectResult?.accounts?.filter?.(
            (account) =>
              account?.chains?.some?.((chain) => chain?.split?.(':')?.[0] === 'sui')
          );
          const selectedAccount = getSelectedAccount(
            connectedSuiAccounts,
            untrack(() => lastConnectedAccountAddress) as any
          );

          setWalletConnected(wallet, connectedSuiAccounts, selectedAccount);

          // I don't know what this is for...
          return { accounts: connectedSuiAccounts };
        } catch (error) {
          setConnectionStatus('disconnected');
          throw error;
        }
      }

      return 'attempted';
    }

    if (autoConnectEnabled) {
      queryFn();
    }
  });

  /**
   * Return
   */
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
    get isConnected() {
      return isConnected;
    },
    get isConnecting() {
      return isConnecting;
    },
    get isDisconnected() {
      return isDisconnected;
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
