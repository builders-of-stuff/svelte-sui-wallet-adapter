# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Sui wallet adapter library for SvelteKit and Svelte 5, providing wallet connection and transaction functionality. The library is built as an npm package that integrates with the Mysten Labs wallet standard. It is dependency-light by design: components ship their own scoped styles (no Tailwind/shadcn requirement for consumers).

## Common Commands

### Development

- `pnpm dev` - Start development server for the example app
- `pnpm build` - Build the library and package it
- `pnpm package` - Package the library for distribution (runs `svelte-kit sync && svelte-package && publint`)

### Code Quality

- `pnpm lint` - Run prettier and eslint checks
- `pnpm format` - Format code with prettier
- `pnpm check` - Run svelte-check for TypeScript validation
- `pnpm check:watch` - Run svelte-check in watch mode

### Testing

- `pnpm test` - Run all tests (integration + unit)
- `pnpm test:unit` - Run unit tests with vitest
- `pnpm test:integration` - Run Playwright integration tests

### Preview

- `pnpm preview` - Preview the built application

## Architecture

### Core Library Structure

- **`src/lib/`** - Main library code
  - **`wallet-adapter/`** - Core wallet adapter functionality
    - `wallet-adapter.svelte.ts` - Main wallet adapter implementation using Svelte 5 runes
    - `wallet-adapter.type.ts` - TypeScript types and interfaces
    - `wallet-adapter.constant.ts` - Constants (gRPC fullnode + GraphQL endpoint URLs, storage key, feature requirements)
    - `wallet-adapter-tools.ts` - Utility functions (wallet filtering/ordering, account selection)
    - `wallet-adapter-storage.ts` - localStorage persistence for auto-connect (SSR-safe)
  - **`components/`** - Svelte components for UI (scoped CSS, themeable via `--sswa-*` custom properties)
    - `connect-button/` - Wallet connection button (modal when disconnected, dropdown when connected)
    - `connect-modal/` - Wallet selection modal (wallet list, connecting/error views, install links for undetected wallets, "what is a wallet" info) + `wallet-registry.ts` (known wallets and install URLs)
    - `account-dropdown-menu/` - Account management dropdown (switch account, copy address, switch wallet, disconnect)
    - `primitives/` - Internal zero-dependency primitives (`modal/` native `<dialog>`, `dropdown/` CSS-positioned menu, `base-button/`)

### Key Components

- **WalletAdapter** - Central state management for wallet connections using Svelte 5 runes; created via `createWalletAdapter({ network, baseUrl, autoConnect, storage, storageKey, preferredWallets, slushWallet, enokiWallets })`
- **ConnectButton** - Primary UI component for wallet connection
- **ConnectModal** - Modal for wallet selection and connection flow

### Example/Demo App

- **`src/routes/`** - Example SvelteKit app demonstrating usage
- All routes serve as testing/showcase for the library functionality
- The demo app uses Tailwind (devDependency only); the library itself does NOT use Tailwind

### Dependencies

- Built on **Mysten Labs Sui SDK** (`@mysten/sui` v2, `@mysten/wallet-standard`, `@mysten/slush-wallet`, `@mysten/enoki` for zkLogin wallets)
- `walletAdapter.suiClient` is a **SuiGrpcClient** (`@mysten/sui/grpc`); chain data access goes through `suiClient.core.*` (the JSON-RPC client is deprecated upstream)
- Uses **SvelteKit** for packaging and **Svelte 5** with runes for reactivity
- Only peer dependency: `svelte ^5`
- Node >= 22 required (inherited from `@mysten/sui` v2)

### Network Configuration

The adapter supports multiple Sui networks via pre-configured instances:

- `walletAdapter` - Mainnet (default)
- `devnetWalletAdapter` - Devnet
- `testnetWalletAdapter` - Testnet
- `localnetWalletAdapter` - Localnet

gRPC fullnode URLs are hardcoded in `wallet-adapter.constant.ts` (no `getFullnodeUrl` equivalent exists for gRPC); override with the `baseUrl` option.

### Persistence & Auto-Connect

- Last connected wallet/account/intents persist to localStorage (`wallet-adapter-storage.ts`); pre-built non-mainnet instances suffix the storage key per network
- `autoConnect` defaults to `true`; reconnects silently when the saved wallet registers

### Known Issues (from README)

- Client-side only, SSR not supported

## Development Notes

- Library code lives in `src/lib/` - everything else is for examples/showcase
- The project uses SvelteKit's library packaging system
- Component styling convention: scoped `<style>` blocks, class names prefixed `sswa-`, theme tokens `var(--sswa-*, fallback)` with `light-dark()` fallbacks for automatic dark mode
- File/folder naming: kebab-case, `component-name/component-name.svelte`
