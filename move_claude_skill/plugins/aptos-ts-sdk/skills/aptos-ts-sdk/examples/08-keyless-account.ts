/**
 * 08-keyless-account.ts
 * Keyless Account Example (OAuth/OpenID Connect)
 *
 * Keyless accounts allow users to authenticate with social logins
 * (Google, Apple, etc.) without managing private keys.
 *
 * How it works:
 * 1. Generate an ephemeral (temporary) key pair
 * 2. User authenticates via OAuth provider (e.g., Google)
 * 3. Derive keyless account from JWT + ephemeral key
 * 4. Sign transactions with the keyless account
 */

import {
  AccountAddress,
  Aptos,
  AptosConfig,
  EphemeralKeyPair,
  Network,
} from "@aptos-labs/ts-sdk";
import * as readlineSync from "readline-sync";

const TRANSFER_AMOUNT = 10; // octas
const MAX_GAS_UNITS = 200; // gas units
const GAS_UNIT_PRICE = 100; // octas / gas unit

/**
 * Get the APT balance of an account
 */
const getBalance = async (
  aptos: Aptos,
  address: AccountAddress
): Promise<number> => {
  return aptos.getAccountAPTAmount({ accountAddress: address });
};

const example = async () => {
  console.log("=== Keyless Account Example (Mainnet) ===\n");

  // Set up the client for mainnet
  const config = new AptosConfig({ network: Network.MAINNET });
  const aptos = new Aptos(config);

  // Step 1: Generate an ephemeral (temporary) key pair
  // This key pair is used to sign transactions but is not the account's identity
  const aliceEphem = EphemeralKeyPair.generate();

  console.log("Step 1: Ephemeral key pair generated\n");
  console.log(`Nonce: ${aliceEphem.nonce}`);
  console.log(`Ephemeral Public Key: ${aliceEphem.getPublicKey().toString()}\n`);

  // Step 2: Redirect user to OAuth provider
  // The nonce links the OAuth flow to this ephemeral key
  const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?redirect_uri=https%3A%2F%2Fdevelopers.google.com%2Foauthplayground&prompt=consent&response_type=code&client_id=407408718192.apps.googleusercontent.com&scope=openid&access_type=offline&service=lso&o2v=2&theme=glif&flowName=GeneralOAuthFlow&nonce=${aliceEphem.nonce}`;

  console.log("Step 2: Authenticate with Google\n");
  console.log("Open this link in your browser:");
  console.log(`${googleOAuthUrl}\n`);
  console.log("Instructions:");
  console.log("1. Log in with your Google account");
  console.log("2. Click 'Exchange authorization code for tokens'");
  console.log("3. Copy the 'id_token' value");
  console.log("   (Tip: Toggle 'Wrap lines' option to make copying easier)\n");

  // Get JWT from user
  const jwt = readlineSync.question(
    "Paste the JWT (id_token) here and press Enter: ",
    { hideEchoBack: false }
  );

  // Step 3: Derive the keyless account from JWT + ephemeral key
  console.log("\nStep 3: Deriving keyless account...\n");
  const alice = await aptos.deriveKeylessAccount({
    jwt,
    ephemeralKeyPair: aliceEphem,
  });

  console.log("=== Keyless Account Created ===\n");
  console.log(`Address: ${alice.accountAddress}`);
  console.log(`Nonce: ${aliceEphem.nonce}`);
  console.log(`Ephemeral Public Key: ${aliceEphem.getPublicKey().toString()}`);

  // Step 4: Fund the account (or check existing balance)
  const minBalance = MAX_GAS_UNITS * GAS_UNIT_PRICE + TRANSFER_AMOUNT;
  let aliceBalance = 0;

  try {
    aliceBalance = await getBalance(aptos, alice.accountAddress);
  } catch (error) {
    console.log("\nAccount does not exist yet or has no balance.");
  }

  while (aliceBalance < minBalance) {
    console.log("\n=== Fund the Account ===\n");
    console.log(`Address: ${alice.accountAddress}`);
    console.log(`Current Balance: ${aliceBalance} octas`);
    console.log(`Minimum Required: ${minBalance} octas\n`);
    console.log("Please fund this address with APT to continue.");
    console.log("Press ENTER once funded...");
    readlineSync.question("");

    try {
      aliceBalance = await getBalance(aptos, alice.accountAddress);
      console.log(`Updated balance: ${aliceBalance} octas`);
    } catch (error) {
      console.log("Error fetching balance, retrying...");
    }
  }

  console.log("\n=== Balance ===\n");
  console.log(`Alice's balance: ${aliceBalance} octas`);

  // Step 5: Send a transaction (transfer to self to not waste APT)
  console.log("\n=== Sending Transaction ===\n");
  console.log(`Transferring ${TRANSFER_AMOUNT} octas to self...`);

  const transaction = await aptos.transferCoinTransaction({
    sender: alice.accountAddress,
    recipient: alice.accountAddress, // Transfer to self
    amount: TRANSFER_AMOUNT,
    options: {
      maxGasAmount: MAX_GAS_UNITS,
      gasUnitPrice: GAS_UNIT_PRICE,
    },
  });

  // Sign with keyless account
  const committedTxn = await aptos.signAndSubmitTransaction({
    signer: alice,
    transaction,
  });

  console.log(`Transaction submitted: ${committedTxn.hash}`);

  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log("Transaction confirmed!");

  // Check final balance
  const newAliceBalance = await getBalance(aptos, alice.accountAddress);

  console.log("\n=== Final Balance ===\n");
  console.log(`Alice's balance: ${newAliceBalance} octas`);

  const gasUsed = aliceBalance - newAliceBalance;
  console.log(`Gas used: ${gasUsed} octas`);

  // Verify the gas was charged (balance should decrease)
  if (TRANSFER_AMOUNT >= aliceBalance - newAliceBalance) {
    throw new Error("Balance change is incorrect");
  }

  console.log("\n=== Success! ===\n");
  console.log("Keyless account transaction completed.");
  console.log("The account was authenticated via Google OAuth.");
  console.log("No private key was ever stored or transmitted!");
};

example();
