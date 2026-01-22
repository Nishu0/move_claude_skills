---
name: aptos-ts-sdk
description: Aptos TypeScript SDK for building dApps and blockchain interactions
author: Nisarg Thakkar
version: 1.0.0
---

You are an expert Aptos TypeScript SDK developer. Help users build dApps, manage accounts, and interact with the Aptos blockchain.

---

## INSTALLATION

### Node.js / Web Application

```bash
# npm
npm install @aptos-labs/ts-sdk

# pnpm (recommended)
pnpm install @aptos-labs/ts-sdk

# yarn
yarn add @aptos-labs/ts-sdk
```

### Bun Runtime

```bash
bun add @aptos-labs/ts-sdk
```

### Browser (CDN) - Version <= 1.9.1 Only

```html
<script src="https://unpkg.com/@aptos-labs/ts-sdk/dist/browser/index.global.js"></script>
<script>
  // Access via window.aptosSDK
  const { Aptos, AptosConfig, Network } = window.aptosSDK;
</script>
```

---

## CLIENT SETUP

### Basic Configuration

```typescript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Testnet (for development)
const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

// Mainnet (for production)
const mainnetConfig = new AptosConfig({ network: Network.MAINNET });
const mainnetAptos = new Aptos(mainnetConfig);

// Devnet (for testing new features)
const devnetConfig = new AptosConfig({ network: Network.DEVNET });
const devnetAptos = new Aptos(devnetConfig);

// Local node
const localConfig = new AptosConfig({ network: Network.LOCAL });
const localAptos = new Aptos(localConfig);
```

### Custom Node Configuration

```typescript
const customConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: "https://your-fullnode-url.com",
  indexer: "https://your-indexer-url.com",
  faucet: "https://your-faucet-url.com",
});
```

### Bun Runtime (Disable HTTP/2)

```typescript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Bun's HTTP/2 support is not fully mature - disable it
const aptos = new Aptos(
  new AptosConfig({
    network: Network.TESTNET,
    clientConfig: { http2: false },
  })
);
```

---

## ACCOUNT MANAGEMENT

### Generate New Account

```typescript
import { Account, SigningSchemeInput } from "@aptos-labs/ts-sdk";

// Default: Legacy Ed25519 (most compatible)
const account = Account.generate();

// Single Sender Ed25519 (AIP-55)
const ed25519Account = Account.generate({
  scheme: SigningSchemeInput.Ed25519,
  legacy: false,
});

// Single Sender Secp256k1
const secp256k1Account = Account.generate({
  scheme: SigningSchemeInput.Secp256k1Ecdsa,
});

console.log(`Address: ${account.accountAddress}`);
console.log(`Public Key: ${account.publicKey}`);
console.log(`Private Key: ${account.privateKey}`);
```

### Derive from Private Key

```typescript
import {
  Account,
  Ed25519PrivateKey,
  Secp256k1PrivateKey,
  Aptos,
  AptosConfig,
  Network,
} from "@aptos-labs/ts-sdk";

// Method 1: Direct derivation (no key rotation support)
const privateKey = new Ed25519PrivateKey("0x...");
const account = Account.fromPrivateKey({ privateKey });

// Method 2: With key rotation support (recommended)
const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
const accountWithRotation = await aptos.deriveAccountFromPrivateKey({
  privateKey,
});

// Secp256k1 private key
const secp256k1Key = new Secp256k1PrivateKey("0x...");
const secp256k1Account = Account.fromPrivateKey({ privateKey: secp256k1Key });
```

### Derive from Private Key and Address

```typescript
import { Account, Ed25519PrivateKey, AccountAddress } from "@aptos-labs/ts-sdk";

const privateKey = new Ed25519PrivateKey("0x...");
const address = AccountAddress.from("0x123...");

const account = Account.fromPrivateKeyAndAddress({
  privateKey,
  address,
});
```

### Derive from Mnemonic (HD Wallet)

```typescript
import { Account } from "@aptos-labs/ts-sdk";

const mnemonic = "various float stumble simple tiny..."; // 12 or 24 words
const path = "m/44'/637'/0'/0'/0"; // Aptos derivation path

const account = Account.fromDerivationPath({
  path,
  mnemonic,
});

// Different account index
const account1 = Account.fromDerivationPath({
  path: "m/44'/637'/0'/0'/1",
  mnemonic,
});
```

---

## READING BLOCKCHAIN DATA

### Account Information

