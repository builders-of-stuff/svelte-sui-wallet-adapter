import { untrack } from 'svelte';
import type {
  WalletAccount,
  WalletWithRequiredFeatures
} from '@mysten/wallet-standard';
import {
  getWallets,
  signTransaction as mystenSignTransaction
} from '@mysten/wallet-standard';
import { toB64 } from '@mysten/sui/utils';
import {
  SuiClient,
  getFullnodeUrl,
  type SuiTransactionBlockResponse
} from '@mysten/sui/client';
import type { Transaction } from '@mysten/sui/transactions';

import {
  getRegisteredWallets,
  getSelectedAccount,
  getWalletUniqueIdentifier
} from './wallet-adapter-tools.js';
import type {
  ExecuteTransactionResult,
  ReportTransactionEffectsArgs,
  SignAndExecuteTransactionArgs,
  SignAndExecuteTransactionBlockArgs,
  SignAndExecuteTransactionResult,
  SignPersonalMessageArgs,
  SignPersonalMessageResult,
  SignTransactionArgs,
  SignTransactionBlockArgs,
  SignTransactionBlockResult,
  SignTransactionResult,
  WalletAdapter,
  WalletConnectionStatus
} from './wallet-adapter.type.js';
import {
  DEFAULT_PREFERRED_WALLETS,
  SUI_WALLET_NAME
} from './wallet-adapter.constant.js';

/**
 * Mostly ported logic from sui/sdk/dapp-kit/src/components/WalletProvider.tsx
 *
 * @TODO Add support for persistance (localStorage?)
 * @TODO useUnsafeBurnerWallet
 *
 * @TODO ConnectButton
 * @TODO Add support for more wallets
 */
