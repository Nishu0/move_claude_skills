---
name: aptos-move-contract
description: Move smart contract development for Aptos blockchain
author: Nisarg Thakkar
version: 1.0.0
---

You are an expert Move smart contract developer specializing in Aptos, Movement, and Supra blockchains. Help users write, test, deploy, and interact with Move smart contracts.

---

## APTOS MOVE DEVELOPMENT

### Quick Start Commands

```bash
# Install Aptos CLI (verify with: aptos --version)
# Initialize a new project directory
mkdir my-move-project && cd my-move-project
aptos init

# Initialize Move module
aptos move init --name my_module

# Compile module
aptos move compile --named-addresses my_module=default

# Run tests
aptos move test --named-addresses my_module=default

# Publish to network
aptos move publish --named-addresses my_module=default
```

### Project Structure

```
my-move-project/
├── .aptos/
│   └── config.yaml          # Account credentials, private/public keys
├── sources/
│   ├── my_module.move       # Main module code
│   └── my_module_tests.move # Test file
├── Move.toml                # Package configuration
└── scripts/                 # Optional deployment scripts
```

### Move.toml Configuration

```toml
[package]
name = "my_module"
version = "0.0.1"

[dependencies]
AptosFramework = { git = "https://github.com/aptos-labs/aptos-framework.git", subdir = "aptos-framework", rev = "mainnet" }
AptosStdlib = { git = "https://github.com/aptos-labs/aptos-framework.git", subdir = "aptos-stdlib", rev = "mainnet" }
MoveStdlib = { git = "https://github.com/aptos-labs/aptos-framework.git", subdir = "move-stdlib", rev = "mainnet" }

[addresses]
my_module = "_"
```

**Important:** Replace `my_module = "_"` with your actual address after running `aptos init`:
```toml
my_module = "0xYOUR_ADDRESS_FROM_APTOS_INIT"
```

---

## MOVE LANGUAGE FUNDAMENTALS

### Resource Abilities

Move resources have four abilities:
- **key**: Can be stored as a top-level resource in global storage
- **store**: Can be stored inside other resources
- **copy**: Can be copied/duplicated
- **drop**: Can be discarded/destroyed

```move
struct MyResource has key, store, drop {
    value: u64,
}
```

### Core Operations

```move
// Store resource under account
move_to(account, MyResource { value: 100 });

// Check if resource exists
exists<MyResource>(account_addr);

// Borrow immutable reference
let resource_ref = borrow_global<MyResource>(account_addr);

// Borrow mutable reference
let resource_mut = borrow_global_mut<MyResource>(account_addr);

// Remove resource from account
let resource = move_from<MyResource>(account_addr);
```

### Function Types

```move
// Entry function - callable via transactions
public entry fun my_entry_fn(account: &signer) { }

// View function - read-only, no state changes
#[view]
public fun get_value(addr: address): u64 { }

// Internal function
fun internal_helper(): u64 { }

// Friend function - accessible by friend modules
public(friend) fun friend_only_fn() { }
```

---

## BASIC MODULE TEMPLATE

```move
module my_module::message {
    use std::string::{Self, String};
    use std::signer;

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_EXISTS: u64 = 2;

    /// Resource to store message
    struct MessageHolder has key, store, drop {
        message: String,
    }

    /// Initialize or update message for caller
    public entry fun set_message(account: &signer, message: String)
        acquires MessageHolder
    {
        let account_addr = signer::address_of(account);

        if (exists<MessageHolder>(account_addr)) {
            // Update existing
            let holder = borrow_global_mut<MessageHolder>(account_addr);
            holder.message = message;
        } else {
            // Create new
            move_to(account, MessageHolder { message });
        }
    }

    /// Get message for an address
    #[view]
    public fun get_message(account_addr: address): String
        acquires MessageHolder
    {
        assert!(exists<MessageHolder>(account_addr), E_NOT_INITIALIZED);
        borrow_global<MessageHolder>(account_addr).message
    }
}
```

---

## TESTING TEMPLATE

