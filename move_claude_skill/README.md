# Move Claude Skills

**Author:** Nisarg Thakkar
**Email:** itsthakkarnisarg@gmail.com
**Version:** 1.0.0

A collection of Claude Code plugins for Move smart contract and blockchain development on Aptos, Movement, and Supra ecosystems.

---

## Available Plugins

| Plugin | Status | Description |
|--------|--------|-------------|
| [aptos-move-contract](./plugins/aptos-move-contract) | Active | Aptos Move smart contract development |
| [aptos-ts-sdk](./plugins/aptos-ts-sdk) | Active | Aptos TypeScript SDK for dApps |
| movement-move-contract | Coming Soon | Movement L2 Move contracts |
| supra-move-contract | Coming Soon | Supra blockchain Move contracts |

---

## Installation

### Option 1: Clone and Configure

```bash
# Clone the repository
git clone https://github.com/nisargthakkar/move-claude-skills.git

# Add to Claude Code settings (~/.claude/settings.json)
```

```json
{
  "plugins": [
    {
      "path": "/path/to/move-claude-skills"
    }
  ]
}
```

### Option 2: Project-Level Installation

Add to your project's `.claude/settings.json`:

```json
{
  "plugins": [
    {
      "path": "../move-claude-skills"
    }
  ]
}
```

---

## Plugin Structure

```
move_claude_skill/
├── .claude-plugin/
│   └── marketplace.json          # Plugin registry manifest
├── plugins/
│   ├── aptos-move-contract/      # Aptos Move smart contracts
│   │   ├── skill.json
│   │   ├── prompt.md
│   │   └── examples/aptos/
│   │       ├── basic_message.move
│   │       ├── token_vesting.move
│   │       ├── random_nft.move
│   │       ├── ve(3,3) DEX modules...
│   │       └── THIRD_PARTY_DEPENDENCIES.md
│   │
│   ├── aptos-ts-sdk/             # Aptos TypeScript SDK
│   │   ├── skill.json
│   │   ├── prompt.md
│   │   └── examples/
│   │       ├── 01-setup.ts
│   │       ├── 02-accounts.ts
│   │       ├── 03-transactions.ts
│   │       ├── 04-reading-data.ts
│   │       ├── 05-tokens-nfts.ts
│   │       └── 06-advanced.ts
│   │
│   ├── movement-move-contract/   # (Coming Soon)
│   └── supra-move-contract/      # (Coming Soon)
└── README.md                     # This file
```

---

## Current Plugin: aptos-move-contract

Comprehensive Aptos Move smart contract development guide.

### Features

- **Quick Start Guide**: CLI installation, project init, compile, test, deploy
- **Module Templates**: Ready-to-use Move boilerplate
- **Advanced Patterns**:
  - On-chain randomness (NFT minting)
  - Token vesting / locked staking
  - ve(3,3) DEX / Liquidity pools
  - Third-party contract dependencies

### Examples Included

| Example | Description |
|---------|-------------|
| `basic_message.move` | Simple resource storage with CRUD |
| `token_vesting.move` | Time-locked token distribution |
| `random_nft.move` | On-chain randomness for NFTs |
| **ve(3,3) DEX** | 4-module decentralized exchange |
| **Third-Party Guide** | Multidex router integration |

### Quick Start

```bash
# Initialize Aptos project
aptos init
aptos move init --name my_module

# Compile & Test
aptos move compile --named-addresses my_module=default
aptos move test --named-addresses my_module=default

# Deploy
aptos move publish --named-addresses my_module=default
```

See [plugins/aptos-move-contract/README.md](./plugins/aptos-move-contract/README.md) for full documentation.

---

## Plugin: aptos-ts-sdk

TypeScript SDK for building Aptos dApps.

### Features

- **Installation**: npm, pnpm, yarn, bun, browser CDN
- **Client Setup**: Network configuration (testnet, mainnet, devnet)
- **Account Management**: Ed25519, Secp256k1, HD wallets
- **Transactions**: Build, simulate, sign, submit, wait
- **Data Reading**: Accounts, resources, modules, tokens, events
- **Advanced**: Multi-agent, sponsored transactions, NFT operations

### Quick Start

```typescript
import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
const account = Account.generate();

// Fund account (testnet)
await aptos.fundAccount({ accountAddress: account.accountAddress, amount: 100_000_000 });

// Send transaction
const tx = await aptos.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: "0x1::aptos_account::transfer",
    functionArguments: [recipientAddress, 100],
  },
});
const auth = aptos.transaction.sign({ signer: account, transaction: tx });
const result = await aptos.transaction.submit.simple({ transaction: tx, senderAuthenticator: auth });
```

See [plugins/aptos-ts-sdk/README.md](./plugins/aptos-ts-sdk/README.md) for full documentation.

---

## Roadmap

### Phase 1: Aptos Ecosystem (Complete)
- [x] Aptos Move contracts
- [x] Aptos TypeScript SDK

### Phase 2: Movement & Supra
- [ ] Movement Move contracts
- [ ] Movement SDK
- [ ] Supra Move contracts
- [ ] Supra SDK

### Phase 3: Full-Stack Templates
- [ ] dApp templates with frontend + contracts
- [ ] Testing frameworks
- [ ] Deployment automation

---

## Contributing

Feel free to submit issues and enhancement requests.

## License

MIT License

---

*Created by Nisarg Thakkar*