```typescript
// Get account info (sequence number, authentication key)
const accountInfo = await aptos.getAccountInfo({
  accountAddress: "0x123...",
});

// Get account balance (APT)
const balance = await aptos.getAccountAPTAmount({
  accountAddress: "0x123...",
});

// Get account resources
const resources = await aptos.getAccountResources({
  accountAddress: "0x123...",
});

// Get specific resource
const coinStore = await aptos.getAccountResource({
  accountAddress: "0x123...",
  resourceType: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
});
```

### Modules and Code

```typescript
// Get all modules deployed to an account
const modules = await aptos.getAccountModules({
  accountAddress: "0x123...",
});

// Get specific module
const module = await aptos.getAccountModule({
  accountAddress: "0x1",
  moduleName: "coin",
});

// Get module ABI
const abi = module.abi;
```

### Tokens and NFTs

```typescript
// Get all tokens owned by account
const tokens = await aptos.getAccountOwnedTokens({
  accountAddress: "0x123...",
});

// Get tokens from specific collection
const collectionTokens = await aptos.getAccountOwnedTokensFromCollectionAddress({
  accountAddress: "0x123...",
  collectionAddress: "0xcollection...",
});

// Get token data
const tokenData = await aptos.getDigitalAssetData({
  digitalAssetAddress: "0xtoken...",
});

// Get collection data
const collection = await aptos.getCollectionData({
  collectionName: "My Collection",
  creatorAddress: "0x123...",
});
```

### Events

```typescript
// Get events by event type
const events = await aptos.getEvents({
  eventType: "0x1::coin::DepositEvent",
});

// Get events by account
const accountEvents = await aptos.getAccountEventsByEventType({
  accountAddress: "0x123...",
  eventType: "0x1::coin::DepositEvent",
});
```

### Transactions

```typescript
// Get transaction by hash
const tx = await aptos.getTransactionByHash({
  transactionHash: "0xabc...",
});

// Get account transactions
const accountTxs = await aptos.getAccountTransactions({
  accountAddress: "0x123...",
});

// Check if transaction is pending
const isPending = await aptos.isPendingTransaction({
  transactionHash: "0xabc...",
});
```

---

## TRANSACTIONS

### Simple Transfer

```typescript
import { Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

// Generate accounts
const alice = Account.generate();
const bob = Account.generate();

// Fund accounts (testnet only)
await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 });
await aptos.fundAccount({ accountAddress: bob.accountAddress, amount: 100 });

// 1. Build transaction
const transaction = await aptos.transaction.build.simple({
  sender: alice.accountAddress,
  data: {
    function: "0x1::aptos_account::transfer",
    functionArguments: [bob.accountAddress, 100],
  },
});

// 2. Simulate (optional but recommended)
const [simulation] = await aptos.transaction.simulate.simple({
  signerPublicKey: alice.publicKey,
  transaction,
});
console.log("Simulation result:", simulation);

// 3. Sign
const senderAuthenticator = aptos.transaction.sign({
  signer: alice,
  transaction,
});

// 4. Submit
const submitted = await aptos.transaction.submit.simple({
  transaction,
  senderAuthenticator,
});
console.log("Transaction hash:", submitted.hash);

// 5. Wait for confirmation
const result = await aptos.waitForTransaction({
  transactionHash: submitted.hash,
});
console.log("Transaction confirmed:", result.success);
```

### Call Smart Contract Function

```typescript
// Call a custom module function
const transaction = await aptos.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: "0x123::my_module::my_function",
    typeArguments: ["0x1::aptos_coin::AptosCoin"], // Generic type args
    functionArguments: [100, "hello", true], // Function arguments
  },
});
```

### Transaction with Options

```typescript
const transaction = await aptos.transaction.build.simple({
  sender: alice.accountAddress,
  data: {
    function: "0x1::aptos_account::transfer",
    functionArguments: [bob.accountAddress, 100],
  },
  options: {
    maxGasAmount: 10000,
    gasUnitPrice: 100,
    expireTimestamp: Math.floor(Date.now() / 1000) + 600, // 10 minutes
  },
});
```

### Batch Transactions

```typescript
// Build and submit multiple transactions
const transactions = [];

for (let i = 0; i < 5; i++) {
  const tx = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [bob.accountAddress, 10],
    },
  });

  const auth = aptos.transaction.sign({ signer: alice, transaction: tx });
  const result = await aptos.transaction.submit.simple({
    transaction: tx,
    senderAuthenticator: auth,
  });
  transactions.push(result.hash);
}

// Wait for all
await Promise.all(
  transactions.map((hash) => aptos.waitForTransaction({ transactionHash: hash }))
);
```

