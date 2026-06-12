<script lang="ts">
  import { SuiGraphQLClient } from '@mysten/sui/graphql';

  import {
    ConnectButton,
    getGraphqlUrl,
    walletAdapter as mainnetWalletAdapter,
    testnetWalletAdapter,
    devnetWalletAdapter,
    localnetWalletAdapter,
    type SuiNetwork
  } from '$lib/index.js';
  import StateCard from './state-card.svelte';
  import CodeBlock from './code-block.svelte';
  import {
    ADDRESS_QUERY,
    buildSelfTransferTransaction,
    safeStringify,
    shortAddress,
    THEME_PRESETS,
    type ThemePreset
  } from './demo-helpers.js';

  const ADAPTERS = {
    devnet: devnetWalletAdapter,
    testnet: testnetWalletAdapter,
    mainnet: mainnetWalletAdapter,
    localnet: localnetWalletAdapter
  };
  const NETWORKS = Object.keys(ADAPTERS) as SuiNetwork[];

  let network = $state('devnet' as SuiNetwork);
  const walletAdapter = $derived(ADAPTERS[network]);
  const graphqlClient = $derived(
    new SuiGraphQLClient({ url: getGraphqlUrl(network), network })
  );

  const INSTALL_COMMAND = 'pnpm install @builders-of-stuff/svelte-sui-wallet-adapter';

  const THEME_TOKENS = `--sswa-primary        --sswa-primary-foreground
--sswa-background     --sswa-foreground
--sswa-secondary      --sswa-secondary-foreground
--sswa-muted          --sswa-muted-foreground
--sswa-border         --sswa-ring
--sswa-radius         --sswa-font-sans
--sswa-overlay`;

  const STATUS_DOT: Record<string, string> = {
    disconnected: 'bg-zinc-400',
    connecting: 'bg-amber-400',
    reconnecting: 'bg-amber-400',
    connected: 'bg-emerald-500'
  };

  /**
   * Actions playground
   */
  let pending = $state(null as string | null);
  let output = $state(
    null as {
      action: string;
      ok: boolean;
      body: string;
      digest?: string;
      network: SuiNetwork;
    } | null
  );

  async function run(
    action: string,
    fn: () => Promise<unknown>,
    digestFrom?: (result: unknown) => string | undefined
  ) {
    pending = action;
    try {
      const result = await fn();
      output = {
        action,
        ok: true,
        body: safeStringify(result),
        digest: digestFrom?.(result),
        network
      };
    } catch (error) {
      output = {
        action,
        ok: false,
        body: error instanceof Error ? error.message : safeStringify(error),
        network
      };
    } finally {
      pending = null;
    }
  }

  const signMessage = () =>
    run('Sign personal message', () =>
      walletAdapter.signPersonalMessage({
        message: new TextEncoder().encode('Hello from svelte-sui-wallet-adapter')
      })
    );

  const signOnly = () =>
    run('Sign transaction', () =>
      walletAdapter.signTransaction(
        buildSelfTransferTransaction(walletAdapter.currentAccount!.address)
      )
    );

  const signAndExecute = () =>
    run(
      'Sign & execute',
      async () => {
        const result = await walletAdapter.signAndExecuteTransaction({
          transaction: buildSelfTransferTransaction(
            walletAdapter.currentAccount!.address
          )
        });
        const digest = (result.Transaction ?? result.FailedTransaction).digest;

        return walletAdapter.waitForTransaction({
          digest,
          include: { balanceChanges: true }
        });
      },
      (result: any) => (result?.Transaction ?? result?.FailedTransaction)?.digest
    );

  const listObjects = () =>
    run('List owned objects', () =>
      walletAdapter.suiClient.core.listOwnedObjects({
        owner: walletAdapter.currentAccount!.address,
        include: { json: true }
      })
    );

  const listBalances = () =>
    run('Get balances', () =>
      walletAdapter.suiClient.core.listBalances({
        owner: walletAdapter.currentAccount!.address
      })
    );

  const queryGraphql = () =>
    run('GraphQL query', () =>
      graphqlClient.query({
        query: ADDRESS_QUERY,
        variables: { address: walletAdapter.currentAccount!.address }
      })
    );

  const ACTIONS = [
    {
      id: 'Sign personal message',
      handler: signMessage,
      hint: 'sui:signPersonalMessage'
    },
    {
      id: 'Sign transaction',
      handler: signOnly,
      hint: 'self-transfer — sign only, no execution'
    },
    {
      id: 'Sign & execute',
      handler: signAndExecute,
      hint: 'transfers 1 MIST to yourself (costs gas)'
    },
    {
      id: 'List owned objects',
      handler: listObjects,
      hint: 'gRPC: suiClient.core.listOwnedObjects'
    },
    {
      id: 'Get balances',
      handler: listBalances,
      hint: 'gRPC: suiClient.core.listBalances'
    },
    {
      id: 'GraphQL query',
      handler: queryGraphql,
      hint: 'raw query via SuiGraphQLClient'
    }
  ];

  /**
   * Misc UI state
   */
  let addressCopied = $state(false);

  async function copyAddress() {
    const address = walletAdapter.currentAccount?.address;
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      addressCopied = true;
      setTimeout(() => (addressCopied = false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  }

  let activePreset = $state('default' as ThemePreset);
</script>

<main class="mx-auto max-w-5xl space-y-16 px-6 py-12">
  <!-- Hero -->
  <section class="flex flex-col items-center gap-6 pt-8 text-center">
    <div class="flex flex-wrap items-center justify-center gap-2 text-xs">
      {#each NETWORKS as candidate (candidate)}
        <button
          type="button"
          aria-pressed={network === candidate}
          onclick={() => (network = candidate)}
          class={`rounded-full border px-2.5 py-0.5 font-medium transition ${
            network === candidate
              ? 'border-sui/30 bg-sui/10 text-sui'
              : 'border-zinc-200 text-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          {candidate}
        </button>
      {/each}
      <span class="text-zinc-300 dark:text-zinc-600">|</span>
      <span
        class="rounded-full border border-zinc-200 px-2.5 py-0.5 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
      >
        Svelte 5
      </span>
      <span
        class="rounded-full border border-zinc-200 px-2.5 py-0.5 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
      >
        v3
      </span>
    </div>

    <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">
      Svelte <span class="text-sui">Sui</span> Wallet Adapter
    </h1>

    <p class="max-w-xl text-lg text-zinc-500 dark:text-zinc-400">
      A Sui wallet adapter for Svelte 5 — zero UI dependencies, scoped styles, and
      runes-reactive state.
    </p>

    <div class="w-full max-w-md">
      <CodeBlock code={INSTALL_COMMAND} copyable />
    </div>

    <div data-testid="hero-connect">
      <ConnectButton {walletAdapter} />
    </div>
  </section>

  <!-- Live connection state -->
  <section>
    <h2 class="mb-6 text-2xl font-semibold tracking-tight">Live connection state</h2>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StateCard title="Status">
        <div class="flex items-center gap-2" data-testid="connection-status">
          <span
            class={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[walletAdapter.connectionStatus] ?? 'bg-zinc-400'}`}
          ></span>
          <span class="font-medium">{walletAdapter.connectionStatus}</span>
        </div>
      </StateCard>

      <StateCard title="Current wallet">
        {#if walletAdapter.currentWallet}
          <div class="flex items-center gap-2">
            <img
              src={walletAdapter.currentWallet.icon}
              alt=""
              class="h-6 w-6 rounded-md"
            />
            <span class="font-medium">{walletAdapter.currentWallet.name}</span>
          </div>
        {:else}
          <p class="text-sm text-zinc-400 dark:text-zinc-500">No wallet connected</p>
        {/if}
      </StateCard>

      <StateCard title="Current account">
        {#if walletAdapter.currentAccount}
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm">
              {walletAdapter.currentAccount.label ??
                shortAddress(walletAdapter.currentAccount.address)}
            </span>
            <button
              type="button"
              onclick={copyAddress}
              class="rounded-md border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 transition hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {addressCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
        {:else}
          <p class="text-sm text-zinc-400 dark:text-zinc-500">
            Connect to see your account
          </p>
        {/if}
      </StateCard>

      <StateCard title="Accounts">
        {#if walletAdapter.accounts.length}
          <ul class="space-y-1">
            {#each walletAdapter.accounts as account (account.address)}
              {@const isActive =
                walletAdapter.currentAccount?.address === account.address}
              <li>
                <button
                  type="button"
                  onclick={() => walletAdapter.switchAccount(account)}
                  class={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left font-mono text-xs transition ${
                    isActive
                      ? 'bg-sui/10 text-sui'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  {account.label ?? shortAddress(account.address)}
                  {#if isActive}
                    <span class="text-[10px] font-medium uppercase">active</span>
                  {/if}
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="text-sm text-zinc-400 dark:text-zinc-500">
            Connect to list accounts
          </p>
        {/if}
      </StateCard>

      <StateCard title="Detected wallets">
        {#if walletAdapter.wallets.length}
          <ul class="space-y-2">
            {#each walletAdapter.wallets as wallet (wallet.name)}
              <li class="flex items-center gap-2 text-sm">
                <img src={wallet.icon} alt="" class="h-5 w-5 rounded" />
                {wallet.name}
              </li>
            {/each}
          </ul>
        {:else}
          <p class="text-sm text-zinc-400 dark:text-zinc-500">
            No wallet extensions detected in this browser
          </p>
        {/if}
      </StateCard>

      <StateCard title="Persistence">
        <dl class="space-y-1 text-sm">
          <div class="flex justify-between gap-2">
            <dt class="text-zinc-400 dark:text-zinc-500">Last wallet</dt>
            <dd class="font-mono text-xs">
              {walletAdapter.lastConnectedWalletName ?? '—'}
            </dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-zinc-400 dark:text-zinc-500">Last account</dt>
            <dd class="font-mono text-xs">
              {walletAdapter.lastConnectedAccountAddress
                ? shortAddress(walletAdapter.lastConnectedAccountAddress)
                : '—'}
            </dd>
          </div>
        </dl>
        <p class="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
          Restored on reload via localStorage + autoConnect
        </p>
      </StateCard>
    </div>
  </section>

  <!-- Actions playground -->
  <section>
    <h2 class="mb-2 text-2xl font-semibold tracking-tight">Actions playground</h2>
    <p class="mb-6 text-sm text-zinc-400 dark:text-zinc-500">
      Runs against {walletAdapter.network}{walletAdapter.isConnected
        ? ' with your connected wallet.'
        : ' — connect to try these actions.'}
    </p>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="space-y-3">
        {#each ACTIONS as action (action.id)}
          <button
            type="button"
            onclick={action.handler}
            disabled={!walletAdapter.isConnected || pending !== null}
            class="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition enabled:hover:border-sui/50 enabled:hover:bg-sui/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span>
              <span class="block text-sm font-medium">{action.id}</span>
              <span class="block text-xs text-zinc-400 dark:text-zinc-500">
                {action.hint}
              </span>
            </span>
            {#if pending === action.id}
              <span
                class="h-4 w-4 animate-spin rounded-full border-2 border-sui border-t-transparent"
              ></span>
            {:else}
              <span class="text-zinc-300 dark:text-zinc-600">→</span>
            {/if}
          </button>
        {/each}
      </div>

      <div
        class="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {#if output}
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium">{output.action}</span>
            <span
              class={`rounded-full px-2 py-0.5 text-xs font-medium ${
                output.ok
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
              }`}
            >
              {output.ok ? 'success' : 'error'}
            </span>
            {#if output.digest && output.network !== 'localnet'}
              <a
                href={`https://suiscan.xyz/${output.network}/tx/${output.digest}`}
                target="_blank"
                rel="noopener noreferrer"
                class="font-mono text-xs text-sui hover:underline"
              >
                {output.digest.slice(0, 10)}… ↗
              </a>
            {/if}
          </div>
          <CodeBlock code={output.body} scrollable copyable />
        {:else}
          <div
            class="flex h-full min-h-40 items-center justify-center text-sm text-zinc-400 dark:text-zinc-500"
          >
            Run an action to see its result here.
          </div>
        {/if}
      </div>
    </div>
  </section>

  <!-- Theming -->
  <section>
    <h2 class="mb-2 text-2xl font-semibold tracking-tight">Theming</h2>
    <p class="mb-6 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
      Components ship scoped styles, follow the OS color scheme automatically via
      <code class="font-mono text-xs">light-dark()</code>, and expose
      <code class="font-mono text-xs">--sswa-*</code> custom property hooks. Pick a preset
      — the modal restyles too, since CSS variables cascade into the native dialog.
    </p>

    <div class="grid gap-4 lg:grid-cols-2">
      <CodeBlock code={THEME_TOKENS} />

      <div
        class="flex flex-col items-center justify-center gap-5 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div class="flex flex-wrap justify-center gap-2">
          {#each Object.entries(THEME_PRESETS) as [key, preset] (key)}
            <button
              type="button"
              onclick={() => (activePreset = key as ThemePreset)}
              class={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                activePreset === key
                  ? 'border-sui bg-sui/10 text-sui'
                  : 'border-zinc-200 text-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              {preset.label}
            </button>
          {/each}
        </div>

        <div style={THEME_PRESETS[activePreset].style}>
          <ConnectButton {walletAdapter} />
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer
    class="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-8 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
  >
    <span>MIT License</span>
    <div class="flex gap-5">
      <a
        href="https://github.com/builders-of-stuff/svelte-sui-wallet-adapter"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        GitHub
      </a>
      <a
        href="https://www.npmjs.com/package/@builders-of-stuff/svelte-sui-wallet-adapter"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        npm
      </a>
    </div>
  </footer>
</main>
