/**
 * Connection persistence, modeled on @mysten/dapp-kit-core's storage layer.
 *
 * The stored value is `${walletId}:${address}:${intent1,intent2}` where any ':'
 * in the wallet id is replaced with '_' so the value can be split safely.
 */
export type StateStorage = {
  getItem(name: string): string | null | Promise<string | null>;
  setItem(name: string, value: string): unknown | Promise<unknown>;
  removeItem(name: string): unknown | Promise<unknown>;
};

export type SavedWalletAccount = {
  /** Sanitized wallet identifier (':' replaced with '_'). Compare via `sanitizeWalletId`. */
  walletId: string;
  address: string;
  supportedIntents: string[] | null;
};

export function createInMemoryStorage(): StateStorage {
  const store = new Map<string, string>();

  return {
    getItem(name) {
      return store.get(name) ?? null;
    },
    setItem(name, value) {
      store.set(name, value);
    },
    removeItem(name) {
      store.delete(name);
    }
  };
}

/**
 * Returns localStorage when it is available and writable, otherwise an
 * in-memory fallback (SSR, private browsing with storage disabled, etc).
 */
export function getDefaultStorage(): StateStorage {
  try {
    const testKey = 'svelte-sui-wallet-adapter:test';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return localStorage;
  } catch {
    return createInMemoryStorage();
  }
}

export function sanitizeWalletId(walletId: string) {
  return walletId.replaceAll(':', '_');
}

export function saveAccountToStorage(
  storage: StateStorage,
  storageKey: string,
  walletId: string,
  address: string,
  supportedIntents: string[]
) {
  try {
    storage.setItem(
      storageKey,
      `${sanitizeWalletId(walletId)}:${address}:${supportedIntents.join(',')}`
    );
  } catch (error) {
    console.warn('Failed to persist wallet connection info:', error);
  }
}

export async function readAccountFromStorage(
  storage: StateStorage,
  storageKey: string
): Promise<SavedWalletAccount | null> {
  try {
    const saved = await storage.getItem(storageKey);
    if (!saved) {
      return null;
    }

    const [walletId, address, intents] = saved.split(':');
    if (!walletId || !address) {
      return null;
    }

    return {
      walletId,
      address,
      supportedIntents: intents != null && intents !== '' ? intents.split(',') : null
    };
  } catch (error) {
    console.warn('Failed to read wallet connection info:', error);
    return null;
  }
}

export function clearAccountFromStorage(storage: StateStorage, storageKey: string) {
  try {
    storage.removeItem(storageKey);
  } catch (error) {
    console.warn('Failed to clear wallet connection info:', error);
  }
}
