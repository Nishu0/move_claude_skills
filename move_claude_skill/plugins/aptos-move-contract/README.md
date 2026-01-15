# Aptos Move Contract Plugin

**Author:** Nisarg Thakkar
**Version:** 1.0.0

A comprehensive Claude Code plugin for Aptos Move smart contract development.

---

## Features

- **Quick Start Guide**: Initialize projects, compile, test, and deploy
- **Module Templates**: Ready-to-use Move module boilerplate
- **Advanced Patterns**:
  - On-chain randomness (NFT minting)
  - Token vesting / locked staking
  - ve(3,3) DEX / Liquidity pools
  - Third-party contract dependencies

---

## Usage

Once the plugin is installed, you can ask Claude:

- "Help me write an Aptos Move module"
- "Create a token vesting contract in Move"
- "How do I use on-chain randomness in Aptos?"
- "Show me how to integrate with external DEXs"

---

## Examples Included

| Example | Description |
|---------|-------------|
| `basic_message.move` | Simple resource storage with CRUD operations |
| `token_vesting.move` | Time-locked token distribution system |
| `random_nft.move` | Random NFT generation using Aptos randomness |
| **ve(3,3) DEX** | Complete decentralized exchange (see below) |
| **Third-Party Dependencies** | Multidex router guide (see below) |

---

## ve(3,3) DEX Example (Multi-Module)

A complete ve(3,3) DEX implementation demonstrating the voting escrow model where users lock tokens for governance power that increases with both amount and duration.

| Module | Purpose |
|--------|---------|
| `package_manager.move` | Controls protocol permissions and resource account access |
| `coin_wrapper.move` | Coin ↔ Fungible asset conversion (internal only) |
| `liquidity_pool.move` | Core AMM (volatile: k=x*y, stable: k=x³y+xy³) |
| `simple_dex.move` (router) | User-facing swap/liquidity interface |

**Key Features:**
- Dual-mode pools (volatile & stable pairs)
- Separate swap fees from reserves (non-compounding)
- Friend-only functions for internal operations
- LP token routing for accurate fee accounting

---

## Third-Party Dependencies Guide

See `examples/aptos/THIRD_PARTY_DEPENDENCIES.md` for a complete tutorial on:

| Topic | Description |
|-------|-------------|
| **Why Dependencies** | Atomic composition, sanity checks, state control |
| **Git Dependencies** | Reference code from GitHub repositories |
| **Local Dependencies** | Download and use on-chain source code |
| **Invoking External Code** | Call Liquidswap, PancakeSwap, etc. |
| **Multidex Router** | Complete multi-DEX implementation |

**Quick Example:**

```bash
# Download external package
aptos move download \
  --account 0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa \
  --package PancakeSwap
```

```toml
# Add to Move.toml
[dependencies.PancakeSwap]
local = './third_party_dependencies/PancakeSwap'

[dependencies.Liquidswap]
git = 'https://github.com/pontem-network/liquidswap.git'
rev = 'main'
```

---

## Quick Start: Aptos Move

```bash
# 1. Install Aptos CLI
# Visit: https://aptos.dev/en/build/cli

# 2. Create project directory
mkdir my-move-project && cd my-move-project

# 3. Initialize Aptos account (creates .aptos/config.yaml)
aptos init

# 4. Initialize Move module
aptos move init --name my_module

# 5. Create your module in sources/
# Copy from examples or write your own

# 6. Update Move.toml with your address
# Replace: my_module = "_"
# With: my_module = "0xYOUR_ADDRESS"

# 7. Compile
aptos move compile --named-addresses my_module=default

# 8. Test
aptos move test --named-addresses my_module=default

# 9. Publish
aptos move publish --named-addresses my_module=default
```

---

## File Structure

```
aptos-move-contract/
├── skill.json                    # Plugin manifest
├── prompt.md                     # Main skill prompt
├── README.md                     # This file
└── examples/
    └── aptos/
        ├── Move.toml.template    # Project configuration template
        ├── basic_message.move    # Simple storage example
        ├── token_vesting.move    # Vesting contract example
        ├── random_nft.move       # Randomness example
        │
        │   # ve(3,3) DEX (4 modules)
        ├── package_manager.move  # Protocol permissions
        ├── coin_wrapper.move     # Coin ↔ FA conversion
        ├── liquidity_pool.move   # Core AMM
        ├── simple_dex.move       # Router interface
        │
        │   # Third-Party Dependencies
        └── THIRD_PARTY_DEPENDENCIES.md
```

---

## Move Language Key Concepts

### Resource Abilities

```move
struct MyResource has key, store, copy, drop { ... }
```

- **key**: Stored as top-level resource in global storage
- **store**: Can be stored inside other resources
- **copy**: Can be copied/duplicated
- **drop**: Can be discarded/destroyed

### Function Annotations

```move
// Entry point for transactions
public entry fun my_function(account: &signer) { }

// Read-only view function
#[view]
public fun get_value(): u64 { }

// Required for randomness API
#[randomness]
entry fun mint_random() { }

// Test function
#[test(sender = @module_addr)]
fun test_something(sender: &signer) { }
```

---

## Resources

- **Aptos Documentation**: https://aptos.dev
- **Move Book**: https://aptos.dev/build/smart-contracts/book
- **Aptos Explorer**: https://explorer.aptoslabs.com
- **Code Examples**: https://learn.aptoslabs.com/en/code-examples
- **VSCode Extension**: Search "Move On Aptos" in extensions

---

*Created by Nisarg Thakkar*