```move
#[test_only]
module my_module::message_tests {
    use std::string;
    use std::signer;
    use my_module::message;

    #[test(sender = @my_module)]
    fun test_set_and_get_message(sender: &signer) {
        message::set_message(sender, string::utf8(b"Hello World"));
        let stored = message::get_message(signer::address_of(sender));
        assert!(stored == string::utf8(b"Hello World"), 0);
    }

    #[test(sender = @my_module)]
    fun test_update_message(sender: &signer) {
        message::set_message(sender, string::utf8(b"First"));
        message::set_message(sender, string::utf8(b"Second"));
        let stored = message::get_message(signer::address_of(sender));
        assert!(stored == string::utf8(b"Second"), 0);
    }

    #[test(sender = @my_module)]
    #[expected_failure(abort_code = 1)]
    fun test_get_nonexistent_fails(sender: &signer) {
        // Should fail - no message set
        message::get_message(signer::address_of(sender));
    }
}
```

---

## ADVANCED PATTERNS

### 1. On-Chain Randomness

```move
module my_module::random_nft {
    use aptos_framework::randomness;

    const BODY_MAX: u8 = 5;
    const EAR_MAX: u8 = 6;
    const FACE_MAX: u8 = 4;

    struct NFTParts has store, drop {
        body: u8,
        ear: u8,
        face: u8,
    }

    /// IMPORTANT: #[randomness] annotation required!
    #[randomness]
    entry fun mint_random_nft(user: &signer) {
        let parts = NFTParts {
            body: randomness::u8_range(0, BODY_MAX),
            ear: randomness::u8_range(0, EAR_MAX),
            face: randomness::u8_range(0, FACE_MAX),
        };
        // Store or mint NFT with these parts
    }
}
```

### 2. Token Vesting / Locked Staking

```move
module my_module::vesting {
    use std::signer;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_std::smart_table::{Self, SmartTable};

    struct Lock has store {
        coins: Coin<AptosCoin>,
        principal: u64,
        unlock_time: u64,
    }

    struct SponsorLocks has key {
        locks: SmartTable<address, Lock>,
        withdrawal_addr: address,
        active_count: u64,
    }

    /// Sponsor creates a lock for recipient
    public entry fun create_lock(
        sponsor: &signer,
        recipient: address,
        amount: u64,
        unlock_time: u64
    ) acquires SponsorLocks {
        let sponsor_addr = signer::address_of(sponsor);
        let coins = coin::withdraw<AptosCoin>(sponsor, amount);

        let locks = borrow_global_mut<SponsorLocks>(sponsor_addr);
        smart_table::add(&mut locks.locks, recipient, Lock {
            coins,
            principal: amount,
            unlock_time,
        });
        locks.active_count = locks.active_count + 1;
    }

    /// Recipient claims after unlock time
    public entry fun claim(recipient: &signer) acquires SponsorLocks {
        let now = timestamp::now_seconds();
        // Verify unlock_time passed, transfer coins to recipient
    }
}
```

### 3. DEX / Liquidity Pool Pattern

```move
module my_module::liquidity_pool {
    use aptos_framework::fungible_asset::{Self, FungibleAsset};

    struct Pool<phantom X, phantom Y> has key {
        reserve_x: u64,
        reserve_y: u64,
        lp_supply: u64,
        fee_percent: u64,
    }

    /// Constant product AMM: k = x * y
    public fun swap<X, Y>(
        pool: &mut Pool<X, Y>,
        amount_in: u64,
        is_x_to_y: bool
    ): u64 {
        let (reserve_in, reserve_out) = if (is_x_to_y) {
            (pool.reserve_x, pool.reserve_y)
        } else {
            (pool.reserve_y, pool.reserve_x)
        };

        // Apply fee
        let amount_in_with_fee = amount_in * (10000 - pool.fee_percent) / 10000;

        // Calculate output: dy = y * dx / (x + dx)
        let amount_out = (reserve_out * amount_in_with_fee) /
                         (reserve_in + amount_in_with_fee);

        // Update reserves
        if (is_x_to_y) {
            pool.reserve_x = pool.reserve_x + amount_in;
            pool.reserve_y = pool.reserve_y - amount_out;
        } else {
            pool.reserve_y = pool.reserve_y + amount_in;
            pool.reserve_x = pool.reserve_x - amount_out;
        };

        amount_out
    }
}
```

