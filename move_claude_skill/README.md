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
| aptos-ts-sdk | Coming Soon | Aptos TypeScript SDK integration |
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
│   │   └── examples/
│   │       └── aptos/
│   │           ├── basic_message.move
│   │           ├── token_vesting.move
│   │           ├── random_nft.move
│   │           ├── package_manager.move
│   │           ├── coin_wrapper.move
│   │           ├── liquidity_pool.move
│   │           ├── simple_dex.move
│   │           ├── Move.toml.template
│   │           └── THIRD_PARTY_DEPENDENCIES.md
│   │
│   ├── aptos-ts-sdk/             # (Coming Soon)
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

## Roadmap

### Phase 1: Move Smart Contracts (Current)
- [x] Aptos Move contracts
- [ ] Movement Move contracts
- [ ] Supra Move contracts

### Phase 2: SDK Integration
- [ ] Aptos TypeScript SDK
- [ ] Movement SDK
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