---

## VIEW FUNCTIONS

View functions read data without submitting a transaction.

```typescript
// Call a view function
const result = await aptos.view({
  payload: {
    function: "0x1::coin::balance",
    typeArguments: ["0x1::aptos_coin::AptosCoin"],
    functionArguments: ["0x123..."],
  },
});

console.log("Balance:", result[0]);

// Custom view function
const customResult = await aptos.view({
  payload: {
    function: "0x123::my_module::get_data",
    typeArguments: [],
    functionArguments: [42],
  },
});
```

---

## MULTI-AGENT TRANSACTIONS

Multiple signers in a single transaction.

```typescript
// Build multi-agent transaction
const transaction = await aptos.transaction.build.multiAgent({
  sender: alice.accountAddress,
  secondarySignerAddresses: [bob.accountAddress],
  data: {
    function: "0x123::marketplace::trade",
    functionArguments: [itemId, price],
  },
});

// Sign by sender
const aliceAuth = aptos.transaction.sign({
  signer: alice,
  transaction,
});

// Sign by secondary signer
const bobAuth = aptos.transaction.sign({
  signer: bob,
  transaction,
});

// Submit with all signatures
const result = await aptos.transaction.submit.multiAgent({
  transaction,
  senderAuthenticator: aliceAuth,
  additionalSignersAuthenticators: [bobAuth],
});
```

---

## SPONSORED TRANSACTIONS (Fee Payer)

Let another account pay for gas fees. Useful for onboarding users without tokens.

### Basic Sponsored Transaction

```typescript
// Build with fee payer flag
const transaction = await aptos.transaction.build.simple({
  sender: user.accountAddress,
  data: {
    function: "0x123::game::play",
    functionArguments: [],
  },
  withFeePayer: true, // <-- Enable fee payer
});

// User signs the transaction
const userAuth = aptos.transaction.sign({
  signer: user,
  transaction,
});

// Sponsor signs as fee payer
const feePayerAuth = aptos.transaction.signAsFeePayer({
  signer: sponsor,
  transaction,
});

// Submit with both signatures
const result = await aptos.transaction.submit.simple({
  transaction,
  senderAuthenticator: userAuth,
  feePayerAuthenticator: feePayerAuth,
});
```

### Complete Sponsored Transfer Example

```typescript
import { Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

async function sponsoredTransfer() {
  const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

  // Create accounts
  const alice = Account.generate();  // Sender
  const bob = Account.generate();    // Recipient
  const sponsor = Account.generate(); // Pays gas

  // Fund Alice and Sponsor (Bob doesn't need funds)
  await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 100_000_000 });
  await aptos.fundAccount({ accountAddress: sponsor.accountAddress, amount: 100_000_000 });

  // Build sponsored transaction
  const transaction = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    withFeePayer: true,
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [bob.accountAddress, 1000],
    },
  });

  // Sponsor signs as fee payer
  const sponsorSignature = aptos.transaction.signAsFeePayer({
    signer: sponsor,
    transaction,
  });

  // Alice signs and submits
  const result = await aptos.signAndSubmitTransaction({
    signer: alice,
    feePayerAuthenticator: sponsorSignature,
    transaction,
  });

  await aptos.waitForTransaction({ transactionHash: result.hash });

  // Alice's balance reduced by transfer only (NOT gas)
  // Sponsor's balance reduced by gas
  // Bob received the transfer
}
```

### Key Points

- **`withFeePayer: true`** enables sponsored transactions
- **Sender signs** the transaction content
- **Sponsor signs** with `signAsFeePayer()`
- **Gas is deducted from sponsor**, not sender
- Sender only loses the transfer amount

---

## TOKENS AND NFTS

### Create Collection

```typescript
const createCollectionTx = await aptos.createCollectionTransaction({
  creator: account,
  description: "My awesome NFT collection",
  name: "My Collection",
  uri: "https://example.com/collection.json",
});

const result = await aptos.signAndSubmitTransaction({
  signer: account,
  transaction: createCollectionTx,
});
```

### Mint NFT

```typescript
const mintTx = await aptos.mintDigitalAssetTransaction({
  creator: account,
  collection: "My Collection",
  description: "NFT #1",
  name: "NFT 1",
  uri: "https://example.com/nft1.json",
});

const result = await aptos.signAndSubmitTransaction({
  signer: account,
  transaction: mintTx,
});
```

