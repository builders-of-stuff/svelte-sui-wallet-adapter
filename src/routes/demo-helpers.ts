import { Transaction } from '@mysten/sui/transactions';
import { toBase64, formatAddress } from '@mysten/sui/utils';

/**
 * gRPC client results contain bigint (JSON.stringify throws) and Uint8Array
 * (stringifies as an index map), so both need a replacer.
 */
export function safeStringify(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, v) => {
      if (typeof v === 'bigint') return v.toString();
      if (v instanceof Uint8Array) return `base64:${toBase64(v)}`;
      return v;
    },
    2
  );
}

export const shortAddress = (address: string) => formatAddress(address);

/** Network-agnostic demo transaction: send 1 MIST to yourself. */
export function buildSelfTransferTransaction(address: string) {
  const tx = new Transaction();
  const [coin] = tx.splitCoins(tx.gas, [1]);
  tx.transferObjects([coin], address);
  return tx;
}

/** Raw GraphQL demo query: SUI balance, all balances, first owned objects. */
export const ADDRESS_QUERY = `
query ($address: SuiAddress!) {
  address(address: $address) {
    balance(coinType: "0x2::sui::SUI") {
      totalBalance
    }
    balances(first: 10) {
      nodes {
        coinType { repr }
        totalBalance
      }
    }
    objects(first: 10) {
      nodes {
        address
        contents { type { repr } }
      }
    }
  }
}`;

/**
 * Live theming presets applied as inline CSS custom properties.
 *
 * Secondary tokens are overridden too: when connected, the ConnectButton shows
 * the account dropdown trigger, which is styled with --sswa-secondary*.
 */
export const THEME_PRESETS = {
  default: { label: 'Sui default', style: '' },
  emerald: {
    label: 'Emerald pill',
    style: [
      '--sswa-primary:#10b981',
      '--sswa-ring:#10b981',
      '--sswa-secondary:color-mix(in srgb, #10b981 15%, transparent)',
      '--sswa-secondary-foreground:#10b981',
      '--sswa-radius:9999px'
    ].join('; ')
  },
  violet: {
    label: 'Violet square',
    style: [
      '--sswa-primary:#8b5cf6',
      '--sswa-ring:#8b5cf6',
      '--sswa-secondary:color-mix(in srgb, #8b5cf6 15%, transparent)',
      '--sswa-secondary-foreground:#8b5cf6',
      '--sswa-radius:0.125rem'
    ].join('; ')
  }
} as const;

export type ThemePreset = keyof typeof THEME_PRESETS;
