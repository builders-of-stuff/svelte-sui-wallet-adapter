import type {
  WalletAccount,
  WalletWithRequiredFeatures
} from '@mysten/wallet-standard';
import { getWallets } from '@mysten/wallet-standard';
import { untrack } from 'svelte';

import {
  getRegisteredWallets,
  getSelectedAccount,
  getWalletUniqueIdentifier
} from './wallet-tools.js';
import type { StoreState, WalletConnectionStatus } from './wallet.type.js';
import { SUI_WALLET_NAME } from './wallet.constant.js';

/**
 * Mostly ported logic from sui/sdk/dapp-kit/...WalletProvider.tsx
 *
 * @TODO Add support for persistance (localStorage?)
 * @TODO useUnsafeBurnerWa
 *
 * @TODO ConnectButton
 * @TODO useSwitchAccount
 * @TODO signers
 */
export function createWalletState(
  {
    wallets: _wallets = [],
    // storage = localStorage,
    // storageKey = DEFAULT_STORAGE_KEY,
    // enableUnsafeBurner = false,
    autoConnect = false
  } = {
    wallets: getRegisteredWallets([SUI_WALLET_NAME]),
    // storage: localStorage,
    // storageKey: DEFAULT_STORAGE_KEY,
    // enableUnsafeBurner: false,
    autoConnect: false
  }
): StoreState {
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
   *
   * $effect.root required for using $effect outside a component
   */
  $effect.root(() => {
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
      const queryFn = untrack(
        () =>
          async function () {
            if (!autoConnectEnabled) {
              return 'disabled';
            }

            if (
              !lastConnectedWalletName ||
              !lastConnectedAccountAddress ||
              isConnected
            ) {
              return 'attempted';
            }

            const wallet = wallets?.find?.(
              (wallet) => getWalletUniqueIdentifier(wallet) === lastConnectedWalletName
            ) as any;
            // const wallet = wallets?.find?.(Boolean) as any;

            if (wallet) {
              await connectWallet({
                wallet,
                accountAddress: lastConnectedAccountAddress,
                silent: false
              });
            }

            return 'attempted';
          }
      );

      if (autoConnectEnabled) {
        queryFn();
      }
    });
  });

  // temporary testing fn (useAutoConnectWallet.ts ->  useConnectWallet.ts)
  async function connectWallet({
    wallet = wallets?.[0],
    accountAddress = lastConnectedAccountAddress,
    silent = false
  } = {}) {
    console.log('connecting: ', wallet, accountAddress, silent);

    try {
      setConnectionStatus('connecting');
      const connectResult = await wallet?.features?.['standard:connect']?.connect?.({
        // pops up connect modal
        silent
      });

      const connectedSuiAccounts = connectResult?.accounts?.filter?.(
        (account) =>
          account?.chains?.some?.((chain) => chain?.split?.(':')?.[0] === 'sui')
      );

      const selectedAccount = getSelectedAccount(
        connectedSuiAccounts,
        accountAddress || (lastConnectedAccountAddress as any)
      );
      console.log('selectedAccount: ', selectedAccount);

      setWalletConnected(wallet, connectedSuiAccounts, selectedAccount);

      // I don't know what this is for...
      return { accounts: connectedSuiAccounts };
    } catch (error) {
      setConnectionStatus('disconnected');
      throw error;
    }
  }

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
    updateWalletAccounts,
    connectWallet
  };
}

export const walletState = createWalletState();
