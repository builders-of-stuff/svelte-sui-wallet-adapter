import type {
  Wallet,
  WalletAccount,
  WalletWithRequiredFeatures
} from '@mysten/wallet-standard';

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
};

export type WalletAdapter = {
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
