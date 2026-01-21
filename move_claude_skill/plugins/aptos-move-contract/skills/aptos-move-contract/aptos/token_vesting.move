/// Token Vesting Module
/// A framework for managing time-locked token distributions
///
/// Features:
/// - Sponsors can create vesting schedules for recipients
/// - Tokens are locked until the specified unlock time
/// - Recipients can claim tokens after vesting period
/// - Sponsors can cancel unvested locks
///
/// Based on the Amnis liquid staking vesting pattern

module token_vesting::vesting {
    use std::signer;
    use std::error;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_std::smart_table::{Self, SmartTable};

    // ============ Error Codes ============

    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_LOCK_NOT_FOUND: u64 = 3;
    const E_LOCK_NOT_EXPIRED: u64 = 4;
    const E_INVALID_AMOUNT: u64 = 5;
    const E_INVALID_UNLOCK_TIME: u64 = 6;
    const E_NOT_SPONSOR: u64 = 7;
    const E_ACTIVE_LOCKS_EXIST: u64 = 8;

    // ============ Structs ============

    /// Individual lock for a recipient
    struct Lock has store {
        coins: Coin<AptosCoin>,
        principal: u64,
        unlock_time: u64,
        created_at: u64,
    }

    /// Sponsor's lock management resource
    struct SponsorLocks has key {
        locks: SmartTable<address, Lock>,
        withdrawal_addr: address,
        active_count: u64,
    }

    /// Events for tracking
    struct VestingEvents has key {
        lock_created_count: u64,
        lock_claimed_count: u64,
        lock_cancelled_count: u64,
    }

    // ============ Initialization ============

    /// Initialize sponsor account for managing locks
    public entry fun initialize_sponsor(
        sponsor: &signer,
        withdrawal_addr: address
    ) {
        let sponsor_addr = signer::address_of(sponsor);

        assert!(
            !exists<SponsorLocks>(sponsor_addr),
            error::already_exists(E_ALREADY_INITIALIZED)
        );

        move_to(sponsor, SponsorLocks {
            locks: smart_table::new(),
            withdrawal_addr,
            active_count: 0,
        });

        move_to(sponsor, VestingEvents {
            lock_created_count: 0,
            lock_claimed_count: 0,
            lock_cancelled_count: 0,
        });
    }

    /// Update withdrawal address (only when no active locks)
    public entry fun update_withdrawal_address(
        sponsor: &signer,
        new_addr: address
    ) acquires SponsorLocks {
        let sponsor_addr = signer::address_of(sponsor);
        let locks = borrow_global_mut<SponsorLocks>(sponsor_addr);

        assert!(
            locks.active_count == 0,
            error::invalid_state(E_ACTIVE_LOCKS_EXIST)
        );

        locks.withdrawal_addr = new_addr;
    }

    // ============ Lock Creation ============

    /// Create a new lock for a recipient
    public entry fun create_lock(
        sponsor: &signer,
        recipient: address,
        amount: u64,
        unlock_time: u64
    ) acquires SponsorLocks, VestingEvents {
        let sponsor_addr = signer::address_of(sponsor);
        let now = timestamp::now_seconds();

        // Validations
        assert!(
            exists<SponsorLocks>(sponsor_addr),
            error::not_found(E_NOT_INITIALIZED)
        );
        assert!(amount > 0, error::invalid_argument(E_INVALID_AMOUNT));
        assert!(
            unlock_time > now,
            error::invalid_argument(E_INVALID_UNLOCK_TIME)
        );

        // Withdraw coins from sponsor
        let coins = coin::withdraw<AptosCoin>(sponsor, amount);

        // Create lock
        let locks = borrow_global_mut<SponsorLocks>(sponsor_addr);

        assert!(
            !smart_table::contains(&locks.locks, recipient),
            error::already_exists(E_ALREADY_INITIALIZED)
        );

        smart_table::add(&mut locks.locks, recipient, Lock {
            coins,
            principal: amount,
            unlock_time,
            created_at: now,
        });

        locks.active_count = locks.active_count + 1;

        // Update events
        let events = borrow_global_mut<VestingEvents>(sponsor_addr);
        events.lock_created_count = events.lock_created_count + 1;
    }

    // ============ Recipient Actions ============

