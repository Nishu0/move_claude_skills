# Aptos TypeScript SDK Plugin

**Author:** Nisarg Thakkar
**Version:** 1.0.0

A comprehensive Claude Code plugin for building dApps with the Aptos TypeScript SDK.

---

## Features

- **Installation Guide**: npm, yarn, pnpm, bun, and browser setup
- **Client Configuration**: Network setup and Aptos client initialization
- **Account Management**: Generate, derive, and manage accounts (Ed25519, Secp256k1)
- **Transaction Handling**: Build, simulate, sign, and submit transactions
- **Data Reading**: Query accounts, modules, tokens, and resources
- **Advanced Patterns**: Multi-agent, sponsored transactions, and view functions

---

## Usage

Once the plugin is installed, you can ask Claude:

- "How do I install the Aptos TypeScript SDK?"
- "Show me how to generate an Aptos account"
- "Help me send a transaction on Aptos"
- "How do I read account data from the Aptos blockchain?"

---

## Quick Start

### Installation

```bash
# npm
npm install @aptos-labs/ts-sdk

# pnpm
pnpm install @aptos-labs/ts-sdk

# yarn
yarn add @aptos-labs/ts-sdk

# bun
bun add @aptos-labs/ts-sdk
```

### Basic Setup

```typescript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);
```

### Generate Account

```typescript
import { Account } from "@aptos-labs/ts-sdk";

const account = Account.generate();
console.log(`Address: ${account.accountAddress}`);
```

### Send Transaction

```typescript
const transaction = await aptos.transaction.build.simple({
  sender: alice.accountAddress,
  data: {
    function: "0x1::aptos_account::transfer",
    functionArguments: [bob.accountAddress, 100],
  },
});

const senderAuth = aptos.transaction.sign({ signer: alice, transaction });
const result = await aptos.transaction.submit.simple({ transaction, senderAuthenticator: senderAuth });
await aptos.waitForTransaction({ transactionHash: result.hash });
```

---

## Examples Included

| Example | Description |
|---------|-------------|
| `01-setup.ts` | SDK installation and client setup |
| `02-accounts.ts` | Account generation and derivation |
| `03-transactions.ts` | Build, sign, and submit transactions |
| `04-reading-data.ts` | Query blockchain data |
| `05-tokens-nfts.ts` | Token and NFT operations |
| `06-advanced.ts` | Multi-agent and sponsored transactions |
| `07-sponsored-transaction.ts` | Fee payer example (Alice sends, Sponsor pays gas) |
| `08-keyless-account.ts` | OAuth/Google login keyless accounts |
| `09-privy-integration.tsx` | Privy embedded wallet integration (React) |

---

## File Structure

```
aptos-ts-sdk/
├── skill.json
├── prompt.md
├── README.md
└── examples/
    ├── 01-setup.ts
    ├── 02-accounts.ts
    ├── 03-transactions.ts
    ├── 04-reading-data.ts
    ├── 05-tokens-nfts.ts
    ├── 06-advanced.ts
    ├── 07-sponsored-transaction.ts
    ├── 08-keyless-account.ts
    └── 09-privy-integration.tsx
```

---

## Resources

- **SDK Documentation**: https://aptos.dev/sdks/ts-sdk
- **API Reference**: https://aptos-labs.github.io/aptos-ts-sdk
- **GitHub**: https://github.com/aptos-labs/aptos-ts-sdk
- **NPM Package**: https://www.npmjs.com/package/@aptos-labs/ts-sdk

---

*Created by Nisarg Thakkar*
