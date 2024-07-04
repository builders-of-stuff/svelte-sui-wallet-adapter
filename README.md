# Svelte Sui Wallet Adapter

A Sui wallet adapter for use with sveltekit and svelte 5.

Requires `tailwindcss`

NOT tested

NOT ready for production

Currently hard-coded for devnet, and for Sui wallet

## Getting started

```
npm install @builders-of-stuff/svelte-sui-wallet-adapter
npx @svelte-add/tailwindcss@latest
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

## Misc.

Sometimes the published package won't render the contents of the Dialog of the `ConnectButton` properly. I don't know why but re-creating a similar look alike with `Dialog` fixes this somehow... leaving this here for my sanity.

```
<script lang="ts">
	import { ConnectButton, walletAdapter } from '@builders-of-stuff/svelte-sui-wallet-adapter';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	const wallets = [
		{
			name: 'Sui'
		},
		{
			name: 'Ethos'
		}
	];
</script>

<ConnectButton {walletAdapter} />

<Dialog.Root>
	<Dialog.Trigger><Button>Edit Profile</Button></Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Edit profile</Dialog.Title>
			<Dialog.Description>
				<div class="flex flex-col">
					{#each walletAdapter.wallets as wallet, index}
						<button
							onclick={() => {}}
							class={`flex items-center justify-start gap-4 ${
								index === 0 ? 'rounded-t-md' : index === 1 ? 'rounded-b-md' : 'rounded-none'
							} border ${
								false ? 'border-primary' : 'border-muted'
							} bg-popover hover:bg-accent hover:text-accent-foreground p-2 ${
								!index === 0 && !index === 1 ? 'border-t-0' : ''
							}`}
						>
							<svg width={28} height={28} fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect width={28} height={28} rx={6} fill="#6FBCF0" />
								<path
									fill-rule="evenodd"
									clip-rule="evenodd"
									d="M7.942 20.527A6.875 6.875 0 0 0 13.957 24c2.51 0 4.759-1.298 6.015-3.473a6.875 6.875 0 0 0 0-6.945l-5.29-9.164a.837.837 0 0 0-1.45 0l-5.29 9.164a6.875 6.875 0 0 0 0 6.945Zm4.524-11.75 1.128-1.953a.418.418 0 0 1 .725 0l4.34 7.516a5.365 5.365 0 0 1 .449 4.442 4.675 4.675 0 0 0-.223-.73c-.599-1.512-1.954-2.68-4.029-3.47-1.426-.54-2.336-1.336-2.706-2.364-.476-1.326.021-2.77.316-3.44Zm-1.923 3.332L9.255 14.34a5.373 5.373 0 0 0 0 5.43 5.373 5.373 0 0 0 4.702 2.714 5.38 5.38 0 0 0 3.472-1.247c.125-.314.51-1.462.034-2.646-.44-1.093-1.5-1.965-3.15-2.594-1.864-.707-3.076-1.811-3.6-3.28a4.601 4.601 0 0 1-.17-.608Z"
									fill="#fff"
								/>
							</svg>

							<div>{wallet.name}</div>
						</button>
					{/each}
				</div>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>

```
