import type { SuiGrpcClient } from '@mysten/sui/grpc';
import type { CoreClient, SuiClientTypes } from '@mysten/sui/client';
import type { Transaction } from '@mysten/sui/transactions';
import type {
  WalletAccount,
  WalletWithRequiredFeatures,
  SuiSignTransactionInput,
  SuiSignPersonalMessageInput,
  SuiSignPersonalMessageOutput,
  SignedTransaction
} from '@mysten/wallet-standard';

import type { RegisterEnokiWalletsOptions } from '@mysten/enoki';

import type { StateStorage } from './wallet-adapter-storage.js';

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export type SuiNetwork = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

export interface SlushWalletConfig {
  name: string;
  origin?: string;
  metadataApiUrl?: string;
}

/**
 * Enoki zkLogin wallets ("Sign in with Google" etc.). The adapter supplies the
 * client and network; everything else mirrors @mysten/enoki's
 * registerEnokiWallets options. Requires an Enoki public API key
 * (https://portal.enoki.mystenlabs.com). Not available on localnet.
 */
export type EnokiWalletsConfig = Pick<
  RegisterEnokiWalletsOptions,
  'apiKey' | 'apiUrl' | 'providers' | 'windowFeatures' | 'additionalEpochs'
>;

export interface CreateWalletAdapterOptions {
  /** Network the adapter's SuiGrpcClient talks to and signs against. Defaults to 'mainnet'. */
  network?: SuiNetwork;
  /** gRPC fullnode URL. Defaults to the public fullnode for `network`. */
  baseUrl?: string;
  /** Reconnect to the last used wallet/account on page load. Defaults to true. */
  autoConnect?: boolean;
  /** Where the last connection is persisted. Defaults to localStorage (in-memory on SSR). */
  storage?: StateStorage;
  storageKey?: string;
  /** Wallet names to order first in the wallet list. */
  preferredWallets?: string[];
  /** Register the Slush web wallet under this app name. */
  slushWallet?: SlushWalletConfig;
  /** Register Enoki zkLogin wallets (Google/Facebook/Twitch social login). */
  enokiWallets?: EnokiWalletsConfig;
}

/**
 * Args
 */
export type ConnectWalletArgs = {
  wallet?: WalletWithRequiredFeatures;
  accountAddress?: string | null;
  silent?: boolean;
};

export type SignTransactionArgs = PartialBy<
  Omit<SuiSignTransactionInput, 'transaction'>,
  'account' | 'chain'
>;

export type SignAndExecuteTransactionArgs = PartialBy<
  Omit<SuiSignTransactionInput, 'transaction'>,
  'account' | 'chain'
> & {
  transaction: Transaction | string;
  /** Override how the signed transaction is executed (defaults to the adapter's gRPC client). */
  execute?: ({
    bytes,
    signature
  }: {
    bytes: string;
    signature: string;
  }) => Promise<ExecuteTransactionResult>;
};

export type SignPersonalMessageArgs = PartialBy<SuiSignPersonalMessageInput, 'account'>;

/**
 * Results
 */
export type SignTransactionResult = SignedTransaction;

export type ExecuteTransactionResult = SuiClientTypes.TransactionResult<{
  balanceChanges: true;
  effects: true;
  events: true;
  objectTypes: true;
}>;

/**
 * When the wallet executes the transaction itself (sui:signAndExecuteTransaction),
 * only `effects` is guaranteed. Use `waitForTransaction` with an `include` for
 * events/balanceChanges/objectTypes.
 */
export type SignAndExecuteTransactionResult = SuiClientTypes.TransactionResult<{
  effects: true;
}>;

export type SignPersonalMessageResult = SuiSignPersonalMessageOutput;

export type WalletConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'reconnecting'
  | 'connected';

export type WalletAdapterActions = {
  connectWallet: (
    args?: ConnectWalletArgs
  ) => Promise<{ accounts: readonly WalletAccount[] }>;
  disconnectWallet: () => Promise<void>;
  switchAccount: (account: WalletAccount) => Promise<void>;
  switchWallet: (
    wallet: WalletWithRequiredFeatures
  ) => Promise<{ accounts: readonly WalletAccount[] }>;
  signTransaction: (
    transaction: Transaction | string,
    args?: SignTransactionArgs
  ) => Promise<SignTransactionResult>;
  signAndExecuteTransaction: (
    args: SignAndExecuteTransactionArgs
  ) => Promise<SignAndExecuteTransactionResult>;
  executeTransaction: (args: {
    bytes: string;
    signature: string;
  }) => Promise<ExecuteTransactionResult>;
  waitForTransaction: CoreClient['waitForTransaction'];
  signPersonalMessage: (
    args: SignPersonalMessageArgs
  ) => Promise<SignPersonalMessageResult>;
};

export type WalletAdapter = {
  suiClient: SuiGrpcClient;
  network: SuiNetwork;
  autoConnectEnabled: boolean;
  wallets: WalletWithRequiredFeatures[];
  accounts: readonly WalletAccount[];
  currentWallet: WalletWithRequiredFeatures | null;
  currentAccount: WalletAccount | null;
  lastConnectedAccountAddress: string | null;
  lastConnectedWalletName: string | null;
  connectionStatus: WalletConnectionStatus;
  supportedIntents: string[];
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  isDisconnected: boolean;
} & WalletAdapterActions;
