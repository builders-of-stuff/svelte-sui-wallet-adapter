import { SLUSH_WALLET_NAME } from '@mysten/slush-wallet';

import type { SuiNetwork } from './wallet-adapter.type.js';

export const DEFAULT_STORAGE_KEY =
  'svelte-sui-wallet-adapter:selected-wallet-and-address';

export const DEFAULT_PREFERRED_WALLETS = [SLUSH_WALLET_NAME];

/**
 * A wallet must implement at least one of these to be able to sign transactions.
 * `sui:signTransactionBlock` is the deprecated pre-2.0 feature, still accepted
 * because the @mysten/wallet-standard helpers fall back to it transparently.
 */
export const SIGNING_FEATURES = [
  'sui:signTransaction',
  'sui:signTransactionBlock'
] as const;

/**
 * There is no gRPC equivalent of `getFullnodeUrl` in @mysten/sui, so the
 * public fullnode URLs are kept here (overridable via the `baseUrl` option).
 */
export const GRPC_FULLNODE_URLS: Record<SuiNetwork, string> = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
  localnet: 'http://127.0.0.1:9000'
};

export function getGrpcFullnodeUrl(network: SuiNetwork): string {
  const url = GRPC_FULLNODE_URLS[network];

  if (!url) {
    throw new Error(
      `Unknown network: ${network}. Pass an explicit baseUrl for custom networks.`
    );
  }

  return url;
}

/**
 * Public GraphQL endpoints, for use with SuiGraphQLClient from
 * '@mysten/sui/graphql' (verified live June 2026; the older
 * sui-{network}.mystenlabs.com hosts no longer resolve). Localnet requires a
 * locally running GraphQL indexer.
 */
export const GRAPHQL_URLS: Record<SuiNetwork, string> = {
  mainnet: 'https://graphql.mainnet.sui.io/graphql',
  testnet: 'https://graphql.testnet.sui.io/graphql',
  devnet: 'https://graphql.devnet.sui.io/graphql',
  localnet: 'http://127.0.0.1:9125/graphql'
};

export function getGraphqlUrl(network: SuiNetwork): string {
  const url = GRAPHQL_URLS[network];

  if (!url) {
    throw new Error(
      `Unknown network: ${network}. Pass an explicit GraphQL URL for custom networks.`
    );
  }

  return url;
}
