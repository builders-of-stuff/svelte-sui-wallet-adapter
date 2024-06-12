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
  WalletAdapter as WalletAdapterType,
  WalletConnectionStatus
} from './wallet-adapter.type.js';
import { SUI_WALLET_NAME } from './wallet-adapter.constant.js';

/**
 * Mostly ported logic from sui/sdk/dapp-kit/src/components/WalletProvider.tsx
 *
 * @TODO Add support for persistance (localStorage?)
 * @TODO useUnsafeBurnerWallet
 *
 * @TODO ConnectButton
 * @TODO useSwitchAccount
 * @TODO Add support for more wallets
 */
export class WalletAdapter {
  constructor(
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
  ) {
    this.#wallets = _wallets;
    this.#suiClient = new SuiClient({
      url: rpcUrl
    });

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
          this.setWalletRegistered(getRegisteredWallets());
        });

        const unsubscribeFromUnregister = walletsApi.on(
          'unregister',
          (unregisteredWallet) => {
            this.setWalletUnregistered(getRegisteredWallets(), unregisteredWallet);
          }
        );

        return () => {
          unsubscribeFromRegister();
          unsubscribeFromUnregister();
        };
      });

      // useWalletPropertiesChanged
      $effect(() => {
        const unsubscribeFromEvents = this.currentWallet?.features[
          'standard:events'
        ].on('change', ({ accounts }) => {
          // TODO: We should handle features changing that might make the list of wallets
          // or even the current wallet incompatible with the dApp.
          if (accounts) {
            this.updateWalletAccounts(accounts);
          }
        });

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
        const queryFn = untrack(() => async () => {
          if (!this.autoConnectEnabled) {
            return 'disabled';
          }

          if (
            !this.lastConnectedWalletName ||
            !this.lastConnectedAccountAddress ||
            this.isConnected
          ) {
            return 'attempted';
          }

          const wallet = this.wallets?.find?.(
            (wallet) =>
              getWalletUniqueIdentifier(wallet) === this.lastConnectedWalletName
          ) as any;
          // const wallet = wallets?.find?.(Boolean) as any;

          if (wallet) {
            await this.connectWallet({
              wallet,
              accountAddress: this.lastConnectedAccountAddress,
              silent: false
            });
          }

          return 'attempted';
        });

        if (this.autoConnectEnabled) {
          queryFn();
        }
      });
    });
  }

  #suiClient = $state({} as SuiClient);
  #autoConnectEnabled = $state(false);
  #wallets = $state([] as any);
  #accounts = $state([] as WalletAccount[]);
  #currentWallet = $state(null as WalletWithRequiredFeatures | null);
  #currentAccount = $state(null as WalletAccount | null);
  #lastConnectedAccountAddress = $state(null as string | null);
  #lastConnectedWalletName = $state(null as string | null);
  #connectionStatus = $state('disconnected' as WalletConnectionStatus);

  #isConnected = $derived(this.#connectionStatus === 'connected');
  #isConnecting = $derived(this.#connectionStatus === 'connecting');
  #isDisconnected = $derived(this.#connectionStatus === 'disconnected');

  setConnectionStatus = (status: WalletConnectionStatus) => {
    this.#connectionStatus = status;
  };

  setWalletConnected = (wallet, connectedAccounts, selectedAccounts) => {
    this.#accounts = connectedAccounts;
    this.#currentWallet = wallet;
    this.#currentAccount = selectedAccounts;
    this.#lastConnectedWalletName = getWalletUniqueIdentifier(wallet);
    this.#lastConnectedAccountAddress = selectedAccounts?.address;
    this.#connectionStatus = 'connected';
  };

  setWalletDisconnected = () => {
    this.#accounts = [];
    this.#currentWallet = null;
    this.#currentAccount = null;
    this.#lastConnectedWalletName = null;
    this.#lastConnectedAccountAddress = null;
    this.#connectionStatus = 'disconnected';
  };

  setAccountSwitched = (selectedAccount) => {
    this.#currentAccount = selectedAccount;
    this.#lastConnectedAccountAddress = selectedAccount?.address;
  };

  setWalletRegistered = (updatedWallets) => {
    this.#wallets = updatedWallets;
  };

  setWalletUnregistered = (updatedWallets, unregisteredWallet) => {
    if (unregisteredWallet === this.#currentWallet) {
      this.#wallets = updatedWallets;
      this.setWalletDisconnected();
    } else {
      this.#wallets = updatedWallets;
    }
  };

  updateWalletAccounts = (updatedAccounts) => {
    this.#accounts = updatedAccounts;
    this.#currentAccount =
      (this.#currentAccount &&
        updatedAccounts?.find?.(
          ({ address }) => address === this.#currentAccount?.address
        )) ||
      updatedAccounts?.[0];
  };

  // temporary testing fn (useAutoConnectWallet.ts -> useConnectWallet.ts)
  connectWallet = async ({
    wallet = this.wallets?.[0],
    accountAddress = this.lastConnectedAccountAddress,
    silent = false
  } = {}) => {
    console.log('accountAddress: ', accountAddress);
    console.log('lastConnectedAccountAddress: ', this.lastConnectedAccountAddress);

    try {
      this.setConnectionStatus('connecting');
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
        accountAddress || (this.lastConnectedAccountAddress as any)
      );

      this.setWalletConnected(wallet, connectedSuiAccounts, selectedAccount);

      return { accounts: connectedSuiAccounts };
    } catch (error) {
      this.setConnectionStatus('disconnected');
      throw error;
    }
  };

  disconnectWallet = async () => {
    if (!this.currentWallet) {
      throw new Error('No wallet is connected');
    }

    try {
      // Wallets aren't required to implement the disconnect feature, so we'll
      // optionally call the disconnect feature if it exists and reset the UI
      // state on the frontend at a minimum.
      await this.currentWallet.features['standard:disconnect']
        ?.disconnect()
        ?.then?.(() => {
          this.setWalletDisconnected();
        });
    } catch (error) {
      console.error(
        'Failed to disconnect the application from the current wallet.',
        error
      );
    }

    this.setWalletDisconnected();
  };

  signTransactionBlock = async (
    args: SignTransactionBlockArgs
  ): Promise<SignTransactionBlockResult> => {
    if (!this.currentWallet) {
      throw new Error('No wallet is connected.');
    }

    const signerAccount = args.account ?? this.currentAccount;
    if (!signerAccount) {
      throw new Error(
        'No wallet account is selected to sign the transaction block with.'
      );
    }

    const walletFeature = this.currentWallet.features['sui:signTransactionBlock'];
    if (!walletFeature) {
      throw new Error(
        "This wallet doesn't support the `SignTransactionBlock` feature."
      );
    }

    return await walletFeature.signTransactionBlock({
      transactionBlock: args.transactionBlock,
      account: signerAccount,
      chain: args.chain ?? signerAccount.chains[0]
    });
  };

  /**
   * @TODO Sui client integration with executeFromWallet prop
   */
  signAndExecuteTransactionBlock = async (
    args: SignAndExecuteTransactionBlockArgs,
    executeFromWallet: boolean = false
  ): Promise<SignAndExecuteTransactionBlockResult> => {
    if (!this.currentWallet) {
      throw new Error('No wallet is connected.');
    }

    const signerAccount = args.account ?? this.currentAccount;
    if (!signerAccount) {
      throw new Error(
        'No wallet account is selected to sign and execute the transaction block with.'
      );
    }

    if (executeFromWallet) {
      const walletFeature =
        this?.currentWallet?.features?.['sui:signAndExecuteTransactionBlock'];
      if (!walletFeature) {
        throw new Error(
          "This wallet doesn't support the `signAndExecuteTransactionBlock` feature."
        );
      }

      return walletFeature.signAndExecuteTransactionBlock({
        ...args,
        account: signerAccount,
        chain: args.chain ?? signerAccount.chains[0],
        requestType: args.requestType,
        options: args.options ?? {}
      });
    }

    const walletFeature = this?.currentWallet?.features?.['sui:signTransactionBlock'];
    if (!walletFeature) {
      throw new Error(
        "This wallet doesn't support the `signTransactionBlock` feature."
      );
    }

    const { signature, transactionBlockBytes } =
      await walletFeature.signTransactionBlock({
        ...args,
        account: signerAccount,
        chain: args.chain ?? signerAccount.chains[0]
      });

    return this.suiClient.executeTransactionBlock({
      transactionBlock: transactionBlockBytes,
      signature,
      requestType: args.requestType,
      options: args.options ?? {}
    });
  };

  signPersonalMessage = async (
    args: SignPersonalMessageArgs
  ): Promise<SignPersonalMessageResult> => {
    if (!this.currentWallet) {
      throw new Error('No wallet is connected.');
    }

    const signerAccount = args.account ?? this.currentAccount;
    if (!signerAccount) {
      throw new Error(
        'No wallet account is selected to sign the personal message with.'
      );
    }

    const signPersonalMessageFeature =
      this.currentWallet.features['sui:signPersonalMessage'];
    if (signPersonalMessageFeature) {
      return await signPersonalMessageFeature.signPersonalMessage({
        ...args,
        account: signerAccount
      });
    }

    // TODO: Remove this once we officially discontinue sui:signMessage in the wallet standard
    const signMessageFeature = this.currentWallet.features['sui:signMessage'];
    if (signMessageFeature) {
      console.warn(
        "This wallet doesn't support the `signPersonalMessage` feature... falling back to `signMessage`."
      );

      const { messageBytes, signature } = await signMessageFeature.signMessage({
        ...args,
        account: signerAccount
      });
      return { bytes: messageBytes, signature };
    }

    throw new Error("This wallet doesn't support the `signPersonalMessage` feature.");
  };

  get suiClient() {
    return this.#suiClient;
  }

  get autoConnectEnabled() {
    return this.#autoConnectEnabled;
  }

  get wallets() {
    return this.#wallets;
  }

  get accounts() {
    return this.#accounts;
  }

  get currentWallet() {
    return this.#currentWallet;
  }

  get currentAccount() {
    return this.#currentAccount;
  }

  get lastConnectedAccountAddress() {
    return this.#lastConnectedAccountAddress;
  }

  get lastConnectedWalletName() {
    return this.#lastConnectedWalletName;
  }

  get connectionStatus() {
    return this.#connectionStatus;
  }

  get isConnected() {
    return this.#isConnected;
  }

  get isConnecting() {
    return this.#isConnecting;
  }

  get isDisconnected() {
    return this.#isDisconnected;
  }
}

export const walletAdapter = new WalletAdapter();
