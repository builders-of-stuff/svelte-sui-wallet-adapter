# 3.0.1 (2026-07-10)

- `signAndExecuteTransaction` now signs in the wallet and executes via the
  adapter's gRPC client whenever the wallet supports signing — the result
  carries the full data set (`events`, `balanceChanges`, `objectTypes`),
  which wallet-side execution cannot return.
- Wallet-side execution remains only as a fallback for wallets that cannot
  sign without executing, and only through the modern
  `sui:signAndExecuteTransaction` feature. The legacy
  `signAndExecuteTransactionBlock` shim is no longer reachable — it crashes
  on wallets whose responses omit the raw transaction
  (`Cannot read properties of undefined (reading 'txSignatures')`).

# 3.0.0 (2026-07-08)

- Major overhaul: `@mysten/sui` v2 (`SuiGrpcClient`) replaces the v1
  JSON-RPC client; `signAndExecuteTransaction`/`executeTransaction` return
  the v2 `TransactionResult` tagged union.
- Zero UI peer dependencies — components ship scoped styles, themeable via
  `--sswa-*` CSS custom properties with automatic light/dark
  (`light-dark()`).
- Enoki zkLogin wallet support (`enokiWallets`: Google/Facebook/Twitch
  sign-in in the connect modal) alongside Slush.
- Requires Node >= 22.

# 2.1.0 (2025-09-26)

- Add `registerSlushWallet` support

# 1.1.4 (2025-01-23)

- Upgrade dependencies
- Fix `formatAddress` bug

# 1.1.3 (2024-10-28)

- Upgrade `svelte` and `shadcn-svelte` dependencies to support `svelte 5`.

# 1.1.0 (2024-09-08)

- Update `executeTransaction` to return `effects`, `objectChanges`, `events`, `timestampMs`, and `transaction` properties
