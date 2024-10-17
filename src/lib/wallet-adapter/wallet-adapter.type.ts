import type { SuiClient, SuiTransactionBlockResponse } from '@mysten/sui/client';
import type { Transaction } from '@mysten/sui/transactions';
import type {
  Wallet,
  WalletAccount,
  WalletWithRequiredFeatures,
  SuiSignAndExecuteTransactionBlockInput,
  SuiSignAndExecuteTransactionBlockOutput,
  SuiSignPersonalMessageInput,
  SuiSignPersonalMessageOutput,
  SuiSignTransactionBlockInput,
  SuiSignTransactionBlockOutput,
  SuiSignTransactionInput,
  SignedTransaction,
  SuiReportTransactionEffectsInput,
  SuiSignAndExecuteTransactionInput,
  SuiSignAndExecuteTransactionOutput
} from '@mysten/wallet-standard';

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<T>;

/**
 * Args
 */
export type ReportTransactionEffectsArgs = Omit<
  PartialBy<SuiReportTransactionEffectsInput, 'account' | 'chain'>,
  'effects'
> & {
  effects: string | number[];
};

export type SignTransactionArgs = PartialBy<
  Omit<SuiSignTransactionInput, 'transaction'>,
  'account' | 'chain'
>;

export type SignTransactionBlockArgs = PartialBy<
  SuiSignTransactionBlockInput,
  'account' | 'chain'
>;

export type SignAndExecuteTransactionArgs = PartialBy<
  Omit<SuiSignAndExecuteTransactionInput, 'transaction'>,
  'account' | 'chain'
> & {
  transaction: Transaction | string;
  execute?: ({
    bytes,
    signature
  }: {
    bytes: string;
    signature: string;
  }) => Promise<any>;
};

export type SignAndExecuteTransactionBlockArgs = PartialBy<
  SuiSignAndExecuteTransactionBlockInput,
  'account' | 'chain'
>;

export type SignPersonalMessageArgs = PartialBy<SuiSignPersonalMessageInput, 'account'>;

/**
 * Results
 */
export interface SignTransactionResult extends SignedTransaction {
  reportTransactionEffects: (effects: string) => void;
}

// export type ExecuteTransactionResult =
//   | {
//       digest: string;
//       rawEffects?: number[];
//     }
//   | {
//       effects?: {
//         bcs?: string;
//       };
//     };
export type ExecuteTransactionResult = any;

export type SignTransactionBlockResult = SuiSignTransactionBlockOutput;

export type SignAndExecuteTransactionResult = SuiSignAndExecuteTransactionOutput;

export type SignAndExecuteTransactionBlockResult =
  SuiSignAndExecuteTransactionBlockOutput;

export type SignPersonalMessageResult = SuiSignPersonalMessageOutput;

export type WalletConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export type WalletAdapterActions = {
  connectWallet: any;
  disconnectWallet: any;
  updateWalletAccounts: (accounts: readonly WalletAccount[]) => void;
  setWalletRegistered: (updatedWallets: WalletWithRequiredFeatures[]) => void;
  setWalletUnregistered: (
    updatedWallets: WalletWithRequiredFeatures[],
    unregisteredWallet: Wallet
  ) => void;
  reportTransactionEffects: (args: ReportTransactionEffectsArgs) => void;
  signTransaction: (
    transaction: Transaction | string,
    args: SignTransactionArgs
  ) => Promise<SignTransactionResult>;
  signAndExecuteTransaction: (
    args: SignAndExecuteTransactionArgs
  ) => Promise<SignAndExecuteTransactionResult>;
  signPersonalMessage: (
    args: SignPersonalMessageArgs
  ) => Promise<SignPersonalMessageResult>;
  switchAccount: (account: WalletAccount) => void;
  // Deprecated functions
  signTransactionBlock: (
    args: SignTransactionBlockArgs
  ) => Promise<SignTransactionBlockResult>;
  signAndExecuteTransactionBlock: (
    args: SignAndExecuteTransactionBlockArgs
  ) => Promise<SuiTransactionBlockResponse>;
  executeTransaction: (args: {
    bytes: string;
    signature: string;
  }) => Promise<ExecuteTransactionResult>;
};

export type WalletAdapter = {
  suiClient: SuiClient;
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
  isDisconnected: boolean;
} & WalletAdapterActions;
