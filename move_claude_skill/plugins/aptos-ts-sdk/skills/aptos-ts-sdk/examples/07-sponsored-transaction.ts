/**
 * 07-sponsored-transaction.ts
 * Fee Payer / Sponsored Transaction Example
 *
 * Alice transfers APT to Bob, but Sponsor pays the gas fee.
 * Useful for onboarding users without tokens.
 */

import {
  Account,
  Aptos,
  AptosConfig,
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";
import dotenv from "dotenv";
dotenv.config();

const ALICE_INITIAL_BALANCE = 100_000_000;
const SPONSOR_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 0;
const TRANSFER_AMOUNT = 10;

// Default to devnet, but allow for overriding via APTOS_NETWORK env var
const APTOS_NETWORK: Network =
  NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];

const example = async () => {
  console.log("=== Sponsored Transaction Example ===\n");
  console.log(
    "This example creates three accounts (Alice, Bob, Sponsor)."
  );
  console.log(
    "Alice transfers APT to Bob, but Sponsor pays the gas fee.\n"
  );

  // Set up the client
  const aptosConfig = new AptosConfig({ network: APTOS_NETWORK });
  const aptos = new Aptos(aptosConfig);

  // Create three accounts
  const alice = Account.generate();
  const bob = Account.generate();
  const sponsor = Account.generate();

  const aliceAddress = alice.accountAddress;
  const bobAddress = bob.accountAddress;
  const sponsorAddress = sponsor.accountAddress;

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${aliceAddress}`);
  console.log(`Bob's address is: ${bobAddress}`);
  console.log(`Sponsor's address is: ${sponsorAddress}`);

  // Fund Alice and sponsor accounts
  console.log("\n=== Funding Accounts ===\n");
  await aptos.fundAccount({
    accountAddress: aliceAddress,
    amount: ALICE_INITIAL_BALANCE,
  });
  await aptos.fundAccount({
    accountAddress: sponsorAddress,
    amount: SPONSOR_INITIAL_BALANCE,
  });

  // Show account balances
  const aliceBalanceBefore = await aptos.getAccountCoinsData({
    accountAddress: aliceAddress,
  });
  const sponsorBalanceBefore = await aptos.getAccountCoinsData({
    accountAddress: sponsorAddress,
  });

  console.log("=== Balances Before ===\n");
  console.log(`Alice's balance: ${aliceBalanceBefore[0].amount}`);
  console.log(`Bob's balance: ${BOB_INITIAL_BALANCE}`);
  console.log(`Sponsor's balance: ${sponsorBalanceBefore[0].amount}`);

  // Verify initial balances
  if (aliceBalanceBefore[0].amount !== ALICE_INITIAL_BALANCE) {
    throw new Error("Alice's balance is incorrect");
  }
  if (sponsorBalanceBefore[0].amount !== SPONSOR_INITIAL_BALANCE) {
    throw new Error("Sponsor's balance is incorrect");
  }

  // Build a fee payer (sponsored) transaction
  // Alice is the sender, Sponsor is the fee payer
  console.log("\n=== Building Sponsored Transaction ===\n");
  const transaction = await aptos.transaction.build.simple({
    sender: aliceAddress,
    withFeePayer: true, // <-- Enable fee payer
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [bob.accountAddress, TRANSFER_AMOUNT],
    },
  });

  // Sponsor signs as fee payer
  const sponsorSignature = aptos.transaction.signAsFeePayer({
    signer: sponsor,
    transaction,
  });

  // Alice signs and submits with sponsor's signature
  console.log("=== Submitting Transaction ===\n");
  const committedTxn = await aptos.signAndSubmitTransaction({
    signer: alice,
    feePayerAuthenticator: sponsorSignature,
    transaction,
  });

  console.log(`Submitted transaction: ${committedTxn.hash}`);

  // Wait for confirmation
  const response = await aptos.waitForTransaction({
    transactionHash: committedTxn.hash,
  });
  console.log(`Transaction confirmed in version: ${response.version}`);

  // Check balances after
  console.log("\n=== Balances After Transfer ===\n");
  const aliceBalanceAfter = await aptos.getAccountCoinsData({
    accountAddress: aliceAddress,
    minimumLedgerVersion: BigInt(response.version),
  });
  const bobBalanceAfter = await aptos.getAccountCoinsData({
    accountAddress: bobAddress,
  });
  const sponsorBalanceAfter = await aptos.getAccountCoinsData({
    accountAddress: sponsorAddress,
  });

  console.log(`Alice's balance: ${aliceBalanceAfter[0].amount}`);
  console.log(`Bob's balance: ${bobBalanceAfter[0].amount}`);
  console.log(`Sponsor's balance: ${sponsorBalanceAfter[0].amount}`);

  // Verify results
  // Bob should have the transfer amount
  if (bobBalanceAfter[0].amount !== TRANSFER_AMOUNT) {
    throw new Error("Bob's balance after transfer is incorrect");
  }

  // Alice should have initial balance minus transfer (NO gas deducted!)
  if (aliceBalanceAfter[0].amount !== ALICE_INITIAL_BALANCE - TRANSFER_AMOUNT) {
    throw new Error("Alice's balance after transfer is incorrect");
  }

  // Sponsor should have less than initial (gas was deducted)
  if (sponsorBalanceAfter[0].amount >= SPONSOR_INITIAL_BALANCE) {
    throw new Error("Sponsor's balance after transfer is incorrect");
  }

  const gasUsed = SPONSOR_INITIAL_BALANCE - sponsorBalanceAfter[0].amount;
  console.log(`\nGas paid by sponsor: ${gasUsed} octas`);
  console.log(
    "\nAlice transferred APT but paid NO gas - Sponsor covered it!"
  );
};

example();
