import { describe, expect, it } from 'vitest';

import {
  clearAccountFromStorage,
  createInMemoryStorage,
  readAccountFromStorage,
  sanitizeWalletId,
  saveAccountToStorage
} from './wallet-adapter-storage.js';

const STORAGE_KEY = 'test:storage-key';

describe('wallet-adapter-storage', () => {
  it('round-trips a saved account', async () => {
    const storage = createInMemoryStorage();

    saveAccountToStorage(storage, STORAGE_KEY, 'Slush', '0xabc', [
      'intent-one',
      'intent-two'
    ]);

    const saved = await readAccountFromStorage(storage, STORAGE_KEY);

    expect(saved).toEqual({
      walletId: 'Slush',
      address: '0xabc',
      supportedIntents: ['intent-one', 'intent-two']
    });
  });

  it('sanitizes wallet ids containing colons', async () => {
    const storage = createInMemoryStorage();

    saveAccountToStorage(storage, STORAGE_KEY, 'com.example:wallet', '0xabc', []);

    const saved = await readAccountFromStorage(storage, STORAGE_KEY);

    expect(saved?.walletId).toBe('com.example_wallet');
    expect(saved?.walletId).toBe(sanitizeWalletId('com.example:wallet'));
    expect(saved?.address).toBe('0xabc');
  });

  it('returns null supportedIntents when none were saved', async () => {
    const storage = createInMemoryStorage();

    saveAccountToStorage(storage, STORAGE_KEY, 'Slush', '0xabc', []);

    const saved = await readAccountFromStorage(storage, STORAGE_KEY);

    expect(saved?.supportedIntents).toBeNull();
  });

  it('returns null when nothing is stored', async () => {
    const storage = createInMemoryStorage();

    expect(await readAccountFromStorage(storage, STORAGE_KEY)).toBeNull();
  });

  it('returns null for malformed values', async () => {
    const storage = createInMemoryStorage();

    storage.setItem(STORAGE_KEY, 'garbage');
    expect(await readAccountFromStorage(storage, STORAGE_KEY)).toBeNull();

    storage.setItem(STORAGE_KEY, ':missing-wallet-id');
    expect(await readAccountFromStorage(storage, STORAGE_KEY)).toBeNull();
  });

  it('returns null when storage throws', async () => {
    const throwingStorage = {
      getItem() {
        throw new Error('denied');
      },
      setItem() {
        throw new Error('denied');
      },
      removeItem() {
        throw new Error('denied');
      }
    };

    expect(await readAccountFromStorage(throwingStorage, STORAGE_KEY)).toBeNull();
    // save/clear should swallow rather than throw
    expect(() =>
      saveAccountToStorage(throwingStorage, STORAGE_KEY, 'Slush', '0xabc', [])
    ).not.toThrow();
    expect(() => clearAccountFromStorage(throwingStorage, STORAGE_KEY)).not.toThrow();
  });

  it('supports async storage backends', async () => {
    const backing = new Map<string, string>();
    const asyncStorage = {
      getItem: async (name: string) => backing.get(name) ?? null,
      setItem: async (name: string, value: string) => {
        backing.set(name, value);
      },
      removeItem: async (name: string) => {
        backing.delete(name);
      }
    };

    saveAccountToStorage(asyncStorage, STORAGE_KEY, 'Slush', '0xabc', ['intent']);
    // saveAccountToStorage is fire-and-forget; let the microtask settle
    await Promise.resolve();

    const saved = await readAccountFromStorage(asyncStorage, STORAGE_KEY);
    expect(saved?.address).toBe('0xabc');

    clearAccountFromStorage(asyncStorage, STORAGE_KEY);
    await Promise.resolve();
    expect(await readAccountFromStorage(asyncStorage, STORAGE_KEY)).toBeNull();
  });

  it('clears the saved account', async () => {
    const storage = createInMemoryStorage();

    saveAccountToStorage(storage, STORAGE_KEY, 'Slush', '0xabc', []);
    clearAccountFromStorage(storage, STORAGE_KEY);

    expect(await readAccountFromStorage(storage, STORAGE_KEY)).toBeNull();
  });
});