### 3.1 ve(3,3) DEX - Complete Multi-Module Architecture

The ve(3,3) model is a voting escrow system where users lock tokens for governance power that increases with both amount and duration. A complete DEX implementation requires multiple interconnected modules:

**Module Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    simple_dex::router                        │
│  (User-facing interface - swaps, add/remove liquidity)      │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐
│  coin_wrapper   │ │liquidity_pool │ │ package_manager │
│ (Coin↔FA wrap)  │ │ (Core AMM)    │ │ (Permissions)   │
└─────────────────┘ └───────────────┘ └─────────────────┘
```

**1. package_manager.move** - Protocol Permissions
```move
module simple_dex::package_manager {
    use aptos_framework::object::{Self, ExtendRef};

    struct PermissionConfig has key {
        extend_ref: ExtendRef,
        addresses: SimpleMap<String, address>,
    }

    // Only friends can get the protocol signer
    public(friend) fun get_signer(): signer { ... }
}
```

**2. coin_wrapper.move** - Coin ↔ Fungible Asset Conversion
```move
module simple_dex::coin_wrapper {
    /// INTERNAL ONLY - wrapper assets stay within protocol
    public fun wrap<CoinType>(coin: Coin<CoinType>): FungibleAsset { ... }
    public fun unwrap<CoinType>(fa: FungibleAsset): Coin<CoinType> { ... }
    public fun create_fungible_asset<CoinType>(): Object<Metadata> { ... }
}
```

**3. liquidity_pool.move** - Core AMM
```move
module simple_dex::liquidity_pool {
    struct LiquidityPool has key {
        token_1: Object<Metadata>,
        token_2: Object<Metadata>,
        is_stable: bool,
        // Reserves, fees, LP supply...
    }

    /// Volatile: k = x * y
    /// Stable:  k = x³y + xy³
    public fun swap(pool: Object<LiquidityPool>, in: FungibleAsset): FungibleAsset { ... }
    public fun mint(lp: &signer, token_1: FungibleAsset, token_2: FungibleAsset, is_stable: bool) { ... }
    public fun burn(lp: &signer, ...): (FungibleAsset, FungibleAsset) { ... }
}
```

**4. simple_dex.move (router)** - User Interface
```move
module simple_dex::router {
    // Supports all combinations:
    public entry fun swap_entry(...) { ... }                    // FA → FA
    public entry fun swap_coin_for_asset_entry<C>(...) { ... }  // Coin → FA
    public entry fun swap_asset_for_coin_entry<C>(...) { ... }  // FA → Coin
    public entry fun swap_coin_for_coin_entry<C1, C2>(...) { }  // Coin → Coin

    // Liquidity management with slippage protection
    public entry fun add_liquidity_entry(...) { ... }
    public entry fun remove_liquidity_entry(...) { ... }
}
```

**Key Design Patterns:**
- `friend` functions for internal-only operations
- Wrapper assets never leave the protocol
- Separate fee tracking from reserves (non-compounding)
- LP tokens routed through module for fee accounting

### 4. Third-Party Contract Dependencies (Multidex Router)

> **Full Guide:** See `examples/aptos/THIRD_PARTY_DEPENDENCIES.md` for complete tutorial

#### Why Use Third-Party Dependencies?

| Use Case | Example |
|----------|---------|
| **Atomic composition** | Buy ANS name + set as primary in one TX |
| **Sanity checks** | Verify balance limits before/after NFT purchase |
| **State control** | Interact between your contract and external state |

#### Two Methods to Add Dependencies

**Method 1: Git Repository**
```toml
[dependencies.Liquidswap]
git = 'https://github.com/pontem-network/liquidswap.git'
rev = 'main'

[dependencies.LiquidswapRouterV2]
git = 'https://github.com/pontem-network/liquidswap.git'
subdir = 'liquidswap_router_v2/'
rev = 'main'
```

**Method 2: Downloaded Local Source**
```bash
# Download on-chain source code
mkdir third_party_dependencies && cd third_party_dependencies
aptos move download \
  --account 0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa \
  --package PancakeSwap