### Transfer NFT

```typescript
const transferTx = await aptos.transferDigitalAssetTransaction({
  sender: owner,
  digitalAssetAddress: "0xnft...",
  recipient: newOwner.accountAddress,
});

const result = await aptos.signAndSubmitTransaction({
  signer: owner,
  transaction: transferTx,
});
```

---

## KEYLESS ACCOUNTS (OAuth/Social Login)

Keyless accounts allow users to authenticate via OAuth providers (Google, Apple) without managing private keys.

### How Keyless Accounts Work

1. Generate an ephemeral (temporary) key pair
2. User authenticates via OAuth provider
3. Derive keyless account from JWT + ephemeral key
4. Sign transactions with the keyless account

### Generate Ephemeral Key Pair

```typescript
import { EphemeralKeyPair } from "@aptos-labs/ts-sdk";

// Generate ephemeral key pair (temporary, session-based)
const ephemeralKeyPair = EphemeralKeyPair.generate();

// The nonce links OAuth flow to this key pair
console.log(`Nonce: ${ephemeralKeyPair.nonce}`);
```

### Build OAuth URL

```typescript
// Google OAuth URL with nonce
const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `redirect_uri=${encodeURIComponent(YOUR_REDIRECT_URI)}` +
  `&response_type=code` +
  `&client_id=${YOUR_CLIENT_ID}` +
  `&scope=openid` +
  `&nonce=${ephemeralKeyPair.nonce}`;

// Redirect user to this URL
window.location.href = googleOAuthUrl;
```

### Derive Keyless Account from JWT

```typescript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.MAINNET }));

// After OAuth callback, you receive a JWT (id_token)
const jwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...";

// Derive the keyless account
const keylessAccount = await aptos.deriveKeylessAccount({
  jwt,
  ephemeralKeyPair,
});

console.log(`Keyless Account Address: ${keylessAccount.accountAddress}`);
```

### Sign Transactions with Keyless Account

```typescript
// Build transaction
const transaction = await aptos.transferCoinTransaction({
  sender: keylessAccount.accountAddress,
  recipient: recipientAddress,
  amount: 1000,
});

// Sign and submit (just like regular accounts)
const result = await aptos.signAndSubmitTransaction({
  signer: keylessAccount,
  transaction,
});

await aptos.waitForTransaction({ transactionHash: result.hash });
```

### Complete Keyless Flow Example

```typescript
import {
  Aptos,
  AptosConfig,
  EphemeralKeyPair,
  Network,
} from "@aptos-labs/ts-sdk";

async function keylessFlow(jwt: string) {
  const aptos = new Aptos(new AptosConfig({ network: Network.MAINNET }));

  // 1. Generate ephemeral key (do this BEFORE OAuth redirect)
  const ephemeralKeyPair = EphemeralKeyPair.generate();

  // 2. After OAuth, derive keyless account
  const account = await aptos.deriveKeylessAccount({
    jwt,
    ephemeralKeyPair,
  });

  console.log(`Address: ${account.accountAddress}`);

  // 3. Use the account like any other
  const balance = await aptos.getAccountAPTAmount({
    accountAddress: account.accountAddress,
  });

  console.log(`Balance: ${balance}`);

  return account;
}
```

### Key Points

- **Ephemeral keys** are temporary and session-based
- **Nonce** links the OAuth flow to your ephemeral key
- **JWT** contains the user's identity from the OAuth provider
- **No private keys** are stored or transmitted
- Works with Google, Apple, and other OIDC providers

---

## PRIVY INTEGRATION (Embedded Wallets)

Privy is a wallet-as-a-service that creates embedded wallets for users without them managing private keys.

### Installation

```bash
npm install @privy-io/react-auth @aptos-labs/ts-sdk
```

### Privy Provider Setup

```tsx
// In _app.tsx or main.tsx
import { PrivyProvider } from "@privy-io/react-auth";

function App() {
  return (
    <PrivyProvider
      appId="your-privy-app-id"
      config={{
        loginMethods: ["email", "google", "twitter"],
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        supportedChains: [
          { type: "aptos", network: "testnet" },
        ],
      }}
    >
      <YourApp />
    </PrivyProvider>
  );
}
```

### Create Aptos Wallet