export function createWalletAdapter(
  {
    wallets: _wallets = getRegisteredWallets([SUI_WALLET_NAME]),
    // storage = localStorage,
    // storageKey = DEFAULT_STORAGE_KEY,
    // enableUnsafeBurner = false,
    autoConnect = false,
    rpcUrl = getFullnodeUrl('mainnet')
  } = {
    wallets: getRegisteredWallets([SUI_WALLET_NAME]),
    // storage: localStorage,
    // storageKey: DEFAULT_STORAGE_KEY,
    // enableUnsafeBurner: false,
    autoConnect: false,
    rpcUrl: getFullnodeUrl('mainnet')
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
  let supportedIntents = $state([] as string[]);

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

  const setWalletConnected = (
    wallet,
    connectedAccounts,
    selectedAccounts,
    _supportedIntents = []
  ) => {
    accounts = connectedAccounts;
    currentWallet = wallet;
    currentAccount = selectedAccounts;
    lastConnectedWalletName = getWalletUniqueIdentifier(wallet);
    lastConnectedAccountAddress = selectedAccounts?.address;
    connectionStatus = 'connected';
    supportedIntents = _supportedIntents;
  };

  const setWalletDisconnected = () => {
    accounts = [];
    currentWallet = null;
    currentAccount = null;
    lastConnectedWalletName = null;
    lastConnectedAccountAddress = null;
    connectionStatus = 'disconnected';
    supportedIntents = [];
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
   * Connect wallet
   */
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

  /**
   * Disconnect wallet
   */
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

  /**
   * Report transaction effects
   */
  const reportTransactionEffects = async (args: ReportTransactionEffectsArgs) => {
    if (!currentWallet) {
      throw new Error('No wallet is connected.');
    }

    if (!args.account) {
      throw new Error(
        'No wallet account is selected to report transaction effects for'
      );
    }

    const reportTransactionEffectsFeature =
      currentWallet.features['sui:reportTransactionEffects'];

    if (reportTransactionEffectsFeature) {
      return await reportTransactionEffectsFeature.reportTransactionEffects({
        effects: Array.isArray(args?.effects)
          ? toB64(new Uint8Array(args?.effects))
          : args?.effects,
        account: args?.account,
        chain: args?.chain ?? currentWallet?.chains[0]
      });
    }
  };

  /**
   * Sign transaction
   */
  const signTransaction = async (
    transaction: Transaction | string,
    args: SignTransactionArgs = {}
  ): Promise<SignTransactionResult> => {
    if (!currentWallet) {
      throw new Error('No wallet is connected.');
    }

    const signerAccount = args.account ?? currentAccount;
    if (!signerAccount) {
      throw new Error('No wallet account is selected to sign the transaction with.');
    }

    if (
      !currentWallet.features['sui:signTransaction'] &&
      !currentWallet.features['sui:signTransactionBlock']
    ) {
      throw new Error("This wallet doesn't support the `signTransaction` feature.");
    }

    const { bytes, signature } = await mystenSignTransaction(currentWallet, {
      ...args,
      transaction: {
        toJSON: async () => {
          return typeof transaction === 'string'
            ? transaction
            : await transaction.toJSON({
                supportedIntents: [],
                client: suiClient
              });
        }
      },
      account: signerAccount,
      chain: args.chain ?? signerAccount.chains[0]
    });

    return {
      bytes,
      signature,
      reportTransactionEffects: (effects) => {
        reportTransactionEffects({
          effects,
          account: signerAccount,
          chain: args.chain ?? signerAccount.chains[0]
        });
      }
    };
  };

  /**
   * Sign & execute transaction
   */
  const signAndExecuteTransaction = async ({
    transaction,
    execute,
    ...args
  }: SignAndExecuteTransactionArgs): Promise<SignAndExecuteTransactionResult> => {
    const executeTransaction: ({
      bytes,
      signature
    }: {
      bytes: string;
      signature: string;
    }) => Promise<ExecuteTransactionResult> =
      execute ??
      (async ({ bytes, signature }) => {
        const { digest, rawEffects, effects, objectChanges } =
          await suiClient.executeTransactionBlock({
            transactionBlock: bytes,
            signature,
            options: {
              showRawEffects: true,
              showEffects: true,
              showObjectChanges: true,
              showEvents: true
            }
          });

        return {
          digest,
          rawEffects,
          effects,
          objectChanges,
          bytes,
          signature
        };
      });

    if (!currentWallet) {
      throw new Error('No wallet is connected.');
    }

    const signerAccount = args.account ?? currentAccount;
    if (!signerAccount) {
      throw new Error('No wallet account is selected to sign the transaction with.');
    }
    const chain = args.chain ?? signerAccount?.chains[0];

    if (
      !currentWallet.features['sui:signTransaction'] &&
      !currentWallet.features['sui:signTransactionBlock']
    ) {
      throw new Error("This wallet doesn't support the `signTransaction` feature.");
    }

    const { signature, bytes } = await mystenSignTransaction(currentWallet, {
      ...args,
      transaction: {
        async toJSON() {
          return typeof transaction === 'string'
            ? transaction
            : await transaction.toJSON({
                supportedIntents,
                client: suiClient
              });
        }
      },
      account: signerAccount,
      chain: args.chain ?? signerAccount.chains[0]
    });

    const result = await executeTransaction({ bytes, signature });

    let effects: string;

    if ('effects' in result && result.effects?.bcs) {
      effects = result.effects.bcs;
    } else if ('rawEffects' in result) {
      effects = toB64(new Uint8Array(result.rawEffects!));
    } else {
      throw new Error('Could not parse effects from transaction result.');
    }

    reportTransactionEffects({ effects, account: signerAccount, chain });

    return result as any;
  };

  /**
   * Execute transaction
   */
  const executeTransaction = async ({
    bytes,
    signature
  }): Promise<ExecuteTransactionResult> => {
    const {
      digest,
      rawEffects,
      effects,
      objectChanges,
      events,
      timestampMs,
      transaction
    } = await suiClient.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
      options: {
        showRawEffects: true,
        showEffects: true,
        showObjectChanges: true,
        showEvents: true
      }
    });

    return {
      rawEffects,
      bytes,
      digest,
      signature,
      effects,
      objectChanges,
      events,
      timestampMs,
      transaction
    } as any;
  };

  /**
   * Sign personal message
   */
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
   * Switch account
   */
  const switchAccount = async (account: WalletAccount) => {
    if (!currentWallet) {
      throw new Error('No wallet is connected.');
    }

    const accountToSelect = currentWallet.accounts.find(
      (walletAccount) => walletAccount.address === account.address
    );
    if (!accountToSelect) {
      throw new Error(
        `No account with address ${account?.address} is connected to ${currentWallet?.name}.`
      );
    }

    setAccountSwitched(accountToSelect);
  };

  /**
   * Deprecated in favor of signTransaction
   */
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
   * Deprecated in favor of signAndExecuteTransaction
   *
   * @TODO Sui client integration with executeFromWallet prop
   */
  const signAndExecuteTransactionBlock = async (
    signAndExecuteTransactionBlockArgs: SignAndExecuteTransactionBlockArgs,
    executeFromWallet: boolean = false
  ): Promise<SuiTransactionBlockResponse> => {
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

  /**
   * Effects
   *
   * $effect.root required for using $effect outside a component
   */
  $effect.root(() => {
    // useWalletsChanged
    $effect(() => {
      const walletsApi = getWallets();
      setWalletRegistered(getRegisteredWallets(DEFAULT_PREFERRED_WALLETS));

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
    get supportedIntents() {
      return supportedIntents;
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
    setWalletRegistered,
    setWalletUnregistered,
    updateWalletAccounts,
    connectWallet,
    disconnectWallet,
    reportTransactionEffects,
    signTransaction,
    signAndExecuteTransaction,
    signPersonalMessage,
    switchAccount,
    signTransactionBlock,
    signAndExecuteTransactionBlock,
    executeTransaction
  };
}

export const walletAdapter = createWalletAdapter({
  rpcUrl: getFullnodeUrl('mainnet')
});

export const devnetWalletAdapter = createWalletAdapter({
  rpcUrl: getFullnodeUrl('devnet')
});

export const testnetWalletAdapter = createWalletAdapter({
  rpcUrl: getFullnodeUrl('testnet')
});

export const localnetWalletAdapter = createWalletAdapter({
  rpcUrl: getFullnodeUrl('localnet')
});
