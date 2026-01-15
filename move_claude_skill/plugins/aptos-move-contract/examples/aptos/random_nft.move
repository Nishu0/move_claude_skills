/// Random NFT Minting Module
/// Demonstrates on-chain randomness for generating unique NFT attributes
///
/// Features:
/// - Random attribute generation using Aptos randomness API
/// - Each NFT has unique randomly generated parts
/// - Tamper-proof and fair distribution
///
/// IMPORTANT: Functions using randomness MUST have #[randomness] annotation

module random_nft::aptogotchi {
    use std::signer;
    use std::string::{Self, String};
    use std::error;
    use std::vector;
    use std::option;
    use aptos_framework::randomness;
    use aptos_framework::object::{Self, Object};
    use aptos_token_objects::token::{Self, Token};
    use aptos_token_objects::collection;

    // ============ Constants ============

    /// Max values for random parts (exclusive upper bound)
    const BODY_MAX_VALUE: u8 = 5;    // 0-4
    const EAR_MAX_VALUE: u8 = 6;     // 0-5
    const FACE_MAX_VALUE: u8 = 4;    // 0-3
    const COLOR_MAX_VALUE: u8 = 8;   // 0-7

    /// Collection info
    const COLLECTION_NAME: vector<u8> = b"Aptogotchi Collection";
    const COLLECTION_DESCRIPTION: vector<u8> = b"Randomly generated digital pets";
    const COLLECTION_URI: vector<u8> = b"https://example.com/collection";

    // ============ Error Codes ============

    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_HAS_APTOGOTCHI: u64 = 2;
    const E_COLLECTION_NOT_CREATED: u64 = 3;

    // ============ Structs ============

    /// Random parts that make up an Aptogotchi
    struct AptogotchiParts has store, copy, drop {
        body: u8,
        ear: u8,
        face: u8,
        color: u8,
    }

    /// The Aptogotchi NFT data
    struct Aptogotchi has key {
        parts: AptogotchiParts,
        name: String,
        birthday: u64,
        health: u8,
    }

    /// Global collection manager
    struct CollectionManager has key {
        collection_address: address,
        minted_count: u64,
    }

    /// Track user's aptogotchi
    struct UserAptogotchi has key {
        aptogotchi_address: address,
    }

    // ============ Initialization ============

    /// Initialize the collection (call once by deployer)
    public entry fun initialize_collection(creator: &signer) {
        let creator_addr = signer::address_of(creator);

        assert!(
            !exists<CollectionManager>(creator_addr),
            error::already_exists(E_NOT_INITIALIZED)
        );

        // Create the NFT collection
        let collection_constructor_ref = collection::create_unlimited_collection(
            creator,
            string::utf8(COLLECTION_DESCRIPTION),
            string::utf8(COLLECTION_NAME),
            option::none(),
            string::utf8(COLLECTION_URI),
        );

        let collection_signer = object::generate_signer(&collection_constructor_ref);

        move_to(creator, CollectionManager {
            collection_address: signer::address_of(&collection_signer),
            minted_count: 0,
        });
    }

    // ============ Minting ============

    /// IMPORTANT: #[randomness] annotation is REQUIRED for functions using randomness API
    /// This prevents test-and-abort attacks where malicious actors could
    /// abort transactions when they don't get favorable random results
    #[randomness]
    entry fun mint_aptogotchi(
        user: &signer,
        name: String,
        creator_addr: address
    ) acquires CollectionManager {
        let user_addr = signer::address_of(user);

        // Ensure user doesn't already have one
        assert!(
            !exists<UserAptogotchi>(user_addr),
            error::already_exists(E_ALREADY_HAS_APTOGOTCHI)
        );

        // Generate random parts using on-chain randomness
        let parts = generate_random_parts();

        // Get collection manager
        let manager = borrow_global_mut<CollectionManager>(creator_addr);

        // Create token name with count
        manager.minted_count = manager.minted_count + 1;

        // Mint the NFT token
        let token_constructor_ref = token::create_named_token(
            // Would need creator signer here - simplified for example
            user, // In production, use resource account
            string::utf8(COLLECTION_NAME),
            string::utf8(COLLECTION_DESCRIPTION),
            name,
            option::none(),
            string::utf8(b"https://example.com/token"),
        );

        let token_signer = object::generate_signer(&token_constructor_ref);
        let token_addr = signer::address_of(&token_signer);

        // Store Aptogotchi data on the token
        move_to(&token_signer, Aptogotchi {
            parts,
            name,
            birthday: 0, // Would use timestamp in production
            health: 100,
        });

        // Track user's aptogotchi
        move_to(user, UserAptogotchi {
            aptogotchi_address: token_addr,
        });
    }

