/**
 * 01-setup.ts
 * SDK Installation and Client Configuration
 *
 * Installation:
 *   npm install @aptos-labs/ts-sdk
 *   pnpm install @aptos-labs/ts-sdk
 *   yarn add @aptos-labs/ts-sdk
 *   bun add @aptos-labs/ts-sdk
 */

import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// ============ Basic Setup ============

// Testnet (recommended for development)
const testnetConfig = new AptosConfig({ network: Network.TESTNET });
const testnetAptos = new Aptos(testnetConfig);

// Mainnet (production)
const mainnetConfig = new AptosConfig({ network: Network.MAINNET });
const mainnetAptos = new Aptos(mainnetConfig);

// Devnet (bleeding edge features)
const devnetConfig = new AptosConfig({ network: Network.DEVNET });
const devnetAptos = new Aptos(devnetConfig);

// Local node
const localConfig = new AptosConfig({ network: Network.LOCAL });
const localAptos = new Aptos(localConfig);

// ============ Custom Node Configuration ============

const customConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: "https://your-fullnode-url.com",
  indexer: "https://your-indexer-url.com",
  faucet: "https://your-faucet-url.com",
});
const customAptos = new Aptos(customConfig);

// ============ Bun Runtime Configuration ============

// Bun's HTTP/2 support is not fully mature - disable it
const bunConfig = new AptosConfig({
  network: Network.TESTNET,
  clientConfig: { http2: false },
});
const bunAptos = new Aptos(bunConfig);

// ============ Example Usage ============

async function main() {
  console.log("=== Aptos SDK Setup Example ===\n");

  // Use testnet for this example
  const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

  // Get ledger info to verify connection
  const ledgerInfo = await aptos.getLedgerInfo();

  console.log("Connected to Aptos!");
  console.log(`Chain ID: ${ledgerInfo.chain_id}`);
  console.log(`Ledger Version: ${ledgerInfo.ledger_version}`);
  console.log(`Block Height: ${ledgerInfo.block_height}`);
  console.log(`Epoch: ${ledgerInfo.epoch}`);
}

main().catch(console.error);
