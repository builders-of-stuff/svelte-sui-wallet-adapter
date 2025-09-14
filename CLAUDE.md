# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Sui wallet adapter library for SvelteKit and Svelte 5, providing wallet connection and transaction functionality. The library is built as an npm package that integrates with the Mysten Labs wallet standard.

## Common Commands

### Development
- `npm run dev` - Start development server for the example app
- `npm run build` - Build the library and package it
- `npm run package` - Package the library for distribution (runs `svelte-kit sync && svelte-package && publint`)

### Code Quality
- `npm run lint` - Run prettier and eslint checks
- `npm run format` - Format code with prettier
- `npm run check` - Run svelte-check for TypeScript validation
- `npm run check:watch` - Run svelte-check in watch mode

### Testing
- `npm test` - Run all tests (integration + unit)
- `npm run test:unit` - Run unit tests with vitest
- `npm run test:integration` - Run Playwright integration tests

### Preview
- `npm run preview` - Preview the built application

## Architecture

### Core Library Structure
- **`src/lib/`** - Main library code
  - **`wallet-adapter/`** - Core wallet adapter functionality
    - `wallet-adapter.svelte.ts` - Main wallet adapter implementation using Svelte 5 runes
    - `wallet-adapter.type.ts` - TypeScript types and interfaces
    - `wallet-adapter.constant.ts` - Constants and default values
    - `wallet-adapter-tools.ts` - Utility functions
  - **`components/`** - Svelte components for UI
    - `connect-button/` - Wallet connection button
    - `connect-modal/` - Wallet selection modal
    - `account-dropdown-menu/` - Account management dropdown
    - `ui/` - Reusable UI components (shadcn-svelte based)

### Key Components
- **WalletAdapter** - Central state management for wallet connections using Svelte 5 runes
- **ConnectButton** - Primary UI component for wallet connection
- **ConnectModal** - Modal for wallet selection and connection flow

### Example/Demo App
- **`src/routes/`** - Example SvelteKit app demonstrating usage
- All routes serve as testing/showcase for the library functionality

### Dependencies
- Built on **Mysten Labs Sui SDK** (`@mysten/sui`, `@mysten/wallet-standard`)
- Uses **SvelteKit** for packaging and **Svelte 5** with runes for reactivity
- Styled with **Tailwind CSS** and **shadcn-svelte** components
- Requires `tailwindcss`, `bits-ui`, and `svelte-radix` as peer dependencies

### Network Configuration
The adapter supports multiple Sui networks via pre-configured instances:
- `walletAdapter` - Mainnet (default)
- `devnetWalletAdapter` - Devnet
- `testnetWalletAdapter` - Testnet  
- `localnetWalletAdapter` - Localnet

### Known Issues (from README)
- No local storage persistence
- Wallet switching issues (manual disconnect required)
- Client-side only, SSR not supported

## Development Notes
- Library code lives in `src/lib/` - everything else is for examples/showcase
- The project uses SvelteKit's library packaging system
- Tailwind content path must include the library: `./node_modules/@builders-of-stuff/svelte-sui-wallet-adapter/**/*.{html,js,svelte,ts}`