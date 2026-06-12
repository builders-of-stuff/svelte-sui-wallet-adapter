import { SLUSH_WALLET_ICON, SLUSH_WALLET_NAME } from '@mysten/slush-wallet';

/**
 * Well-known Sui wallets shown with an install link when not detected.
 * `name` must match the name the wallet registers via the wallet standard,
 * so detected wallets de-dupe correctly.
 */
export type KnownWallet = {
  name: string;
  installUrl: string;
  icon?: string;
};

export const KNOWN_WALLETS: KnownWallet[] = [
  {
    name: SLUSH_WALLET_NAME,
    installUrl: 'https://slush.app',
    icon: SLUSH_WALLET_ICON
  },
  {
    name: 'Suiet',
    installUrl: 'https://suiet.app'
  },
  {
    name: 'Phantom',
    installUrl: 'https://phantom.com'
  },
  {
    name: 'OKX Wallet',
    installUrl: 'https://web3.okx.com'
  }
];
