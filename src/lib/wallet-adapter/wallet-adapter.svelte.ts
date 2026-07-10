import { untrack } from 'svelte';
import type {
  WalletAccount,
  WalletWithRequiredFeatures,
  SuiSignAndExecuteTransactionOutput
} from '@mysten/wallet-standard';
import {
  getWallets,
  signTransaction as standardSignTransaction,
  signAndExecuteTransaction as standardSignAndExecuteTransaction
} from '@mysten/wallet-standard';
import { fromBase64 } from '@mysten/sui/utils';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import {
  extractStatusFromEffectsBcs,
  parseTransactionEffectsBcs
} from '@mysten/sui/client';
import type { Transaction } from '@mysten/sui/transactions';
import { registerSlushWallet } from '@mysten/slush-wallet';
import { isEnokiNetwork, registerEnokiWallets } from '@mysten/enoki';

import {
  getRegisteredWallets,
  getSelectedAccount,
  getWalletUniqueIdentifier
} from './wallet-adapter-tools.js';
import {
  clearAccountFromStorage,
  getDefaultStorage,
  readAccountFromStorage,
  sanitizeWalletId,
  saveAccountToStorage
} from './wallet-adapter-storage.js';
import type {
  ConnectWalletArgs,
  CreateWalletAdapterOptions,
  ExecuteTransactionResult,
  SignAndExecuteTransactionArgs,
  SignAndExecuteTransactionResult,
  SignPersonalMessageArgs,
  SignPersonalMessageResult,
  SignTransactionArgs,
  SignTransactionResult,
  WalletAdapter,
  WalletConnectionStatus
} from './wallet-adapter.type.js';
import {
  DEFAULT_PREFERRED_WALLETS,
  DEFAULT_STORAGE_KEY,
  getGrpcFullnodeUrl
} from './wallet-adapter.constant.js';

/**
 * Mostly ported logic from Mysten's dapp-kit (WalletProvider / dapp-kit-core).
 *
 * @TODO useUnsafeBurnerWallet
 */
