/// Basic Message Module
/// A simple example demonstrating Move fundamentals on Aptos
///
/// Usage:
/// 1. aptos move init --name basic_message
/// 2. Copy this file to sources/basic_message.move
/// 3. Update Move.toml with your address
/// 4. aptos move compile --named-addresses basic_message=default
/// 5. aptos move test --named-addresses basic_message=default
/// 6. aptos move publish --named-addresses basic_message=default

module basic_message::message {
    use std::string::{Self, String};
    use std::signer;
    use std::error;

    // ============ Error Codes ============

    /// Message holder does not exist for this address
    const E_NOT_INITIALIZED: u64 = 1;
    /// Message holder already exists
    const E_ALREADY_EXISTS: u64 = 2;
    /// Message is empty
    const E_EMPTY_MESSAGE: u64 = 3;

    // ============ Structs ============

    /// Resource to store a message under an account
    struct MessageHolder has key, store, drop {
        message: String,
        last_updated: u64,
    }

    // ============ Entry Functions ============

    /// Create a new message holder (first time only)
    public entry fun create_message(
        account: &signer,
        message: String
    ) {
        let account_addr = signer::address_of(account);

        // Ensure not already initialized
        assert!(
            !exists<MessageHolder>(account_addr),
            error::already_exists(E_ALREADY_EXISTS)
        );

        // Ensure message is not empty
        assert!(
            string::length(&message) > 0,
            error::invalid_argument(E_EMPTY_MESSAGE)
        );

        move_to(account, MessageHolder {
            message,
            last_updated: 0, // Would use timestamp in production
        });
    }

    /// Update an existing message
    public entry fun update_message(
        account: &signer,
        new_message: String
    ) acquires MessageHolder {
        let account_addr = signer::address_of(account);

        // Ensure holder exists
        assert!(
            exists<MessageHolder>(account_addr),
            error::not_found(E_NOT_INITIALIZED)
        );

        let holder = borrow_global_mut<MessageHolder>(account_addr);
        holder.message = new_message;
        holder.last_updated = holder.last_updated + 1;
    }

    /// Delete message holder
    public entry fun delete_message(account: &signer) acquires MessageHolder {
        let account_addr = signer::address_of(account);

        assert!(
            exists<MessageHolder>(account_addr),
            error::not_found(E_NOT_INITIALIZED)
        );

        // Remove and destroy the resource
        let MessageHolder { message: _, last_updated: _ } =
            move_from<MessageHolder>(account_addr);
    }

    // ============ View Functions ============

    /// Get message for an address
    #[view]
    public fun get_message(account_addr: address): String acquires MessageHolder {
        assert!(
            exists<MessageHolder>(account_addr),
            error::not_found(E_NOT_INITIALIZED)
        );
        borrow_global<MessageHolder>(account_addr).message
    }

    /// Check if account has a message
    #[view]
    public fun has_message(account_addr: address): bool {
        exists<MessageHolder>(account_addr)
    }

    /// Get update count
    #[view]
    public fun get_update_count(account_addr: address): u64 acquires MessageHolder {
        assert!(
            exists<MessageHolder>(account_addr),
            error::not_found(E_NOT_INITIALIZED)
        );
        borrow_global<MessageHolder>(account_addr).last_updated
    }
}

// ============ Tests ============

#[test_only]
module basic_message::message_tests {
    use std::string;
    use std::signer;
    use basic_message::message;

    #[test(sender = @basic_message)]
    fun test_create_message(sender: &signer) {
        message::create_message(sender, string::utf8(b"Hello Aptos!"));

        let stored = message::get_message(signer::address_of(sender));
        assert!(stored == string::utf8(b"Hello Aptos!"), 0);
        assert!(message::has_message(signer::address_of(sender)), 1);
    }

    #[test(sender = @basic_message)]
    fun test_update_message(sender: &signer) {
        message::create_message(sender, string::utf8(b"First"));
        message::update_message(sender, string::utf8(b"Second"));

        let stored = message::get_message(signer::address_of(sender));
        assert!(stored == string::utf8(b"Second"), 0);
        assert!(message::get_update_count(signer::address_of(sender)) == 1, 1);
    }

    #[test(sender = @basic_message)]
    fun test_delete_message(sender: &signer) {
        message::create_message(sender, string::utf8(b"To be deleted"));
        assert!(message::has_message(signer::address_of(sender)), 0);

        message::delete_message(sender);
        assert!(!message::has_message(signer::address_of(sender)), 1);
    }

    #[test(sender = @basic_message)]
    #[expected_failure(abort_code = 393217)] // E_ALREADY_EXISTS
    fun test_double_create_fails(sender: &signer) {
        message::create_message(sender, string::utf8(b"First"));
        message::create_message(sender, string::utf8(b"Second")); // Should fail
    }

    #[test(sender = @basic_message)]
    #[expected_failure(abort_code = 65537)] // E_NOT_INITIALIZED
    fun test_update_nonexistent_fails(sender: &signer) {
        message::update_message(sender, string::utf8(b"No holder")); // Should fail
    }

    #[test(sender = @basic_message)]
    #[expected_failure(abort_code = 65539)] // E_EMPTY_MESSAGE
    fun test_empty_message_fails(sender: &signer) {
        message::create_message(sender, string::utf8(b"")); // Should fail
    }
}
