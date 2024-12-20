# Svelte Sui Wallet Adapter

A Sui wallet adapter for use with sveltekit and svelte 5.

Requires `tailwindcss`

## Getting started

```
npm install @builders-of-stuff/svelte-sui-wallet-adapter
npx @svelte-add/tailwindcss@latest
npm install bits-ui
npm install svelte-radix
npx shadcn-svelte@latest init
```

```
// tailwind.css.ts

const config = {
...
content: [
	'./src/**/*.{html,js,svelte,ts}',
	'./node_modules/@builders-of-stuff/svelte-sui-wallet-adapter/**/*.{html,js,svelte,ts}'
],
...
}
```

```
// +page.svelte

<script lang="ts">
	import { ConnectButton, walletAdapter } from '@builders-of-stuff/svelte-sui-wallet-adapter';
</script>


<ConnectButton {walletAdapter} />
```

## Current known issues

- No local storage persistance
- Switching wallets seems broken (must manually disconnect from app within wallet before connecting another account with same wallet — wallet thing?)
- Client-side only, probably doesn't work with ssr

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev
```

Everything inside `src/lib` is part of the library, everything inside `src/routes` can be used as a showcase or preview app.
