/**
 * 09-privy-integration.tsx
 * Privy Wallet Integration with Aptos
 *
 * Privy is a wallet-as-a-service that allows you to create
 * embedded wallets for users without them managing private keys.
 *
 * Installation:
 *   npm install @privy-io/react-auth @aptos-labs/ts-sdk
 *
 * Features:
 * - Create Aptos wallets via Privy
 * - Sign transactions using raw hash signing
 * - Submit transactions to Aptos network
 */

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  useCreateWallet,
  useSignRawHash,
} from "@privy-io/react-auth/extended-chains";
import {
  Aptos,
  AptosConfig,
  Network,
  AccountAddress,
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
} from "@aptos-labs/ts-sdk";

// Initialize Aptos client
const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

// ============ Helper Functions ============

/**
 * Convert Uint8Array to hex string
 */
function toHex(bytes: Uint8Array): string {
  return (
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Clean up public key format from Privy
 * Privy may return keys with 0x prefix or extra bytes
 */
function cleanPublicKey(publicKeyHex: string): string {
  // Remove 0x prefix if present
  if (publicKeyHex.toLowerCase().startsWith("0x")) {
    publicKeyHex = publicKeyHex.slice(2);
  }

  // Remove leading 00 byte if present (66 chars -> 64 chars)
  if (publicKeyHex.length === 66 && publicKeyHex.startsWith("00")) {
    publicKeyHex = publicKeyHex.substring(2);
  }

  return publicKeyHex;
}

// ============ React Component ============

export function PrivyAptosDemo() {
  // Privy hooks
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { signRawHash } = useSignRawHash();

  // Component state
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("1");
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<string>("0");

  // ============ Wallet Creation ============

  /**
   * Create a new Aptos wallet using Privy
   */
  const createMoveWallet = async () => {
    try {
      const wallet = await createWallet({
        chainType: "aptos",
      });
      console.log("Wallet created:", wallet);
      return wallet;
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw error;
    }
  };

  // ============ Balance Fetching ============

  /**
   * Fetch APT balance for an address
   */
  const fetchWalletBalance = async (address: string) => {
    try {
      const result = await aptos.getAccountAPTAmount({
        accountAddress: address,
      });
      setWalletBalance(result.toString());
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      setWalletBalance("0");
    }
  };

  // Fetch balance when user authenticates
  useEffect(() => {
    if (authenticated && user) {
      const moveWallet = user.linkedAccounts?.find(
        (account: any) => account.chainType === "aptos"
      ) as any;

      if (moveWallet?.address) {
        fetchWalletBalance(moveWallet.address);
      }
    }
  }, [authenticated, user]);

  // ============ Transaction Handling ============

  /**
   * Build, sign, and submit an APT transfer transaction
   */
  const handleTransaction = async () => {
    // Validation
    if (!authenticated || !user) {
      setTxStatus("Please connect your wallet first");
      return;
    }

    // Find the Aptos wallet from linked accounts
    const moveWallet = user.linkedAccounts?.find(
      (account: any) => account.chainType === "aptos"
    ) as any;

    if (!moveWallet) {
      setTxStatus("Please create a Move wallet first");
      return;
    }

    if (!recipientAddress.trim()) {
      setTxStatus("Please enter a recipient address");
      return;
    }

    const walletAddress = moveWallet.address as string;
    let publicKeyHex = (moveWallet.publicKey as string) || "";

    if (!walletAddress || !publicKeyHex) {
      setTxStatus("Wallet not properly configured");
      return;
    }

    setIsLoading(true);
    setTxStatus("");

    try {
      // Step 1: Clean up public key format
      publicKeyHex = cleanPublicKey(publicKeyHex);

      if (publicKeyHex.length !== 64) {
        setTxStatus("Invalid public key format");
        setIsLoading(false);
        return;
      }

      // Step 2: Build the transaction
      const address = AccountAddress.from(walletAddress);
      const recipientAddr = AccountAddress.from(recipientAddress.trim());
      const amountInOctas = BigInt(parseInt(amount) * 100_000_000); // APT to octas

      const rawTxn = await aptos.transaction.build.simple({
        sender: address,
        data: {
          function: "0x1::coin::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [recipientAddr, amountInOctas],
        },
      });

      // Step 3: Generate signing message
      const message = generateSigningMessageForTransaction(rawTxn);

      // Step 4: Sign with Privy (raw hash signing)
      const { signature: rawSignature } = await signRawHash({
        address: walletAddress,
        chainType: "aptos",
        hash: toHex(message),
      });

      // Step 5: Create authenticator
      const senderAuthenticator = new AccountAuthenticatorEd25519(
        new Ed25519PublicKey(publicKeyHex),
        new Ed25519Signature(rawSignature.slice(2)) // Remove 0x prefix
      );

      // Step 6: Submit transaction
      const pending = await aptos.transaction.submit.simple({
        transaction: rawTxn,
        senderAuthenticator,
      });

      setTxHash(pending.hash);
      setTxStatus("Transaction submitted! Waiting for confirmation...");

      // Step 7: Wait for confirmation
      const executed = await aptos.waitForTransaction({
        transactionHash: pending.hash,
      });

      setTxStatus(`Transaction successful! Hash: ${executed.hash}`);

      // Refresh balance
      await fetchWalletBalance(walletAddress);
    } catch (error: any) {
      setTxStatus(`Error: ${error.message || "Transaction failed"}`);
      console.error("Transaction error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ Render ============

  // Get wallet info from user
  const moveWallet = user?.linkedAccounts?.find(
    (account: any) => account.chainType === "aptos"
  ) as any;

  return (
    <div className="privy-aptos-demo">
      <h1>Privy + Aptos Demo</h1>

      {/* Auth Section */}
      <section>
        <h2>Authentication</h2>
        {!authenticated ? (
          <button onClick={login} disabled={!ready}>
            Connect with Privy
          </button>
        ) : (
          <button onClick={logout}>Disconnect</button>
        )}
      </section>

      {/* Wallet Section */}
      {authenticated && (
        <section>
          <h2>Wallet</h2>
          {!moveWallet ? (
            <button onClick={createMoveWallet}>Create Aptos Wallet</button>
          ) : (
            <div>
              <p>
                <strong>Address:</strong> {moveWallet.address}
              </p>
              <p>
                <strong>Balance:</strong> {walletBalance} octas (
                {(parseInt(walletBalance) / 100_000_000).toFixed(4)} APT)
              </p>
              <button onClick={() => fetchWalletBalance(moveWallet.address)}>
                Refresh Balance
              </button>
            </div>
          )}
        </section>
      )}

      {/* Transfer Section */}
      {authenticated && moveWallet && (
        <section>
          <h2>Send APT</h2>
          <div>
            <label>
              Recipient Address:
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
              />
            </label>
          </div>
          <div>
            <label>
              Amount (APT):
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.1"
              />
            </label>
          </div>
          <button onClick={handleTransaction} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send APT"}
          </button>

          {txStatus && <p>{txStatus}</p>}
          {txHash && (
            <p>
              <a
                href={`https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Explorer
              </a>
            </p>
          )}
        </section>
      )}
    </div>
  );
}

// ============ Privy Provider Setup ============

/**
 * Wrap your app with PrivyProvider
 *
 * // In your _app.tsx or main.tsx:
 *
 * import { PrivyProvider } from "@privy-io/react-auth";
 *
 * function App() {
 *   return (
 *     <PrivyProvider
 *       appId="your-privy-app-id"
 *       config={{
 *         loginMethods: ["email", "google", "twitter"],
 *         appearance: {
 *           theme: "light",
 *         },
 *         // Enable Aptos chain
 *         embeddedWallets: {
 *           createOnLogin: "users-without-wallets",
 *         },
 *         supportedChains: [
 *           { type: "aptos", network: "testnet" },
 *         ],
 *       }}
 *     >
 *       <YourApp />
 *     </PrivyProvider>
 *   );
 * }
 */

export default PrivyAptosDemo;
