import { untrack } from 'svelte';
import type {
  WalletAccount,
  WalletWithRequiredFeatures
} from '@mysten/wallet-standard';
import { getWallets } from '@mysten/wallet-standard';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';

import {
  getRegisteredWallets,
  getSelectedAccount,
  getWalletUniqueIdentifier
} from './wallet-adapter-tools.js';
import type {
  SignAndExecuteTransactionBlockArgs,
  SignAndExecuteTransactionBlockResult,
  SignPersonalMessageArgs,
  SignPersonalMessageResult,
  SignTransactionBlockArgs,
  SignTransactionBlockResult,
  WalletAdapter,
  WalletConnectionStatus
} from './wallet-adapter.type.js';
import { SUI_WALLET_NAME } from './wallet-adapter.constant.js';

/**
 * Mostly ported logic from sui/sdk/dapp-kit/src/components/WalletProvider.tsx
 *
 * @TODO Add support for persistance (localStorage?)
 * @TODO useUnsafeBurnerWa
 *
 * @TODO ConnectButton
 * @TODO useSwitchAccount
 */
export function createWalletAdapter(
  {
    wallets: _wallets = [],
    // storage = localStorage,
    // storageKey = DEFAULT_STORAGE_KEY,
    // enableUnsafeBurner = false,
    autoConnect = false,
    rpcUrl = getFullnodeUrl('devnet')
  } = {
    wallets: getRegisteredWallets([SUI_WALLET_NAME]),
    // storage: localStorage,
    // storageKey: DEFAULT_STORAGE_KEY,
    // enableUnsafeBurner: false,
    autoConnect: false,
    rpcUrl: getFullnodeUrl('devnet')
  }
): WalletAdapter {
  /**
   * State
   */
  const suiClient = $state(
    new SuiClient({
      url: rpcUrl
    })
  );
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
   * State functions
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
   * Utility functions
   */
  // temporary testing fn (useAutoConnectWallet.ts -> useConnectWallet.ts)
  async function connectWallet({
    wallet = wallets?.[0],
    accountAddress = lastConnectedAccountAddress,
    silent = false
  } = {}) {
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

      setWalletConnected(wallet, connectedSuiAccounts, selectedAccount);

      return { accounts: connectedSuiAccounts };
    } catch (error) {
      setConnectionStatus('disconnected');
      throw error;
    }
  }

  async function disconnectWallet() {
    if (!currentWallet) {
      throw new Error('No wallet is connected');
    }

    try {
      // Wallets aren't required to implement the disconnect feature, so we'll
      // optionally call the disconnect feature if it exists and reset the UI
      // state on the frontend at a minimum.
      await currentWallet.features['standard:disconnect']?.disconnect()?.then?.(() => {
        setWalletDisconnected();
      });
    } catch (error) {
      console.error(
        'Failed to disconnect the application from the current wallet.',
        error
      );
    }

    setWalletDisconnected();
  }

  const signTransactionBlock = async (
    signTransactionBlockArgs: SignTransactionBlockArgs
  ): Promise<SignTransactionBlockResult> => {
    if (!currentWallet) {
      throw new Error('No wallet is connected.');
    }

    const signerAccount = signTransactionBlockArgs.account ?? currentAccount;
    if (!signerAccount) {
      throw new Error(
        'No wallet account is selected to sign the transaction block with.'
      );
    }

    const walletFeature = currentWallet.features['sui:signTransactionBlock'];
    if (!walletFeature) {
      throw new Error(
        "This wallet doesn't support the `SignTransactionBlock` feature."
      );
    }

    return await walletFeature.signTransactionBlock({
      transactionBlock: signTransactionBlockArgs.transactionBlock,
      account: signerAccount,
      chain: signTransactionBlockArgs.chain ?? signerAccount.chains[0]
    });
  };

  /**
   * @TODO Sui client integration with executeFromWallet prop
   */
  const signAndExecuteTransactionBlock = async (
    signAndExecuteTransactionBlockArgs: SignAndExecuteTransactionBlockArgs,
    executeFromWallet: boolean = false
  ): Promise<SignAndExecuteTransactionBlockResult> => {
    if (!currentWallet) {
      throw new Error('No wallet is connected.');
    }

    const signerAccount = signAndExecuteTransactionBlockArgs.account ?? currentAccount;
    if (!signerAccount) {
      throw new Error(
        'No wallet account is selected to sign and execute the transaction block with.'
      );
    }

    if (executeFromWallet) {
      const walletFeature =
        currentWallet.features['sui:signAndExecuteTransactionBlock'];
      if (!walletFeature) {
        throw new Error(
          "This wallet doesn't support the `signAndExecuteTransactionBlock` feature."
        );
      }

      return walletFeature.signAndExecuteTransactionBlock({
        ...signAndExecuteTransactionBlockArgs,
        account: signerAccount,
        chain: signAndExecuteTransactionBlockArgs.chain ?? signerAccount.chains[0],
        requestType: signAndExecuteTransactionBlockArgs.requestType,
        options: signAndExecuteTransactionBlockArgs.options ?? {}
      });
    }

    const walletFeature = currentWallet.features['sui:signTransactionBlock'];
    if (!walletFeature) {
      throw new Error(
        "This wallet doesn't support the `signTransactionBlock` feature."
      );
    }

    const { signature, transactionBlockBytes } =
      await walletFeature.signTransactionBlock({
        ...signAndExecuteTransactionBlockArgs,
        account: signerAccount,
        chain: signAndExecuteTransactionBlockArgs.chain ?? signerAccount.chains[0]
      });

    return suiClient.executeTransactionBlock({
      transactionBlock: transactionBlockBytes,
      signature,
      requestType: signAndExecuteTransactionBlockArgs.requestType,
      options: signAndExecuteTransactionBlockArgs.options ?? {}
    });
  };

  const signPersonalMessage = async (
    signPersonalMessageArgs: SignPersonalMessageArgs
  ): Promise<SignPersonalMessageResult> => {
    if (!currentWallet) {
      throw new Error('No wallet is connected.');
    }

    const signerAccount = signPersonalMessageArgs.account ?? currentAccount;
    if (!signerAccount) {
      throw new Error(
        'No wallet account is selected to sign the personal message with.'
      );
    }

    const signPersonalMessageFeature =
      currentWallet.features['sui:signPersonalMessage'];
    if (signPersonalMessageFeature) {
      return await signPersonalMessageFeature.signPersonalMessage({
        ...signPersonalMessageArgs,
        account: signerAccount
      });
    }

    // TODO: Remove this once we officially discontinue sui:signMessage in the wallet standard
    const signMessageFeature = currentWallet.features['sui:signMessage'];
    if (signMessageFeature) {
      console.warn(
        "This wallet doesn't support the `signPersonalMessage` feature... falling back to `signMessage`."
      );

      const { messageBytes, signature } = await signMessageFeature.signMessage({
        ...signPersonalMessageArgs,
        account: signerAccount
      });
      return { bytes: messageBytes, signature };
    }

    throw new Error("This wallet doesn't support the `signPersonalMessage` feature.");
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

  /**
   * Return
   */
  return {
    get suiClient() {
      return suiClient;
    },
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
    connectWallet,
    disconnectWallet,
    signTransactionBlock,
    signAndExecuteTransactionBlock,
    signPersonalMessage
  };
}

export const walletAdapter = createWalletAdapter();
