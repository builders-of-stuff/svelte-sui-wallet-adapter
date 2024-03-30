import type {
  Wallet,
  WalletWithFeatures,
  MinimallyRequiredFeatures,
  WalletAccount
} from '@mysten/wallet-standard';
import { getWallets, isWalletWithRequiredFeatureSet } from '@mysten/wallet-standard';

import {
  DEFAULT_REQUIRED_FEATURES,
  SUI_WALLET_NAME
} from './wallet-adapter.constant.js';

export const getRegisteredWallets = (
  preferredWallets: string[] = [SUI_WALLET_NAME]
) => {
  const walletsApi = getWallets();
  const wallets = walletsApi.get();

  const suiWallets = wallets.filter(
    (wallet): wallet is WalletWithFeatures<MinimallyRequiredFeatures> =>
      isWalletWithRequiredFeatureSet(wallet, DEFAULT_REQUIRED_FEATURES)
  );

  return [
    // Preferred wallets, in order:
    ...(preferredWallets
      .map((name) => suiWallets.find((wallet) => wallet.name === name))
      .filter(Boolean) as WalletWithFeatures<MinimallyRequiredFeatures>[]),

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
  if (connectedAccounts?.length === 0) {
    return null;
  }

  if (accountAddress) {
    const selectedAccount = connectedAccounts?.find?.(
      (account) => account?.address === accountAddress
    );
    return selectedAccount ?? connectedAccounts?.[0];
  }

  return connectedAccounts?.[0];
}

export const logWalletAdapterState = (walletAdapter) => {
  const wallets = walletAdapter.wallets;
  const accounts = walletAdapter.accounts;
  const currentWallet = walletAdapter.currentWallet;
  const currentAccount = walletAdapter.currentAccount;
  const lastConnectedAccountAddress = walletAdapter.lastConnectedAccountAddress;
  const lastConnectedWalletName = walletAdapter.lastConnectedWalletName;
  const connectionStatus = walletAdapter.connectionStatus;
  const isConnected = walletAdapter.isConnected;
  const isConnecting = walletAdapter.isConnecting;
  const isDisconnected = walletAdapter.isDisconnected;

  console.log('');
  console.log('--Wallets');
  console.log(wallets);
  wallets.forEach((wallet) => {
    console.log(wallet.name);
  });

  console.log('');
  console.log('--Accounts');
  console.log(accounts);
  accounts.forEach((account) => {
    console.log(account.address);
  });

  console.log('');
  console.log('--Current wallet');
  console.log(currentWallet?.name);

  console.log('');
  console.log('--Current account');
  console.log(currentAccount?.address);

  console.log('');
  console.log('--Last connected account address');
  console.log(lastConnectedAccountAddress);

  console.log('');
  console.log('--Last connected wallet name');
  console.log(lastConnectedWalletName);

  console.log('');
  console.log('--Connection status');
  console.log(connectionStatus);

  console.log('');
  console.log('--Is connected');
  console.log(isConnected);

  console.log('');
  console.log('--Is connecting');
  console.log(isConnecting);

  console.log('');
  console.log('--Is disconnected');
  console.log(isDisconnected);
};