    /// Claim vested tokens after unlock time
    public entry fun claim(
        recipient: &signer,
        sponsor_addr: address
    ) acquires SponsorLocks, VestingEvents {
        let recipient_addr = signer::address_of(recipient);
        let now = timestamp::now_seconds();

        assert!(
            exists<SponsorLocks>(sponsor_addr),
            error::not_found(E_NOT_INITIALIZED)
        );

        let locks = borrow_global_mut<SponsorLocks>(sponsor_addr);

        assert!(
            smart_table::contains(&locks.locks, recipient_addr),
            error::not_found(E_LOCK_NOT_FOUND)
        );

        // Remove lock from table
        let Lock { coins, principal: _, unlock_time, created_at: _ } =
            smart_table::remove(&mut locks.locks, recipient_addr);

        // Verify unlock time has passed
        assert!(
            now >= unlock_time,
            error::invalid_state(E_LOCK_NOT_EXPIRED)
        );

        // Transfer coins to recipient
        coin::deposit(recipient_addr, coins);
        locks.active_count = locks.active_count - 1;

        // Update events
        let events = borrow_global_mut<VestingEvents>(sponsor_addr);
        events.lock_claimed_count = events.lock_claimed_count + 1;
    }

    // ============ Sponsor Actions ============

    /// Cancel a lock and return funds to withdrawal address
    public entry fun cancel_lock(
        sponsor: &signer,
        recipient: address
    ) acquires SponsorLocks, VestingEvents {
        let sponsor_addr = signer::address_of(sponsor);

        assert!(
            exists<SponsorLocks>(sponsor_addr),
            error::not_found(E_NOT_INITIALIZED)
        );

        let locks = borrow_global_mut<SponsorLocks>(sponsor_addr);

        assert!(
            smart_table::contains(&locks.locks, recipient),
            error::not_found(E_LOCK_NOT_FOUND)
        );

        // Remove lock
        let Lock { coins, principal: _, unlock_time: _, created_at: _ } =
            smart_table::remove(&mut locks.locks, recipient);

        // Return to withdrawal address
        coin::deposit(locks.withdrawal_addr, coins);
        locks.active_count = locks.active_count - 1;

        // Update events
        let events = borrow_global_mut<VestingEvents>(sponsor_addr);
        events.lock_cancelled_count = events.lock_cancelled_count + 1;
    }

    /// Extend lock time for a recipient
    public entry fun extend_lock(
        sponsor: &signer,
        recipient: address,
        new_unlock_time: u64
    ) acquires SponsorLocks {
        let sponsor_addr = signer::address_of(sponsor);

        let locks = borrow_global_mut<SponsorLocks>(sponsor_addr);

        assert!(
            smart_table::contains(&locks.locks, recipient),
            error::not_found(E_LOCK_NOT_FOUND)
        );

        let lock = smart_table::borrow_mut(&mut locks.locks, recipient);

        // Can only extend, not shorten
        assert!(
            new_unlock_time > lock.unlock_time,
            error::invalid_argument(E_INVALID_UNLOCK_TIME)
        );

        lock.unlock_time = new_unlock_time;
    }

    // ============ View Functions ============

    #[view]
    public fun is_sponsor_initialized(sponsor_addr: address): bool {
        exists<SponsorLocks>(sponsor_addr)
    }

    #[view]
    public fun get_lock_info(
        sponsor_addr: address,
        recipient: address
    ): (u64, u64, u64) acquires SponsorLocks {
        let locks = borrow_global<SponsorLocks>(sponsor_addr);
        let lock = smart_table::borrow(&locks.locks, recipient);
        (lock.principal, lock.unlock_time, lock.created_at)
    }

    #[view]
    public fun get_active_lock_count(sponsor_addr: address): u64 acquires SponsorLocks {
        borrow_global<SponsorLocks>(sponsor_addr).active_count
    }

    #[view]
    public fun is_claimable(
        sponsor_addr: address,
        recipient: address
    ): bool acquires SponsorLocks {
        if (!exists<SponsorLocks>(sponsor_addr)) {
            return false
        };

        let locks = borrow_global<SponsorLocks>(sponsor_addr);
        if (!smart_table::contains(&locks.locks, recipient)) {
            return false
        };

        let lock = smart_table::borrow(&locks.locks, recipient);
        timestamp::now_seconds() >= lock.unlock_time
    }
}
