/**
 * 05-tokens-nfts.ts
 * Creating and Managing Tokens/NFTs on Aptos
 *
 * Aptos Digital Assets (NFTs) are built on the Token Objects standard.
 */

import {
  Account,
  Aptos,
  AptosConfig,
  Network,
} from "@aptos-labs/ts-sdk";

// ============ Create Collection ============

async function createCollection(
  aptos: Aptos,
  creator: Account,
  name: string,
  description: string,
  uri: string
) {
  const transaction = await aptos.createCollectionTransaction({
    creator,
    description,
    name,
    uri,
  });

  const result = await aptos.signAndSubmitTransaction({
    signer: creator,
    transaction,
  });

  await aptos.waitForTransaction({ transactionHash: result.hash });

  return result;
}

// ============ Create Collection with Options ============

async function createCollectionWithOptions(
  aptos: Aptos,
  creator: Account,
  name: string,
  description: string,
  uri: string,
  maxSupply?: number
) {
  const transaction = await aptos.createCollectionTransaction({
    creator,
    description,
    name,
    uri,
    maxSupply, // Optional: limit number of NFTs
    royaltyNumerator: 5, // 5% royalty
    royaltyDenominator: 100,
  });

  const result = await aptos.signAndSubmitTransaction({
    signer: creator,
    transaction,
  });

  await aptos.waitForTransaction({ transactionHash: result.hash });

  return result;
}

// ============ Mint NFT ============

async function mintNFT(
  aptos: Aptos,
  creator: Account,
  collectionName: string,
  name: string,
  description: string,
  uri: string
) {
  const transaction = await aptos.mintDigitalAssetTransaction({
    creator,
    collection: collectionName,
    description,
    name,
    uri,
  });

  const result = await aptos.signAndSubmitTransaction({
    signer: creator,
    transaction,
  });

  await aptos.waitForTransaction({ transactionHash: result.hash });

  return result;
}

// ============ Mint NFT with Properties ============

async function mintNFTWithProperties(
  aptos: Aptos,
  creator: Account,
  collectionName: string,
  name: string,
  description: string,
  uri: string,
  properties: { key: string; type: string; value: any }[]
) {
  const transaction = await aptos.mintDigitalAssetTransaction({
    creator,
    collection: collectionName,
    description,
    name,
    uri,
    propertyKeys: properties.map((p) => p.key),
    propertyTypes: properties.map((p) => p.type),
    propertyValues: properties.map((p) => p.value),
  });

  const result = await aptos.signAndSubmitTransaction({
    signer: creator,
    transaction,
  });

  await aptos.waitForTransaction({ transactionHash: result.hash });

  return result;
}

// ============ Transfer NFT ============

async function transferNFT(
  aptos: Aptos,
  owner: Account,
  tokenAddress: string,
  recipientAddress: string
) {
  const transaction = await aptos.transferDigitalAssetTransaction({
    sender: owner,
    digitalAssetAddress: tokenAddress,
    recipient: recipientAddress,
  });

  const result = await aptos.signAndSubmitTransaction({
    signer: owner,
    transaction,
  });

  await aptos.waitForTransaction({ transactionHash: result.hash });

  return result;
}

// ============ Burn NFT ============

async function burnNFT(
  aptos: Aptos,
  owner: Account,
  tokenAddress: string
) {
  const transaction = await aptos.burnDigitalAssetTransaction({
    creator: owner,
    digitalAssetAddress: tokenAddress,
  });

  const result = await aptos.signAndSubmitTransaction({
    signer: owner,
    transaction,
  });

  await aptos.waitForTransaction({ transactionHash: result.hash });

  return result;
}

// ============ Get Collection Data ============

async function getCollectionInfo(
  aptos: Aptos,
  creatorAddress: string,
  collectionName: string
) {
  const collection = await aptos.getCollectionData({
    creatorAddress,
    collectionName,
  });

  return collection;
}

// ============ Get NFT Data ============

async function getNFTInfo(aptos: Aptos, tokenAddress: string) {
  const token = await aptos.getDigitalAssetData({
    digitalAssetAddress: tokenAddress,
  });

  return token;
}

// ============ Get Owned NFTs ============

async function getOwnedNFTs(aptos: Aptos, ownerAddress: string) {
  const tokens = await aptos.getAccountOwnedTokens({
    accountAddress: ownerAddress,
  });

  return tokens;
}

// ============ Example Usage ============

async function main() {
  console.log("=== Tokens & NFTs Example ===\n");

  const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

  // Create accounts
  const creator = Account.generate();
  const collector = Account.generate();

  console.log(`Creator: ${creator.accountAddress}`);
  console.log(`Collector: ${collector.accountAddress}`);

  // Fund accounts
  console.log("\nFunding accounts...");
  await aptos.fundAccount({
    accountAddress: creator.accountAddress,
    amount: 200_000_000,
  });
  await aptos.fundAccount({
    accountAddress: collector.accountAddress,
    amount: 100_000_000,
  });

  // Create collection
  console.log("\n--- Creating Collection ---");
  const collectionName = `TestCollection_${Date.now()}`;
  await createCollection(
    aptos,
    creator,
    collectionName,
    "A test NFT collection",
    "https://example.com/collection.json"
  );
  console.log(`Collection created: ${collectionName}`);

  // Get collection info
  const collectionInfo = await getCollectionInfo(
    aptos,
    creator.accountAddress.toString(),
    collectionName
  );
  console.log(`Collection address: ${collectionInfo.collection_id}`);

  // Mint NFT
  console.log("\n--- Minting NFT ---");
  const nftName = "Test NFT #1";
  const mintResult = await mintNFT(
    aptos,
    creator,
    collectionName,
    nftName,
    "My first NFT",
    "https://example.com/nft1.json"
  );
  console.log(`NFT minted: ${nftName}`);
  console.log(`Transaction: ${mintResult.hash}`);

  // Get owned NFTs
  console.log("\n--- Creator's NFTs ---");
  const creatorNFTs = await getOwnedNFTs(
    aptos,
    creator.accountAddress.toString()
  );
  console.log(`Creator owns ${creatorNFTs.length} NFT(s)`);

  if (creatorNFTs.length > 0) {
    const nft = creatorNFTs[0];
    console.log(`  - Name: ${nft.current_token_data?.token_name}`);
    console.log(`  - Address: ${nft.token_data_id}`);

    // Transfer NFT
    console.log("\n--- Transferring NFT ---");
    await transferNFT(
      aptos,
      creator,
      nft.token_data_id,
      collector.accountAddress.toString()
    );
    console.log(`NFT transferred to collector`);

    // Verify transfer
    const collectorNFTs = await getOwnedNFTs(
      aptos,
      collector.accountAddress.toString()
    );
    console.log(`\nCollector now owns ${collectorNFTs.length} NFT(s)`);
  }
}

main().catch(console.error);
