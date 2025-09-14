import type { WalletWithRequiredFeatures } from '@mysten/wallet-standard';
import { SLUSH_WALLET_NAME } from '@mysten/slush-wallet';

export const DEFAULT_STORAGE_KEY = 'sui-dapp-kit:wallet-connection-info';

export const DEFAULT_REQUIRED_FEATURES: (keyof WalletWithRequiredFeatures['features'])[] =
  ['sui:signTransactionBlock'];
export const DEFAULT_PREFERRED_WALLETS = [SLUSH_WALLET_NAME];
