# Move Skills for Claude Desktop

**Author:** Nisarg Thakkar  
**Email:** itsthakkarnisarg@gmail.com  
**Version:** 1.0.0

A collection of skills for Claude Desktop to help with Move smart contract and blockchain development on Aptos, Movement, and Supra ecosystems.

---

## 🚀 Quick Start

Install Move skills for Claude Desktop with a single command:

```bash
npx move-skills init
```

That's it! The skills will be automatically copied to your Claude skills directory.

After installation:
1. **Restart Claude Desktop**
2. The skills will appear in Claude's skill selector
3. Start building Move smart contracts!

---

## 📦 Available Skills

| Skill | Description |
|-------|-------------|
| **aptos-move-contract** | Complete Aptos Move smart contract development with examples |
| **aptos-ts-sdk** | Aptos TypeScript SDK integration for dApp development |

### Coming Soon
- Movement L2 Move contracts
- Supra blockchain Move contracts

---

## 🎯 What You Get

### 1. Aptos Move Contract Skill

Comprehensive Move smart contract development including:

- **Quick Start Guide**: CLI setup, project initialization, compile, test, deploy
- **Module Templates**: Production-ready Move boilerplate
- **Advanced Patterns**:
  - On-chain randomness (NFT minting)
  - Token vesting with time locks
  - ve(3,3) DEX implementation
  - Liquidity pools
  - Third-party contract integration

**Example contracts included:**
- `basic_message.move` - Simple resource storage with CRUD operations
- `token_vesting.move` - Time-locked token distribution
- `random_nft.move` - On-chain randomness for NFT minting
- DEX modules (coin_wrapper, liquidity_pool, package_manager, simple_dex)

### 2. Aptos TypeScript SDK Skill

Full TypeScript SDK integration with examples:

- Installation & setup for all package managers
- Network configuration (testnet, mainnet, devnet)
- Account management (Ed25519, Secp256k1, HD wallets)
- Transaction building, signing, and submission
- Reading on-chain data (accounts, resources, events)
- Token & NFT operations
- Advanced features (multi-agent, sponsored transactions, keyless accounts)

**Example files included:**
- Setup and configuration
- Account creation and management
- Transaction handling
- Reading blockchain data
- Token and NFT operations
- Advanced patterns
- Sponsored transactions
- Keyless accounts
- Privy integration

---

## 💻 Usage

Once installed, Claude Desktop will have access to these skills. You can:

1. **Ask Claude to create Move contracts:**
   ```
   "Create a token vesting contract for Aptos"
   ```

2. **Request TypeScript integration:**
   ```
   "Show me how to mint an NFT using Aptos TS SDK"
   ```

3. **Get deployment help:**
   ```
   "Help me deploy this Move module to testnet"
   ```

4. **Build complete dApps:**
   ```
   "Create a DEX frontend that interacts with my liquidity pool contract"
   ```

---

## 📍 Installation Locations

The skills are installed in:

- **macOS:** `~/Library/Application Support/Claude/skills/`
- **Linux:** `~/.config/Claude/skills/`
- **Windows:** `%APPDATA%\Claude\skills\`

---

## 🔄 Updating Skills

To update to the latest version:

```bash
npx move-skills init
```

This will overwrite the existing skills with the latest versions.

---

## 🛠️ Manual Installation (Alternative)

If you prefer manual installation:

1. Clone the repository:
   ```bash
   git clone https://github.com/nisargthakkar/move-skills.git
   ```

2. Copy the skills to Claude's directory:
   ```bash
   # macOS
   cp -r move_claude_skill/plugins/* ~/Library/Application\ Support/Claude/skills/
   
   # Linux
   cp -r move_claude_skill/plugins/* ~/.config/Claude/skills/
   
   # Windows (PowerShell)
   Copy-Item -Recurse move_claude_skill\plugins\* $env:APPDATA\Claude\skills\
   ```

3. Restart Claude Desktop

---

## 📚 Documentation

For detailed documentation on each skill:

- [Aptos Move Contract Skill](./move_claude_skill/plugins/aptos-move-contract/README.md)
- [Aptos TypeScript SDK Skill](./move_claude_skill/plugins/aptos-ts-sdk/README.md)

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Add more example contracts

---

## 📄 License

MIT License - feel free to use in your projects!

---

## 🗺️ Roadmap

### Phase 1: Aptos Ecosystem ✅
- [x] Aptos Move contracts
- [x] Aptos TypeScript SDK
- [x] NPX installation

### Phase 2: Extended Ecosystem
- [ ] Movement L2 Move contracts
- [ ] Movement SDK
- [ ] Supra blockchain Move contracts
- [ ] Supra SDK

### Phase 3: Full-Stack
- [ ] Complete dApp templates
- [ ] Testing frameworks
- [ ] CI/CD automation
- [ ] Deployment scripts

---

## 📞 Contact

**Nisarg Thakkar**  
Email: itsthakkarnisarg@gmail.com

---

*Making Move development with Claude Desktop seamless and powerful!* 🚀

