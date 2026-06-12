import type {
  Wallet,
  WalletAccount,
  WalletWithRequiredFeatures
} from '@mysten/wallet-standard';
import { getWallets, isWalletWithRequiredFeatureSet } from '@mysten/wallet-standard';

import {
  DEFAULT_PREFERRED_WALLETS,
  SIGNING_FEATURES
} from './wallet-adapter.constant.js';
import type { WalletAdapter } from './wallet-adapter.type.js';

export const getRegisteredWallets = (
  preferredWallets: string[] = DEFAULT_PREFERRED_WALLETS
) => {
  const wallets = getWallets().get();

  const suiWallets = wallets.filter(
    (wallet): wallet is WalletWithRequiredFeatures =>
      isWalletWithRequiredFeatureSet(wallet) &&
      SIGNING_FEATURES.some((feature) => feature in wallet.features) &&
      wallet.chains.some((chain) => chain.startsWith('sui:'))
  );

  return [
    // Preferred wallets, in order:
    ...preferredWallets
      .map((name) => suiWallets.find((wallet) => wallet.name === name))
      .filter((wallet): wallet is WalletWithRequiredFeatures => !!wallet),

    // Wallets in default order:
    ...suiWallets.filter((wallet) => !preferredWallets.includes(wallet.name))
  ];
};

export function getWalletUniqueIdentifier(wallet: Wallet) {
  return wallet?.id ?? wallet?.name;
}

export function getSelectedAccount(
  connectedAccounts: readonly WalletAccount[],
  accountAddress?: string
) {
  if (!connectedAccounts?.length) {
    return null;
  }

  if (accountAddress) {
    const selectedAccount = connectedAccounts.find(
      (account) => account?.address === accountAddress
    );
    return selectedAccount ?? connectedAccounts[0];
  }

  return connectedAccounts[0];
}

export const logWalletAdapterState = (walletAdapter: WalletAdapter) => {
  console.log('');
  console.log('--Wallets');
  console.log(walletAdapter.wallets);
  walletAdapter.wallets.forEach((wallet) => {
    console.log(wallet.name);
  });

  console.log('');
  console.log('--Accounts');
  console.log(walletAdapter.accounts);
  walletAdapter.accounts.forEach((account) => {
    console.log(account.address);
  });

  console.log('');
  console.log('--Current wallet');
  console.log(walletAdapter.currentWallet?.name);

  console.log('');
  console.log('--Current account');
  console.log(walletAdapter.currentAccount?.address);

  console.log('');
  console.log('--Last connected account address');
  console.log(walletAdapter.lastConnectedAccountAddress);

  console.log('');
  console.log('--Last connected wallet name');
  console.log(walletAdapter.lastConnectedWalletName);

  console.log('');
  console.log('--Connection status');
  console.log(walletAdapter.connectionStatus);

  console.log('');
  console.log('--Supported intents');
  console.log(walletAdapter.supportedIntents);
};
