# Third-Party Smart Contract Dependencies in Move

**Author:** Alex (Aptos Labs)
**Adapted for:** move_claude_skill by Nisarg Thakkar

Learn how to invoke externally created smart contract methods from within your Move code. This guide covers defining dependencies through different code sources and calling third-party code during execution.

---

## Table of Contents

1. [When Do We Need Dependencies](#1-when-do-we-need-dependencies)
2. [What is a Multidex Router](#2-what-is-a-multidex-router)
3. [Establishing Dependencies](#3-establishing-dependencies)
4. [Invoking Dependencies](#4-invoking-dependencies)
5. [Full Implementation](#5-full-implementation)
6. [Deployment & Testing](#6-deployment--testing)

---

## 1. When Do We Need Dependencies

### Why Rely on External Contracts?

| Use Case | Example |
|----------|---------|
| **Atomic composition** | When buying an ANS name, immediately set it as your primary |
| **Sanity checks** | Before/after purchasing an NFT, verify balance is within limits |
| **State interactions** | Control interactions between your contract state and others |

Third-party dependencies allow you to "glue" together multiple smart contract invocations atomically - if one fails, they all fail.

---

## 2. What is a Multidex Router

A **Multidex Router** is a smart contract that combines two or more external swap functions into a single entry function call.

### Key Terminology

| Term | Definition |
|------|------------|
| **DEX** | Decentralized Exchange - swap assets without permission (e.g., Liquidswap, PancakeSwap) |
| **Swap** | Action of exchanging one asset for another |
| **Amount Out** | Amount of receiving token you'll get from a swap |
| **Route** | Atomic series of swaps - if one fails, all fail |

### Pseudo-code Example

```move
public entry fun atomic_two_swaps_route() {
    liquidswap::swap(...);
    pancake::swap(...);
}
```

---

## 3. Establishing Dependencies

There are **two main methods** to establish dependencies:

### Method 1: Git Repository Dependency

Use `git`, `subdir`, and `rev` fields to define:
- **git**: Repository URL
- **subdir**: Directory in the repository
- **rev**: Version/branch to use

**Move.toml:**

```toml
[package]
name = "simple_multidex_router"
version = "1.0.0"
authors = []

[addresses]
simple_multidex_router_addr = "_"

[dev-addresses]
simple_multidex_router_addr = "0x803"

[dependencies.AptosFramework]
git = "https://github.com/aptos-labs/aptos-framework"
rev = "mainnet"
subdir = "aptos-move/framework/aptos-framework"

# Liquidswap dependencies (Git-based)
[dependencies.Liquidswap]
git = 'https://github.com/pontem-network/liquidswap.git'
rev = 'main'

[dependencies.LiquidswapRouterV2]
git = 'https://github.com/pontem-network/liquidswap.git'
subdir = 'liquidswap_router_v2/'
rev = 'main'

[dependencies.LiquidswapLP]
git = 'https://github.com/pontem-network/liquidswap.git'
subdir = 'liquidswap_lp/'
rev = 'main'
```

### Method 2: Downloaded Local Source Code

For on-chain source code or decompiled code:

**Step 1: Create a directory for dependencies**

```bash
mkdir third_party_dependencies
cd third_party_dependencies
```

**Step 2: Download the on-chain source code**

```bash
aptos move download \
  --account 0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa \
  --package PancakeSwap
```

**Step 3: Add to Move.toml**

```toml
[dependencies.PancakeSwap]
local = './third_party_dependencies/PancakeSwap'
```

**Step 4: Update downloaded package's Move.toml**

Ensure the `rev` tag matches your AptosFramework dependency:

```toml
[package]
name = "PancakeSwap"
version = "0.0.1"

[dependencies]
AptosFramework = {
    git = "https://github.com/aptos-labs/aptos-framework",
    subdir = "aptos-move/framework/aptos-framework/",
    rev = "mainnet"
}
AptosStdlib = {
    git = "https://github.com/aptos-labs/aptos-framework",
    subdir = "aptos-move/framework/aptos-stdlib/",
    rev = "mainnet"
}
```

### Comparison

| Method | Pros | Cons |
|--------|------|------|
| **Git Repo** | Always up-to-date, easy setup | Requires public repo |
| **Local Source** | Works with any code, full control | Manual updates needed |

---

## 4. Invoking Dependencies

Once dependencies are established, import and use them in your code.

### Step 1: Define Use Aliases

```move
use liquidswap::router_v2;
use pancake::router;
```

### Step 2: Invoke External Functions

#### Liquidswap Example

```move
fun liquidswap_swap<PrimaryToken, IntermediaryToken, Curve>(
    account: &signer,
    amountIn: u64,
    coins_to_swap: Coin<PrimaryToken>
): u64 {
    let account_addr = signer::address_of(account);

    // Get expected output amount
    let coins_to_receive = router_v2::get_amount_out<PrimaryToken, IntermediaryToken, Curve>(
        amountIn
    );

    // Perform the swap
    let coins = router_v2::swap_exact_coin_for_coin<PrimaryToken, IntermediaryToken, Curve>(
        coins_to_swap,
        coins_to_receive
    );

    // Register and deposit received coins
    if (!coin::is_account_registered<IntermediaryToken>(account_addr)) {
        coin::register<IntermediaryToken>(account);
    };
    coin::deposit(account_addr, coins);

    coins_to_receive
}
```

**External functions used:**
- `router_v2::get_amount_out` - Calculate expected output
- `router_v2::swap_exact_coin_for_coin` - Execute the swap

#### PancakeSwap Example

```move
fun pancakeswap_swap<PrimaryToken, IntermediaryToken>(
    account: &signer,
    amountIn: u64
): u64 {
    let account_addr = signer::address_of(account);

    // Track balance change
    let before_balance: u64 = coin::balance<IntermediaryToken>(account_addr);

    // Perform the swap
    router::swap_exact_input<PrimaryToken, IntermediaryToken>(account, amountIn, 0);

    let after_balance: u64 = coin::balance<IntermediaryToken>(account_addr);

    (after_balance - before_balance)
}
```

**External function used:**
- `router::swap_exact_input` - Execute swap with exact input amount

---

## 5. Full Implementation

### Complete Multidex Router Module

```move
module simple_multidex_router_addr::simple_multidex_router {
    use std::signer;
    use aptos_framework::coin::{Self, Coin};
    use liquidswap::router_v2;
    use pancake::router;

    // ============ Entry Functions ============

    /// Route: Liquidswap -> PancakeSwap
    public entry fun liquid_to_pancake_route<PrimaryToken, IntermediaryToken, Curve>(
        account: &signer,
        amountIn: u64
    ) {
        // Withdraw tokens to swap
        let coins_to_swap: Coin<PrimaryToken> =
            coin::withdraw<PrimaryToken>(account, amountIn);

        // First swap through Liquidswap
        let remaining_coins_count = liquidswap_swap<PrimaryToken, IntermediaryToken, Curve>(
            account,
            amountIn,
            coins_to_swap
        );

        // Second swap through PancakeSwap
        _ = pancakeswap_swap<IntermediaryToken, PrimaryToken>(
            account,
            remaining_coins_count
        );
    }

    /// Route: PancakeSwap -> Liquidswap
    public entry fun pancake_to_liquid_route<PrimaryToken, IntermediaryToken, Curve>(
        account: &signer,
        amountIn: u64
    ) {
        let coins_to_swap: Coin<PrimaryToken> =
            coin::withdraw<PrimaryToken>(account, amountIn);

        // First swap through PancakeSwap
        let remaining_coins_count = pancakeswap_swap<IntermediaryToken, PrimaryToken>(
            account,
            amountIn
        );

        // Second swap through Liquidswap
        _ = liquidswap_swap<PrimaryToken, IntermediaryToken, Curve>(
            account,
            remaining_coins_count,
            coins_to_swap
        );
    }

    // ============ Internal Swap Functions ============

    fun liquidswap_swap<PrimaryToken, IntermediaryToken, Curve>(
        account: &signer,
        amountIn: u64,
        coins_to_swap: Coin<PrimaryToken>
    ): u64 {
        let coins_to_receive =
            router_v2::get_amount_out<PrimaryToken, IntermediaryToken, Curve>(amountIn);

        let coins =
            router_v2::swap_exact_coin_for_coin<PrimaryToken, IntermediaryToken, Curve>(
                coins_to_swap,
                coins_to_receive
            );

        let account_addr = signer::address_of(account);

        if (!coin::is_account_registered<IntermediaryToken>(account_addr)) {
            coin::register<IntermediaryToken>(account);
        };
        coin::deposit(account_addr, coins);

        coins_to_receive
    }

    fun pancakeswap_swap<PrimaryToken, IntermediaryToken>(
        account: &signer,
        amountIn: u64
    ): u64 {
        let account_addr = signer::address_of(account);
        let before_balance: u64 = coin::balance<IntermediaryToken>(account_addr);

        router::swap_exact_input<PrimaryToken, IntermediaryToken>(account, amountIn, 0);

        let after_balance: u64 = coin::balance<IntermediaryToken>(account_addr);

        (after_balance - before_balance)
    }
}
```

### Project Structure

```
simple_multidex_router/
├── Move.toml
├── sources/
│   └── simple_multidex_router.move
└── third_party_dependencies/
    └── PancakeSwap/
        ├── Move.toml
        └── sources/
            └── ...
```

---

## 6. Deployment & Testing

### Deploy to Network

```bash
aptos move publish \
  --profile default \
  --named-addresses simple_multidex_router_addr={YOUR_ADDRESS} \
  --assume-yes
```

### Execute a Swap Route

```bash
aptos move run \
  --function-id {DEPLOYED_CONTRACT_ADDRESS}::simple_multidex_router::liquid_to_pancake_route \
  --type-args \
    '{PRIMARY_TOKEN_STRUCT}' \
    '{SECONDARY_TOKEN_STRUCT}' \
    '{CURVE_TYPE_STRUCT}' \
  --args u64:{AMOUNT_IN}
```

### Simulate Locally

Add `--local` flag to simulate without broadcasting:

```bash
aptos move run \
  --function-id {CONTRACT}::simple_multidex_router::liquid_to_pancake_route \
  --type-args '0x1::aptos_coin::AptosCoin' '0x...::usdc::USDC' '0x...::curves::Uncorrelated' \
  --args u64:1000000 \
  --local
```

---

## Quick Reference

### Move.toml Dependency Syntax

```toml
# Git repository
[dependencies.PackageName]
git = 'https://github.com/org/repo.git'
subdir = 'path/to/package/'  # Optional
rev = 'main'                  # Branch, tag, or commit

# Local source
[dependencies.PackageName]
local = './path/to/package'
```

### Download On-Chain Code

```bash
aptos move download \
  --account {PACKAGE_ADDRESS} \
  --package {PACKAGE_NAME}
```

### Common External DEX Functions

| DEX | Function | Purpose |
|-----|----------|---------|
| Liquidswap | `router_v2::get_amount_out` | Calculate expected output |
| Liquidswap | `router_v2::swap_exact_coin_for_coin` | Execute swap |
| PancakeSwap | `router::swap_exact_input` | Swap with exact input |
| PancakeSwap | `router::swap_exact_output` | Swap for exact output |

---

## Key Takeaways

1. **Atomic Composition**: Combine multiple external calls into single transactions
2. **Two Dependency Methods**: Git repos for public code, local for any source
3. **Match Framework Versions**: Ensure all packages use compatible `rev` tags
4. **Type Arguments**: External swaps require token type parameters
5. **Error Handling**: Atomic routes fail entirely if any step fails

---

*Based on Aptos Labs tutorial by Alex*
*Adapted for move_claude_skill by Nisarg Thakkar*