export function createWalletAdapter({
  network = 'mainnet',
  baseUrl = getGrpcFullnodeUrl(network),
  autoConnect = true,
  storage = getDefaultStorage(),
  storageKey = DEFAULT_STORAGE_KEY,
  preferredWallets = DEFAULT_PREFERRED_WALLETS,
  slushWallet,
  enokiWallets
}: CreateWalletAdapterOptions = {}): WalletAdapter {
  const suiClient = new SuiGrpcClient({ network, baseUrl });
  const defaultChain = `sui:${network}` as const;

  /**
   * State
   */
  const autoConnectEnabled = $state(autoConnect);
  let wallets = $state(getRegisteredWallets(preferredWallets));
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
  const isReconnecting = $derived(connectionStatus === 'reconnecting');
  const isDisconnected = $derived(connectionStatus === 'disconnected');

  /**
   * State functions
   */
  const setConnectionStatus = (status: WalletConnectionStatus) => {
    connectionStatus = status;
  };

  const setWalletConnected = (
    wallet: WalletWithRequiredFeatures,
    connectedAccounts: readonly WalletAccount[],
    selectedAccount: WalletAccount | null,
    _supportedIntents: string[] = []
  ) => {
    accounts = connectedAccounts as WalletAccount[];
    currentWallet = wallet;
    currentAccount = selectedAccount;
    lastConnectedWalletName = getWalletUniqueIdentifier(wallet);
    lastConnectedAccountAddress = selectedAccount?.address ?? null;
    connectionStatus = 'connected';
    supportedIntents = _supportedIntents;

    if (selectedAccount) {
      saveAccountToStorage(
        storage,
        storageKey,
        getWalletUniqueIdentifier(wallet),
        selectedAccount.address,
        _supportedIntents
      );
    }
  };

  const setWalletDisconnected = () => {
    accounts = [];
    currentWallet = null;
    currentAccount = null;
    lastConnectedWalletName = null;
    lastConnectedAccountAddress = null;
    connectionStatus = 'disconnected';
    supportedIntents = [];
    clearAccountFromStorage(storage, storageKey);
  };

  const setAccountSwitched = (selectedAccount: WalletAccount) => {
    currentAccount = selectedAccount;
    lastConnectedAccountAddress = selectedAccount?.address ?? null;

    if (currentWallet && selectedAccount) {
      saveAccountToStorage(
        storage,
        storageKey,
        getWalletUniqueIdentifier(currentWallet),
        selectedAccount.address,
        supportedIntents
      );
    }
  };

  const updateWalletAccounts = (updatedAccounts: readonly WalletAccount[]) => {
    accounts = updatedAccounts as WalletAccount[];

    const resolvedAccount =
      (currentAccount &&
        updatedAccounts.find(({ address }) => address === currentAccount?.address)) ||
      updatedAccounts[0] ||
      null;

    if (resolvedAccount && resolvedAccount !== currentAccount) {
      setAccountSwitched(resolvedAccount);
    } else if (!resolvedAccount) {
      currentAccount = null;
    }
  };

  /**
   * Wallets aren't required to implement sui:getCapabilities, and connect results
   * only started including supportedIntents recently, so probe defensively.
   */
  const getSupportedIntents = async (wallet: WalletWithRequiredFeatures) => {
    try {
      const capabilities =
        await wallet.features['sui:getCapabilities']?.getCapabilities();
      return capabilities?.supportedIntents ?? [];
    } catch {
      return [];
    }
  };

  /**
   * Connect wallet
   */
  async function connectWallet({
    wallet = wallets?.[0],
    accountAddress = lastConnectedAccountAddress,
    silent = false
  }: ConnectWalletArgs = {}) {
    if (!wallet) {
      throw new Error('No wallets available to connect to.');
    }

    const wasConnected = connectionStatus === 'connected';

    try {
      setConnectionStatus(wasConnected ? 'reconnecting' : 'connecting');

      const connectResult = await wallet.features['standard:connect'].connect({
        // silent: true restores an existing authorization without popping up the wallet
        silent
      });

      const connectedSuiAccounts = connectResult.accounts.filter((account) =>
        account.chains.some((chain) => chain.split(':')[0] === 'sui')
      );

      const selectedAccount = getSelectedAccount(
        connectedSuiAccounts,
        accountAddress ?? undefined
      );

      const intents =
        connectResult.supportedIntents ?? (await getSupportedIntents(wallet));

      setWalletConnected(wallet, connectedSuiAccounts, selectedAccount, intents);

      return { accounts: connectedSuiAccounts };
    } catch (error) {
      setConnectionStatus(wasConnected ? 'connected' : 'disconnected');
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
      await currentWallet.features['standard:disconnect']?.disconnect();
    } catch (error) {
      console.error(
        'Failed to disconnect the application from the current wallet.',
        error
      );
    }

    setWalletDisconnected();
  }

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
   * Switch wallet (connects to the new wallet, replacing the current connection)
   */
  const switchWallet = (wallet: WalletWithRequiredFeatures) => {
    return connectWallet({ wallet, accountAddress: null });
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

    const { bytes, signature } = await standardSignTransaction(currentWallet, {
      ...args,
      transaction: {
        toJSON: async () => {
          return typeof transaction === 'string'
            ? transaction
            : await transaction.toJSON({
                supportedIntents,
                client: suiClient
              });
        }
      },
      account: signerAccount,
      chain: args.chain ?? defaultChain
    });

    return { bytes, signature };
  };

  /**
   * Builds a SuiClientTypes.TransactionResult from what the wallet returns from
   * sui:signAndExecuteTransaction, without an extra RPC roundtrip.
   */
  const transactionResultFromWalletOutput = (
    output: SuiSignAndExecuteTransactionOutput
  ): SignAndExecuteTransactionResult => {
    const effectsBytes = fromBase64(output.effects);
    const status = extractStatusFromEffectsBcs(effectsBytes);

    const transaction = {
      digest: output.digest,
      signatures: [output.signature],
      epoch: null,
      status,
      effects: parseTransactionEffectsBcs(effectsBytes),
      balanceChanges: undefined,
      events: undefined,
      objectTypes: undefined,
      transaction: undefined,
      bcs: undefined
    };

    return (
      status.success
        ? { $kind: 'Transaction', Transaction: transaction }
        : { $kind: 'FailedTransaction', FailedTransaction: transaction }
    ) as SignAndExecuteTransactionResult;
  };

  /**
   * Sign & execute transaction
   *
   * Signs in the wallet and executes via the adapter's gRPC client (or a
   * custom `execute` function) whenever the wallet can sign — this returns
   * the COMPLETE result (events, balance changes, object types), which
   * wallet-side execution cannot provide.
   *
   * Wallet-side execution (sui:signAndExecuteTransaction) is the fallback
   * for wallets that cannot sign without executing — and only via the
   * modern feature: wallet-standard's legacy signAndExecuteTransactionBlock
   * shim re-parses the wallet's raw response and crashes on wallets that
   * don't return it ("Cannot read properties of undefined (reading
   * 'txSignatures')").
   */
  const signAndExecuteTransaction = async ({
    transaction,
    execute,
    ...args
  }: SignAndExecuteTransactionArgs): Promise<SignAndExecuteTransactionResult> => {
    if (!currentWallet) {
      throw new Error('No wallet is connected.');
    }

    const signerAccount = args.account ?? currentAccount;
    if (!signerAccount) {
      throw new Error('No wallet account is selected to sign the transaction with.');
    }

    if (typeof transaction !== 'string' && 'setSenderIfNotSet' in transaction) {
      transaction.setSenderIfNotSet(signerAccount.address);
    }

    const chain = args.chain ?? defaultChain;
    const transactionWrapper = {
      toJSON: async () => {
        return typeof transaction === 'string'
          ? transaction
          : await transaction.toJSON({
              supportedIntents,
              client: suiClient
            });
      }
    };

    const walletCanSign =
      currentWallet.features['sui:signTransaction'] ||
      currentWallet.features['sui:signTransactionBlock'];

    if (walletCanSign) {
      const { bytes, signature } = await standardSignTransaction(currentWallet, {
        ...args,
        transaction: transactionWrapper,
        account: signerAccount,
        chain
      });

      const result = await (execute ?? executeTransaction)({ bytes, signature });

      return result as SignAndExecuteTransactionResult;
    }

    if (!execute && currentWallet.features['sui:signAndExecuteTransaction']) {
      const result = await standardSignAndExecuteTransaction(currentWallet, {
        ...args,
        transaction: transactionWrapper,
        account: signerAccount,
        chain
      });

      return transactionResultFromWalletOutput(result);
    }

    throw new Error(
      'This wallet supports neither `signTransaction` nor `signAndExecuteTransaction`.'
    );
  };

  /**
   * Execute transaction (pre-signed bytes) via the adapter's gRPC client
   */
  const executeTransaction = async ({
    bytes,
    signature
  }: {
    bytes: string;
    signature: string;
  }): Promise<ExecuteTransactionResult> => {
    return suiClient.core.executeTransaction({
      transaction: fromBase64(bytes),
      signatures: [signature],
      include: {
        balanceChanges: true,
        effects: true,
        events: true,
        objectTypes: true
      }
    });
  };

  /**
   * Wait for transaction (passthrough to the gRPC client)
   */
  const waitForTransaction: WalletAdapter['waitForTransaction'] = (options) => {
    return suiClient.core.waitForTransaction(options);
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
    if (!signPersonalMessageFeature) {
      throw new Error("This wallet doesn't support the `signPersonalMessage` feature.");
    }

    return await signPersonalMessageFeature.signPersonalMessage({
      ...signPersonalMessageArgs,
      account: signerAccount,
      chain: signPersonalMessageArgs.chain ?? defaultChain
    });
  };

  /**
   * Auto-connect: restore the persisted wallet/account once the wallet registers.
   * Runs every time the wallet list changes while disconnected, because wallet
   * extensions register asynchronously after page load.
   */
  async function attemptAutoConnect(candidateWallets: WalletWithRequiredFeatures[]) {
    const saved = await readAccountFromStorage(storage, storageKey);
    if (!saved || connectionStatus !== 'disconnected') {
      return;
    }

    const wallet = candidateWallets.find(
      (candidate) =>
        sanitizeWalletId(getWalletUniqueIdentifier(candidate)) === saved.walletId
    );
    if (!wallet) {
      return;
    }

    // If the wallet already exposes the saved account, restore without prompting.
    const existingAccount = wallet.accounts.find(
      ({ address }) => address === saved.address
    );

    if (existingAccount) {
      const suiAccounts = wallet.accounts.filter((account) =>
        account.chains.some((chain) => chain.split(':')[0] === 'sui')
      );
      const intents = saved.supportedIntents ?? (await getSupportedIntents(wallet));

      setWalletConnected(wallet, suiAccounts, existingAccount, intents);
      return;
    }

    try {
      await connectWallet({
        wallet,
        accountAddress: saved.address,
        silent: true
      });
    } catch {
      // Auto-connect is best-effort; a rejected silent connect is not an error.
    }
  }

  /**
   * Effects
   *
   * $effect.root required for using $effect outside a component
   */
  $effect.root(() => {
    /**
     * useWalletsChanged
     */
    $effect(() => {
      const walletsApi = getWallets();
      wallets = getRegisteredWallets(preferredWallets);

      const unsubscribeFromRegister = walletsApi.on('register', () => {
        wallets = getRegisteredWallets(preferredWallets);
      });

      const unsubscribeFromUnregister = walletsApi.on(
        'unregister',
        (unregisteredWallet) => {
          wallets = getRegisteredWallets(preferredWallets);

          if (unregisteredWallet === currentWallet) {
            setWalletDisconnected();
          }
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

    /**
     * useSlushWallet
     */
    $effect(() => {
      if (!slushWallet?.name) {
        return;
      }

      let cleanup: (() => void) | undefined;
      let isMounted = true;

      try {
        const result = registerSlushWallet(slushWallet.name, {
          origin: slushWallet.origin,
          metadataApiUrl: slushWallet.metadataApiUrl
        });

        if (isMounted && result) {
          cleanup = result.unregister;
        } else if (result) {
          result.unregister();
        }
      } catch (error) {
        console.error('Failed to register Slush wallet:', error);
      }

      return () => {
        isMounted = false;
        if (cleanup) cleanup();
      };
    });

    /**
     * useEnokiWallets: register zkLogin social-login wallets ("Sign in with
     * Google" etc.) as wallet-standard wallets, backed by Enoki.
     */
    $effect(() => {
      if (!enokiWallets) {
        return;
      }

      if (!isEnokiNetwork(network)) {
        console.warn(
          `Enoki zkLogin wallets are not available on ${network}; skipping registration.`
        );
        return;
      }

      try {
        const { unregister } = registerEnokiWallets({
          ...enokiWallets,
          client: suiClient,
          network
        });

        return unregister;
      } catch (error) {
        console.error('Failed to register Enoki zkLogin wallets:', error);
      }
    });

    // useUnsafeBurnerWallet (TODO)

    /**
     * useAutoConnectWallet
     */
    $effect(() => {
      if (!autoConnectEnabled || connectionStatus !== 'disconnected') {
        return;
      }

      const candidateWallets = wallets;
      if (!candidateWallets.length) {
        return;
      }

      untrack(() => {
        void attemptAutoConnect(candidateWallets);
      });
    });
  });

  /**
   * Return
   */
  return {
    get suiClient() {
      return suiClient;
    },
    get network() {
      return network;
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
    get isReconnecting() {
      return isReconnecting;
    },
    get isDisconnected() {
      return isDisconnected;
    },
    connectWallet,
    disconnectWallet,
    switchAccount,
    switchWallet,
    signTransaction,
    signAndExecuteTransaction,
    executeTransaction,
    waitForTransaction,
    signPersonalMessage
  };
}

export const walletAdapter = createWalletAdapter({
  network: 'mainnet'
});

export const devnetWalletAdapter = createWalletAdapter({
  network: 'devnet',
  storageKey: `${DEFAULT_STORAGE_KEY}:devnet`
});

export const testnetWalletAdapter = createWalletAdapter({
  network: 'testnet',
  storageKey: `${DEFAULT_STORAGE_KEY}:testnet`
});

export const localnetWalletAdapter = createWalletAdapter({
  network: 'localnet',
  storageKey: `${DEFAULT_STORAGE_KEY}:localnet`
});