```

```toml
# Add to Move.toml
[dependencies.PancakeSwap]
local = './third_party_dependencies/PancakeSwap'
```

#### Invoking External Functions

```move
module my_module::multidex_router {
    use std::signer;
    use aptos_framework::coin::{Self, Coin};
    use liquidswap::router_v2;
    use pancake::router;

    /// Atomic route: Liquidswap -> PancakeSwap
    public entry fun liquid_to_pancake_route<Primary, Intermediary, Curve>(
        account: &signer,
        amount_in: u64
    ) {
        let coins = coin::withdraw<Primary>(account, amount_in);

        // Step 1: Swap via Liquidswap
        let amount_out = router_v2::get_amount_out<Primary, Intermediary, Curve>(amount_in);
        let received = router_v2::swap_exact_coin_for_coin<Primary, Intermediary, Curve>(
            coins,
            amount_out
        );
        coin::deposit(signer::address_of(account), received);

        // Step 2: Swap via PancakeSwap
        router::swap_exact_input<Intermediary, Primary>(account, amount_out, 0);
    }
}
```

#### Deploy & Execute

```bash
# Deploy
aptos move publish \
  --named-addresses simple_multidex_router_addr=default \
  --assume-yes

# Execute route
aptos move run \
  --function-id 'default::multidex_router::liquid_to_pancake_route' \
  --type-args '0x1::aptos_coin::AptosCoin' '0x...::usdc::USDC' '0x...::curves::Uncorrelated' \
  --args u64:1000000

# Simulate locally (add --local)
aptos move run --function-id '...' --type-args '...' --args u64:1000000 --local
```

#### Quick Reference: Common DEX Functions

| DEX | Function | Purpose |
|-----|----------|---------|
| Liquidswap | `router_v2::get_amount_out<X,Y,C>` | Calculate expected output |
| Liquidswap | `router_v2::swap_exact_coin_for_coin<X,Y,C>` | Execute swap |
| PancakeSwap | `router::swap_exact_input<X,Y>` | Swap with exact input |

---

## CLI INTERACTION

```bash
# Call entry function
aptos move run \
  --function-id 'default::message::set_message' \
  --args 'string:Hello Aptos!'

# Call with type arguments
aptos move run \
  --function-id 'ADDR::module::function' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --args u64:1000

# View function call
aptos move view \
  --function-id 'default::message::get_message' \
  --args 'address:0xYOUR_ADDRESS'

# Check account resources
aptos account list --account default
```

---

## DEBUGGING

```move
use std::debug;

public entry fun my_function(value: u64) {
    debug::print(&value);
    debug::print(&string::utf8(b"Debug message"));
}
```

Run tests to see debug output:
```bash
aptos move test --named-addresses my_module=default
```

---

## COMMON PATTERNS CHECKLIST

- [ ] Use `acquires` keyword when accessing global storage
- [ ] Define error constants with `const E_*: u64 = N`
- [ ] Use `#[view]` for read-only functions
- [ ] Use `#[randomness]` for functions using randomness API
- [ ] Use `#[test_only]` for test modules
- [ ] Use `#[expected_failure]` for negative test cases
- [ ] Store addresses in Move.toml under `[addresses]`

---

## NETWORK SELECTION

```bash
# Devnet (default for testing)
aptos init --network devnet

# Testnet
aptos init --network testnet

# Mainnet (production)
aptos init --network mainnet
```

---

## RESOURCES

- **Aptos Docs:** https://aptos.dev
- **Move Book:** https://aptos.dev/build/smart-contracts/book
- **Aptos Explorer:** https://explorer.aptoslabs.com
- **Code Examples:** https://learn.aptoslabs.com/en/code-examples
- **VSCode Extension:** "Move On Aptos"

---

## COMING SOON

### Movement Move
Movement is an L2 built on Aptos Move. Support coming soon.

### Supra Move
Supra blockchain Move support coming soon.

---

*Skill created by Nisarg Thakkar*
