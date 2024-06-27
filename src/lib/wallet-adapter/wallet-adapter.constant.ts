import type { WalletWithRequiredFeatures } from '@mysten/wallet-standard';

export const DEFAULT_STORAGE_KEY = 'sui-dapp-kit:wallet-connection-info';
export const SUI_WALLET_NAME = 'Sui Wallet';
export const DEFAULT_REQUIRED_FEATURES: (keyof WalletWithRequiredFeatures['features'])[] =
  ['sui:signTransactionBlock'];
export const DEFAULT_PREFERRED_WALLETS = [SUI_WALLET_NAME];