```tsx
import { usePrivy } from "@privy-io/react-auth";
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";

function WalletComponent() {
  const { authenticated, user } = usePrivy();
  const { createWallet } = useCreateWallet();

  const createAptosWallet = async () => {
    const wallet = await createWallet({
      chainType: "aptos",
    });
    console.log("Wallet created:", wallet);
    return wallet;
  };

  // Get existing wallet from user
  const aptosWallet = user?.linkedAccounts?.find(
    (account: any) => account.chainType === "aptos"
  );

  return (
    <div>
      {!aptosWallet ? (
        <button onClick={createAptosWallet}>Create Aptos Wallet</button>
      ) : (
        <p>Wallet: {aptosWallet.address}</p>
      )}
    </div>
  );
}
```

### Sign and Submit Transaction with Privy

```tsx
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import {
  Aptos,
  AptosConfig,
  Network,
  AccountAddress,
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
} from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

function toHex(bytes: Uint8Array): string {
  return "0x" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function cleanPublicKey(hex: string): string {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  if (hex.length === 66 && hex.startsWith("00")) hex = hex.slice(2);
  return hex;
}

async function sendTransaction(
  signRawHash: any,
  walletAddress: string,
  publicKey: string,
  recipientAddress: string,
  amountApt: number
) {
  // 1. Clean public key
  const cleanedPubKey = cleanPublicKey(publicKey);

  // 2. Build transaction
  const rawTxn = await aptos.transaction.build.simple({
    sender: AccountAddress.from(walletAddress),
    data: {
      function: "0x1::coin::transfer",
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
      functionArguments: [
        AccountAddress.from(recipientAddress),
        BigInt(amountApt * 100_000_000), // APT to octas
      ],
    },
  });

  // 3. Generate signing message
  const message = generateSigningMessageForTransaction(rawTxn);

  // 4. Sign with Privy (raw hash signing)
  const { signature: rawSignature } = await signRawHash({
    address: walletAddress,
    chainType: "aptos",
    hash: toHex(message),
  });

  // 5. Create authenticator
  const senderAuthenticator = new AccountAuthenticatorEd25519(
    new Ed25519PublicKey(cleanedPubKey),
    new Ed25519Signature(rawSignature.slice(2)) // Remove 0x prefix
  );

  // 6. Submit transaction
  const pending = await aptos.transaction.submit.simple({
    transaction: rawTxn,
    senderAuthenticator,
  });

  // 7. Wait for confirmation
  const result = await aptos.waitForTransaction({
    transactionHash: pending.hash,
  });

  return result;
}
```

### Complete Privy Component

```tsx
import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useCreateWallet, useSignRawHash } from "@privy-io/react-auth/extended-chains";

export function PrivyAptosTransfer() {
  const { authenticated, user, login, logout } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { signRawHash } = useSignRawHash();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("1");
  const [status, setStatus] = useState("");

  const aptosWallet = user?.linkedAccounts?.find(
    (acc: any) => acc.chainType === "aptos"
  ) as any;

  const handleSend = async () => {
    if (!aptosWallet) return;

    try {
      setStatus("Sending...");
      const result = await sendTransaction(
        signRawHash,
        aptosWallet.address,
        aptosWallet.publicKey,
        recipient,
        parseFloat(amount)
      );
      setStatus(`Success! Hash: ${result.hash}`);
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      {!authenticated ? (
        <button onClick={login}>Connect with Privy</button>
      ) : (
        <>
          <p>Wallet: {aptosWallet?.address || "Not created"}</p>
          {!aptosWallet && (
            <button onClick={() => createWallet({ chainType: "aptos" })}>
              Create Wallet
            </button>
          )}
          {aptosWallet && (
            <div>
              <input
                placeholder="Recipient address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <input
                type="number"
                placeholder="Amount (APT)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button onClick={handleSend}>Send APT</button>
              <p>{status}</p>
            </div>
          )}
          <button onClick={logout}>Logout</button>
        </>
      )}
    </div>
  );
}
```

### Key Points

- **`useCreateWallet`** creates embedded wallets
- **`useSignRawHash`** signs transaction hashes
- **`generateSigningMessageForTransaction`** creates the signing message
- **`AccountAuthenticatorEd25519`** creates the authenticator from signature
- Clean public key by removing `0x` prefix and extra bytes

---

## ERROR HANDLING

