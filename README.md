# Svelte Sui Wallet Adapter

A Sui wallet adapter for use with sveltekit and svelte 5.

Requires `tailwindcss` and `shadcn-svelte`

NOT tested

NOT ready for production

Currently hard-coded for devnet, and for Sui wallet

## Getting started

```
npm install @builders-of-stuff/svelte-sui-wallet-adapter
npm install bits-ui
npx @svelte-add/tailwindcss@latest
npx shadcn-svelte@latest init
npx shadcn-svelte@latest add button
npx shadcn-svelte@latest add dialog
npx shadcn-svelte@latest add dropdown-menu
```

```
// ../+page.svelte
<script lang="ts">
	import { ConnectButton, walletAdapter } from '@builders-of-stuff/svelte-sui-wallet-adapter';
</script>


<ConnectButton {walletAdapter} />
```

## Examples (old)

https://github.com/KTruong008/sui-svelte-playground

https://youtu.be/Z__tHvS4Kdo

## Current known issues

- Hard-coded for devnet

- Switching wallets seems broken

- No local storage persistance

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

Everything inside `src/lib` is part of your library, everything inside `src/routes` can be used as a showcase or preview app.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## Publishing

```bash
npm publish
```
