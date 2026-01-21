/**
 * 04-reading-data.ts
 * Reading Data from the Aptos Blockchain
 *
 * Query account info, resources, modules, tokens, events, and transactions.
 */

import {
  Account,
  Aptos,
  AptosConfig,
  Network,
  AccountAddress,
} from "@aptos-labs/ts-sdk";

// ============ Account Information ============

async function getAccountInfo(aptos: Aptos, address: string) {
  // Basic account info
  const info = await aptos.getAccountInfo({
    accountAddress: address,
  });

  return {
    sequenceNumber: info.sequence_number,
    authenticationKey: info.authentication_key,
  };
}

// ============ Account Balance ============

async function getBalance(aptos: Aptos, address: string) {
  return await aptos.getAccountAPTAmount({
    accountAddress: address,
  });
}

// ============ Account Resources ============

async function getResources(aptos: Aptos, address: string) {
  // Get all resources
  const resources = await aptos.getAccountResources({
    accountAddress: address,
  });

  return resources;
}

async function getSpecificResource(
  aptos: Aptos,
  address: string,
  resourceType: string
) {
  // Get specific resource
  const resource = await aptos.getAccountResource({
    accountAddress: address,
    resourceType,
  });

  return resource;
}

// ============ Account Modules ============

async function getModules(aptos: Aptos, address: string) {
  const modules = await aptos.getAccountModules({
    accountAddress: address,
  });

  return modules;
}

async function getModule(
  aptos: Aptos,
  address: string,
  moduleName: string
) {
  const module = await aptos.getAccountModule({
    accountAddress: address,
    moduleName,
  });

  return module;
}

// ============ Tokens and NFTs ============

async function getOwnedTokens(aptos: Aptos, address: string) {
  const tokens = await aptos.getAccountOwnedTokens({
    accountAddress: address,
  });

  return tokens;
}

async function getCollectionTokens(
  aptos: Aptos,
  ownerAddress: string,
  collectionAddress: string
) {
  const tokens = await aptos.getAccountOwnedTokensFromCollectionAddress({
    accountAddress: ownerAddress,
    collectionAddress,
  });

  return tokens;
}

async function getTokenData(aptos: Aptos, tokenAddress: string) {
  const data = await aptos.getDigitalAssetData({
    digitalAssetAddress: tokenAddress,
  });

  return data;
}

async function getCollectionData(
  aptos: Aptos,
  creatorAddress: string,
  collectionName: string
) {
  const data = await aptos.getCollectionData({
    creatorAddress,
    collectionName,
  });

  return data;
}

// ============ Events ============

async function getEventsByType(aptos: Aptos, eventType: string) {
  const events = await aptos.getEvents({
    eventType,
  });

  return events;
}

async function getAccountEvents(
  aptos: Aptos,
  address: string,
  eventType: string
) {
  const events = await aptos.getAccountEventsByEventType({
    accountAddress: address,
    eventType,
  });

  return events;
}

// ============ Transactions ============

async function getTransactionByHash(aptos: Aptos, hash: string) {
  const tx = await aptos.getTransactionByHash({
    transactionHash: hash,
  });

  return tx;
}

async function getAccountTransactions(aptos: Aptos, address: string) {
  const txs = await aptos.getAccountTransactions({
    accountAddress: address,
  });

  return txs;
}

// ============ View Functions ============

async function callViewFunction(
  aptos: Aptos,
  functionId: string,
  typeArgs: string[],
  args: any[]
) {
  const result = await aptos.view({
    payload: {
      function: functionId,
      typeArguments: typeArgs,
      functionArguments: args,
    },
  });

  return result;
}

// ============ Example Usage ============

async function main() {
  console.log("=== Reading Data Example ===\n");

  const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

  // Create and fund an account
  const account = Account.generate();
  console.log(`Account: ${account.accountAddress}`);

  console.log("\nFunding account...");
  await aptos.fundAccount({
    accountAddress: account.accountAddress,
    amount: 100_000_000,
  });

  // Get account info
  console.log("\n--- Account Info ---");
  const info = await getAccountInfo(aptos, account.accountAddress.toString());
  console.log(`Sequence Number: ${info.sequenceNumber}`);
  console.log(`Auth Key: ${info.authenticationKey}`);

  // Get balance
  console.log("\n--- Balance ---");
  const balance = await getBalance(aptos, account.accountAddress.toString());
  console.log(`Balance: ${balance} octas (${balance / 100_000_000} APT)`);

  // Get resources
  console.log("\n--- Resources ---");
  const resources = await getResources(
    aptos,
    account.accountAddress.toString()
  );
  console.log(`Total resources: ${resources.length}`);
  resources.slice(0, 3).forEach((r) => {
    console.log(`  - ${r.type}`);
  });

  // Get coin store resource
  console.log("\n--- Coin Store Resource ---");
  try {
    const coinStore = await getSpecificResource(
      aptos,
      account.accountAddress.toString(),
      "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
    );
    console.log(`Coin balance: ${(coinStore as any).coin.value}`);
  } catch (e) {
    console.log("Coin store not found");
  }

  // Get modules from Aptos Framework
  console.log("\n--- Modules (0x1) ---");
  const modules = await getModules(aptos, "0x1");
  console.log(`Total modules: ${modules.length}`);
  console.log("First 5 modules:");
  modules.slice(0, 5).forEach((m) => {
    console.log(`  - ${m.abi?.name}`);
  });

  // View function - get balance via view
  console.log("\n--- View Function ---");
  const viewResult = await callViewFunction(
    aptos,
    "0x1::coin::balance",
    ["0x1::aptos_coin::AptosCoin"],
    [account.accountAddress.toString()]
  );
  console.log(`Balance via view: ${viewResult[0]}`);

  // Get owned tokens (likely empty for new account)
  console.log("\n--- Owned Tokens ---");
  const tokens = await getOwnedTokens(
    aptos,
    account.accountAddress.toString()
  );
  console.log(`Owned tokens: ${tokens.length}`);

  // Get account transactions
  console.log("\n--- Account Transactions ---");
  const txs = await getAccountTransactions(
    aptos,
    account.accountAddress.toString()
  );
  console.log(`Total transactions: ${txs.length}`);
}

main().catch(console.error);