```typescript
import { AptosApiError } from "@aptos-labs/ts-sdk";

try {
  const result = await aptos.signAndSubmitTransaction({
    signer: account,
    transaction,
  });
  await aptos.waitForTransaction({ transactionHash: result.hash });
} catch (error) {
  if (error instanceof AptosApiError) {
    console.error("API Error:", error.message);
    console.error("Status:", error.status);
    console.error("Error Code:", error.errorCode);
  } else {
    console.error("Unknown error:", error);
  }
}
```

---

## COMPLETE EXAMPLE: TRANSFER APP

```typescript
import {
  Account,
  Aptos,
  AptosConfig,
  Network,
} from "@aptos-labs/ts-sdk";

async function main() {
  console.log("=== Aptos Transfer Example ===\n");

  // Setup
  const config = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(config);

  // Create accounts
  const alice = Account.generate();
  const bob = Account.generate();

  console.log(`Alice: ${alice.accountAddress}`);
  console.log(`Bob: ${bob.accountAddress}`);

  // Fund accounts
  console.log("\nFunding accounts...");
  await aptos.fundAccount({
    accountAddress: alice.accountAddress,
    amount: 100_000_000,
  });
  await aptos.fundAccount({
    accountAddress: bob.accountAddress,
    amount: 100,
  });

  // Check balances before
  const aliceBefore = await aptos.getAccountAPTAmount({
    accountAddress: alice.accountAddress,
  });
  const bobBefore = await aptos.getAccountAPTAmount({
    accountAddress: bob.accountAddress,
  });
  console.log(`\nBefore transfer:`);
  console.log(`Alice: ${aliceBefore} octas`);
  console.log(`Bob: ${bobBefore} octas`);

  // Build transaction
  const transaction = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [bob.accountAddress, 1_000_000],
    },
  });

  // Sign and submit
  const senderAuth = aptos.transaction.sign({
    signer: alice,
    transaction,
  });

  const submitted = await aptos.transaction.submit.simple({
    transaction,
    senderAuthenticator: senderAuth,
  });

  console.log(`\nTransaction submitted: ${submitted.hash}`);

  // Wait for confirmation
  const result = await aptos.waitForTransaction({
    transactionHash: submitted.hash,
  });

  console.log(`Transaction ${result.success ? "succeeded" : "failed"}`);

  // Check balances after
  const aliceAfter = await aptos.getAccountAPTAmount({
    accountAddress: alice.accountAddress,
  });
  const bobAfter = await aptos.getAccountAPTAmount({
    accountAddress: bob.accountAddress,
  });

  console.log(`\nAfter transfer:`);
  console.log(`Alice: ${aliceAfter} octas`);
  console.log(`Bob: ${bobAfter} octas`);
  console.log(`\nBob received: ${bobAfter - bobBefore} octas`);
}

main().catch(console.error);
```

---

## QUICK REFERENCE

### Networks

| Network | Usage |
|---------|-------|
| `Network.MAINNET` | Production |
| `Network.TESTNET` | Development/Testing |
| `Network.DEVNET` | Bleeding edge |
| `Network.LOCAL` | Local node |

### Common Functions

| Function | Description |
|----------|-------------|
| `aptos.getAccountInfo()` | Account info |
| `aptos.getAccountAPTAmount()` | APT balance |
| `aptos.getAccountResources()` | All resources |
| `aptos.getAccountOwnedTokens()` | NFTs owned |
| `aptos.fundAccount()` | Fund from faucet |
| `aptos.transaction.build.simple()` | Build transaction |
| `aptos.transaction.sign()` | Sign transaction |
| `aptos.transaction.submit.simple()` | Submit transaction |
| `aptos.waitForTransaction()` | Wait for confirmation |
| `aptos.view()` | Call view function |

### Account Generation

| Method | Use Case |
|--------|----------|
| `Account.generate()` | New random account |
| `Account.fromPrivateKey()` | From private key |
| `Account.fromDerivationPath()` | From mnemonic (HD) |
| `aptos.deriveAccountFromPrivateKey()` | With key rotation |

---

## RESOURCES

- **SDK Docs**: https://aptos.dev/sdks/ts-sdk
- **API Reference**: https://aptos-labs.github.io/aptos-ts-sdk
- **GitHub**: https://github.com/aptos-labs/aptos-ts-sdk
- **NPM**: https://www.npmjs.com/package/@aptos-labs/ts-sdk
- **Examples**: https://github.com/aptos-labs/aptos-ts-sdk/tree/main/examples

---

*Skill created by Nisarg Thakkar*
