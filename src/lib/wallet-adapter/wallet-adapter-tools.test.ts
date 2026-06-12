import { describe, expect, it } from 'vitest';
import { getWallets } from '@mysten/wallet-standard';
import type { Wallet, WalletAccount } from '@mysten/wallet-standard';

import {
  getRegisteredWallets,
  getSelectedAccount,
  getWalletUniqueIdentifier
} from './wallet-adapter-tools.js';

const makeAccount = (address: string): WalletAccount => ({
  address,
  publicKey: new Uint8Array(),
  chains: ['sui:mainnet'],
  features: [],
  label: undefined,
  icon: undefined
});

const makeWallet = (
  name: string,
  features: string[],
  { id, chains = ['sui:mainnet'] }: { id?: string; chains?: string[] } = {}
): Wallet =>
  ({
    id,
    name,
    version: '1.0.0',
    icon: 'data:image/svg+xml;base64,',
    chains,
    accounts: [],
    features: Object.fromEntries(
      features.map((feature) => [feature, { version: '1.0.0' }])
    )
  }) as unknown as Wallet;

describe('getWalletUniqueIdentifier', () => {
  it('prefers id over name', () => {
    expect(
      getWalletUniqueIdentifier(makeWallet('Slush', [], { id: 'wallet-id' }))
    ).toBe('wallet-id');
    expect(getWalletUniqueIdentifier(makeWallet('Slush', []))).toBe('Slush');
  });
});

describe('getSelectedAccount', () => {
  const accounts = [makeAccount('0xaaa'), makeAccount('0xbbb')];

  it('returns null when no accounts are connected', () => {
    expect(getSelectedAccount([])).toBeNull();
  });

  it('returns the first account by default', () => {
    expect(getSelectedAccount(accounts)?.address).toBe('0xaaa');
  });

  it('returns the matching account for an address', () => {
    expect(getSelectedAccount(accounts, '0xbbb')?.address).toBe('0xbbb');
  });

  it('falls back to the first account for an unknown address', () => {
    expect(getSelectedAccount(accounts, '0xccc')?.address).toBe('0xaaa');
  });
});

describe('getRegisteredWallets', () => {
  it('filters out wallets without required and signing features', () => {
    const walletsApi = getWallets();

    const unregisterCallbacks = [
      // Fully capable wallet:
      walletsApi.register(
        makeWallet('Capable Wallet', [
          'standard:connect',
          'standard:events',
          'sui:signTransaction'
        ])
      ),
      // Legacy wallet (deprecated signing feature still accepted):
      walletsApi.register(
        makeWallet('Legacy Wallet', [
          'standard:connect',
          'standard:events',
          'sui:signTransactionBlock'
        ])
      ),
      // Missing signing features:
      walletsApi.register(
        makeWallet('View-Only Wallet', ['standard:connect', 'standard:events'])
      ),
      // Missing standard:events:
      walletsApi.register(
        makeWallet('Broken Wallet', ['standard:connect', 'sui:signTransaction'])
      ),
      // Not a Sui wallet:
      walletsApi.register(
        makeWallet(
          'Other Chain Wallet',
          ['standard:connect', 'standard:events', 'sui:signTransaction'],
          { chains: ['solana:mainnet'] }
        )
      )
    ];

    try {
      const names = getRegisteredWallets([]).map((wallet) => wallet.name);

      expect(names).toContain('Capable Wallet');
      expect(names).toContain('Legacy Wallet');
      expect(names).not.toContain('View-Only Wallet');
      expect(names).not.toContain('Broken Wallet');
      expect(names).not.toContain('Other Chain Wallet');
    } finally {
      unregisterCallbacks.forEach((unregister) => unregister());
    }
  });

  it('orders preferred wallets first', () => {
    const walletsApi = getWallets();
    const features = ['standard:connect', 'standard:events', 'sui:signTransaction'];

    const unregisterCallbacks = [
      walletsApi.register(makeWallet('Alpha', features)),
      walletsApi.register(makeWallet('Beta', features))
    ];

    try {
      const names = getRegisteredWallets(['Beta']).map((wallet) => wallet.name);

      expect(names.indexOf('Beta')).toBeLessThan(names.indexOf('Alpha'));
    } finally {
      unregisterCallbacks.forEach((unregister) => unregister());
    }
  });
});
