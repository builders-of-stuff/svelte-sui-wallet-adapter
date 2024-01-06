import type {
  Wallet,
  WalletWithFeatures,
  MinimallyRequiredFeatures,
  WalletAccount
} from '@mysten/wallet-standard';
import { getWallets, isWalletWithRequiredFeatureSet } from '@mysten/wallet-standard';

import { DEFAULT_REQUIRED_FEATURES, SUI_WALLET_NAME } from './wallet.constant.js';

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
