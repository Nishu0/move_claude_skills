/**
 * 02-accounts.ts
 * Account Generation and Derivation
 *
 * Aptos supports multiple signing schemes:
 * - Ed25519 (default, most compatible)
 * - Secp256k1 (Ethereum-compatible)
 *
 * Authentication types:
 * - Legacy Ed25519 (default)
 * - Single Sender (AIP-55) - unified authentication
 */

import {
  Account,
  Ed25519PrivateKey,
  Secp256k1PrivateKey,
  AccountAddress,
  SigningSchemeInput,
  Aptos,
  AptosConfig,
  Network,
} from "@aptos-labs/ts-sdk";

// ============ Generate New Account ============

// Default: Legacy Ed25519 (most compatible)
const defaultAccount = Account.generate();

// Single Sender Ed25519 (AIP-55)
const ed25519SingleSender = Account.generate({
  scheme: SigningSchemeInput.Ed25519,
  legacy: false,
});

// Single Sender Secp256k1 (Ethereum-compatible)
const secp256k1Account = Account.generate({
  scheme: SigningSchemeInput.Secp256k1Ecdsa,
});

// ============ Derive from Private Key ============

// Method 1: Direct derivation (no key rotation support)
function fromPrivateKeyDirect(privateKeyHex: string) {
  const privateKey = new Ed25519PrivateKey(privateKeyHex);
  return Account.fromPrivateKey({ privateKey });
}

// Method 2: With key rotation support (recommended)
async function fromPrivateKeyWithRotation(privateKeyHex: string) {
  const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
  const privateKey = new Ed25519PrivateKey(privateKeyHex);
  return await aptos.deriveAccountFromPrivateKey({ privateKey });
}

// Secp256k1 private key
function fromSecp256k1PrivateKey(privateKeyHex: string) {
  const privateKey = new Secp256k1PrivateKey(privateKeyHex);
  return Account.fromPrivateKey({ privateKey });
}

// ============ Derive from Private Key and Address ============

function fromPrivateKeyAndAddress(
  privateKeyHex: string,
  addressHex: string
) {
  const privateKey = new Ed25519PrivateKey(privateKeyHex);
  const address = AccountAddress.from(addressHex);
  return Account.fromPrivateKeyAndAddress({ privateKey, address });
}

// ============ Derive from Mnemonic (HD Wallet) ============

function fromMnemonic(mnemonic: string, accountIndex: number = 0) {
  // Aptos derivation path: m/44'/637'/0'/0'/index'
  const path = `m/44'/637'/0'/0'/${accountIndex}`;
  return Account.fromDerivationPath({ path, mnemonic });
}

// ============ Example Usage ============

async function main() {
  console.log("=== Account Management Example ===\n");

  // Generate new account
  const alice = Account.generate();
  console.log("Generated Account (Legacy Ed25519):");
  console.log(`  Address: ${alice.accountAddress}`);
  console.log(`  Public Key: ${alice.publicKey}`);
  console.log(`  Private Key: ${alice.privateKey}`);

  // Generate Secp256k1 account
  const bob = Account.generate({
    scheme: SigningSchemeInput.Secp256k1Ecdsa,
  });
  console.log("\nGenerated Account (Secp256k1):");
  console.log(`  Address: ${bob.accountAddress}`);

  // Derive from mnemonic
  const mnemonic =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const hdAccount0 = fromMnemonic(mnemonic, 0);
  const hdAccount1 = fromMnemonic(mnemonic, 1);

  console.log("\nHD Wallet Accounts:");
  console.log(`  Index 0: ${hdAccount0.accountAddress}`);
  console.log(`  Index 1: ${hdAccount1.accountAddress}`);

  // Verify account on chain
  const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

  // Fund account to create it on-chain
  console.log("\nFunding alice on testnet...");
  await aptos.fundAccount({
    accountAddress: alice.accountAddress,
    amount: 100_000_000,
  });

  // Get account info
  const accountInfo = await aptos.getAccountInfo({
    accountAddress: alice.accountAddress,
  });

  console.log("\nAccount Info:");
  console.log(`  Sequence Number: ${accountInfo.sequence_number}`);
  console.log(`  Authentication Key: ${accountInfo.authentication_key}`);
}

main().catch(console.error);
