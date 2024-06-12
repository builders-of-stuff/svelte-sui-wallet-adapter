import type { SuiClient, SuiTransactionBlockResponse } from '@mysten/sui/client';
import type {
  Wallet,
  WalletAccount,
  WalletWithRequiredFeatures,
  SuiSignAndExecuteTransactionBlockInput,
  SuiSignAndExecuteTransactionBlockOutput,
  SuiSignPersonalMessageInput,
  SuiSignPersonalMessageOutput,
  SuiSignTransactionBlockInput,
  SuiSignTransactionBlockOutput
} from '@mysten/wallet-standard';

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export type SignTransactionBlockArgs = PartialBy<
  SuiSignTransactionBlockInput,
  'account' | 'chain'
>;

export type SignAndExecuteTransactionBlockArgs = PartialBy<
  SuiSignAndExecuteTransactionBlockInput,
  'account' | 'chain'
>;

export type SignPersonalMessageArgs = PartialBy<SuiSignPersonalMessageInput, 'account'>;

export type SignTransactionBlockResult = SuiSignTransactionBlockOutput;
export type SignAndExecuteTransactionBlockResult =
  SuiSignAndExecuteTransactionBlockOutput;
export type SignPersonalMessageResult = SuiSignPersonalMessageOutput;

export type WalletConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export type WalletAdapterActions = {
  setAccountSwitched: (selectedAccount: WalletAccount) => void;
  setConnectionStatus: (connectionStatus: WalletConnectionStatus) => void;
  setWalletConnected: (
    wallet: WalletWithRequiredFeatures,
    connectedAccounts: readonly WalletAccount[],
    selectedAccount: WalletAccount | null
  ) => void;
  updateWalletAccounts: (accounts: readonly WalletAccount[]) => void;
  setWalletDisconnected: () => void;
  setWalletRegistered: (updatedWallets: WalletWithRequiredFeatures[]) => void;
  setWalletUnregistered: (
    updatedWallets: WalletWithRequiredFeatures[],
    unregisteredWallet: Wallet
  ) => void;
  signTransactionBlock: (
    args: SignTransactionBlockArgs
  ) => Promise<SignTransactionBlockResult>;
  signAndExecuteTransactionBlock: (
    args: SignAndExecuteTransactionBlockArgs
  ) => Promise<SuiTransactionBlockResponse>;
  signPersonalMessage: (
    args: SignPersonalMessageArgs
  ) => Promise<SignPersonalMessageResult>;
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
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  // temporary testing only?
  connectWallet: any;
  disconnectWallet: any;
} & WalletAdapterActions;