    /// Internal function to generate random parts
    /// Called from #[randomness] annotated function
    fun generate_random_parts(): AptogotchiParts {
        AptogotchiParts {
            body: randomness::u8_range(0, BODY_MAX_VALUE),
            ear: randomness::u8_range(0, EAR_MAX_VALUE),
            face: randomness::u8_range(0, FACE_MAX_VALUE),
            color: randomness::u8_range(0, COLOR_MAX_VALUE),
        }
    }

    // ============ Alternative: Commit-Reveal Pattern ============
    // For extra security against undergasing attacks

    struct MintCommitment has key {
        committed: bool,
        block_height: u64,
    }

    /// Step 1: Commit to minting (no randomness yet)
    public entry fun commit_to_mint(user: &signer) {
        let user_addr = signer::address_of(user);

        assert!(
            !exists<MintCommitment>(user_addr),
            error::already_exists(E_ALREADY_HAS_APTOGOTCHI)
        );

        move_to(user, MintCommitment {
            committed: true,
            block_height: 0, // Would use block::get_current_block_height()
        });
    }

    /// Step 2: Reveal and mint (uses randomness)
    /// Must be called in a later block than commit
    #[randomness]
    entry fun reveal_and_mint(
        user: &signer,
        name: String,
        creator_addr: address
    ) acquires MintCommitment, CollectionManager {
        let user_addr = signer::address_of(user);

        // Verify commitment exists
        assert!(
            exists<MintCommitment>(user_addr),
            error::not_found(E_NOT_INITIALIZED)
        );

        // Remove commitment
        let MintCommitment { committed: _, block_height: _ } =
            move_from<MintCommitment>(user_addr);

        // Now proceed with random minting
        // (simplified - would call internal mint logic)
        let _parts = generate_random_parts();

        // ... rest of minting logic
    }

    // ============ View Functions ============

    #[view]
    public fun get_aptogotchi_parts(
        aptogotchi_addr: address
    ): (u8, u8, u8, u8) acquires Aptogotchi {
        let aptogotchi = borrow_global<Aptogotchi>(aptogotchi_addr);
        (
            aptogotchi.parts.body,
            aptogotchi.parts.ear,
            aptogotchi.parts.face,
            aptogotchi.parts.color,
        )
    }

    #[view]
    public fun has_aptogotchi(user_addr: address): bool {
        exists<UserAptogotchi>(user_addr)
    }

    #[view]
    public fun get_minted_count(creator_addr: address): u64 acquires CollectionManager {
        borrow_global<CollectionManager>(creator_addr).minted_count
    }
}

// ============ Additional Randomness Examples ============

module random_nft::lottery {
    use aptos_framework::randomness;

    /// Pick a random winner from a list
    #[randomness]
    entry fun pick_winner(participants: vector<address>): address {
        let count = vector::length(&participants);
        let winner_index = randomness::u64_range(0, count);
        *vector::borrow(&participants, winner_index)
    }

    /// Roll dice (1-6)
    #[randomness]
    entry fun roll_dice(): u8 {
        randomness::u8_range(1, 7) // 1 to 6 inclusive
    }

    /// Shuffle a deck (Fisher-Yates)
    #[randomness]
    entry fun shuffle_deck(deck: &mut vector<u8>) {
        let len = vector::length(deck);
        let i = len;
        while (i > 1) {
            i = i - 1;
            let j = randomness::u64_range(0, i + 1);
            vector::swap(deck, i, j);
        };
    }

    /// Random boolean (coin flip)
    #[randomness]
    entry fun coin_flip(): bool {
        randomness::u8_range(0, 2) == 1
    }
}
