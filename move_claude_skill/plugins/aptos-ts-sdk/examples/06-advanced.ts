/**
 * 06-advanced.ts
 * Advanced Transaction Patterns
 *
 * - Multi-agent transactions (multiple signers)
 * - Sponsored transactions (fee payer)
 * - Script transactions
 * - Error handling
 */

import {
  Account,
  Aptos,
  AptosConfig,
  Network,
  AptosApiError,
} from "@aptos-labs/ts-sdk";

// ============ Multi-Agent Transaction ============

/**
 * Multi-agent transactions require signatures from multiple accounts.
 * Useful for atomic swaps, multi-sig operations, etc.
 */
async function multiAgentTransaction(
  aptos: Aptos,
  sender: Account,
  secondarySigner: Account,
  moduleAddress: string,
  functionName: string,
  args: any[]
) {
  // Build multi-agent transaction
  const transaction = await aptos.transaction.build.multiAgent({
    sender: sender.accountAddress,
    secondarySignerAddresses: [secondarySigner.accountAddress],
    data: {
      function: `${moduleAddress}::${functionName}`,
      functionArguments: args,
    },
  });

  // Sign by sender
  const senderAuth = aptos.transaction.sign({
    signer: sender,
    transaction,
  });

  // Sign by secondary signer
  const secondaryAuth = aptos.transaction.sign({
    signer: secondarySigner,
    transaction,
  });

  // Submit with all signatures
  const result = await aptos.transaction.submit.multiAgent({
    transaction,
    senderAuthenticator: senderAuth,
    additionalSignersAuthenticators: [secondaryAuth],
  });

  return await aptos.waitForTransaction({ transactionHash: result.hash });
}

// ============ Sponsored Transaction (Fee Payer) ============

/**
 * Sponsored transactions allow one account to pay gas fees for another.
 * Useful for onboarding users without tokens.
 */
async function sponsoredTransaction(
  aptos: Aptos,
  user: Account,
  sponsor: Account,
  functionId: string,
  args: any[]
) {
  // Build transaction with fee payer flag
  const transaction = await aptos.transaction.build.simple({
    sender: user.accountAddress,
    data: {
      function: functionId,
      functionArguments: args,
    },
    withFeePayer: true,
  });

  // User signs the transaction
  const userAuth = aptos.transaction.sign({
    signer: user,
    transaction,
  });

  // Sponsor signs as fee payer
  const feePayerAuth = aptos.transaction.signAsFeePayer({
    signer: sponsor,
    transaction,
  });

  // Submit with both signatures
  const result = await aptos.transaction.submit.simple({
    transaction,
    senderAuthenticator: userAuth,
    feePayerAuthenticator: feePayerAuth,
  });

  return await aptos.waitForTransaction({ transactionHash: result.hash });
}

// ============ Error Handling ============

async function safeTransaction(
  aptos: Aptos,
  account: Account,
  functionId: string,
  args: any[]
) {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: functionId,
        functionArguments: args,
      },
    });

    // Simulate first
    const [simulation] = await aptos.transaction.simulate.simple({
      signerPublicKey: account.publicKey,
      transaction,
    });

    if (!simulation.success) {
      console.error("Simulation failed:", simulation.vm_status);
      return { success: false, error: simulation.vm_status };
    }

    // Sign and submit
    const auth = aptos.transaction.sign({ signer: account, transaction });
    const result = await aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator: auth,
    });

    const confirmed = await aptos.waitForTransaction({
      transactionHash: result.hash,
    });

    return { success: confirmed.success, hash: result.hash };
  } catch (error) {
    if (error instanceof AptosApiError) {
      console.error("API Error:", error.message);
      console.error("Status:", error.status);
      console.error("Error Code:", error.errorCode);
      return { success: false, error: error.message };
    }
    throw error;
  }
}

// ============ Batch Transactions with Retry ============

async function batchWithRetry(
  aptos: Aptos,
  account: Account,
  transactions: { functionId: string; args: any[] }[],
  maxRetries: number = 3
) {
  const results = [];

  for (const { functionId, args } of transactions) {
    let retries = 0;
    let success = false;

    while (retries < maxRetries && !success) {
      try {
        const result = await safeTransaction(
          aptos,
          account,
          functionId,
          args
        );
        results.push(result);
        success = true;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          results.push({ success: false, error: "Max retries exceeded" });
        } else {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
        }
      }
    }
  }

  return results;
}

// ============ Transaction with Timeout ============

async function transactionWithTimeout(
  aptos: Aptos,
  account: Account,
  functionId: string,
  args: any[],
  timeoutMs: number = 30000
) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Transaction timeout")), timeoutMs);
  });

  const transactionPromise = safeTransaction(aptos, account, functionId, args);

  return Promise.race([transactionPromise, timeoutPromise]);
}

// ============ Get Gas Estimate ============

async function estimateGas(
  aptos: Aptos,
  account: Account,
  functionId: string,
  args: any[]
) {
  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: functionId,
      functionArguments: args,
    },
  });

  const [simulation] = await aptos.transaction.simulate.simple({
    signerPublicKey: account.publicKey,
    transaction,
  });

  return {
    gasUsed: simulation.gas_used,
    gasUnitPrice: simulation.gas_unit_price,
    maxGasAmount: simulation.max_gas_amount,
    success: simulation.success,
    vmStatus: simulation.vm_status,
  };
}

// ============ Example Usage ============

async function main() {
  console.log("=== Advanced Transactions Example ===\n");

  const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

  // Create accounts
  const alice = Account.generate();
  const bob = Account.generate();
  const sponsor = Account.generate();

  console.log(`Alice: ${alice.accountAddress}`);
  console.log(`Bob: ${bob.accountAddress}`);
  console.log(`Sponsor: ${sponsor.accountAddress}`);

  // Fund accounts
  console.log("\nFunding accounts...");
  await aptos.fundAccount({
    accountAddress: alice.accountAddress,
    amount: 100_000_000,
  });
  await aptos.fundAccount({
    accountAddress: sponsor.accountAddress,
    amount: 100_000_000,
  });

  // Gas estimation
  console.log("\n--- Gas Estimation ---");
  const gasEstimate = await estimateGas(
    aptos,
    alice,
    "0x1::aptos_account::transfer",
    [bob.accountAddress, 1000]
  );
  console.log(`Estimated gas: ${gasEstimate.gasUsed}`);
  console.log(`Gas unit price: ${gasEstimate.gasUnitPrice}`);
  console.log(`Would succeed: ${gasEstimate.success}`);

  // Safe transaction with error handling
  console.log("\n--- Safe Transaction ---");
  const result = await safeTransaction(
    aptos,
    alice,
    "0x1::aptos_account::transfer",
    [bob.accountAddress, 1000]
  );
  console.log(`Transaction result:`, result);

  // Sponsored transaction example
  console.log("\n--- Sponsored Transaction ---");
  // Note: Bob has no APT, sponsor pays the gas
  await aptos.fundAccount({
    accountAddress: bob.accountAddress,
    amount: 1000, // Just enough to exist, not enough for gas
  });

  try {
    // This would normally fail because Bob can't pay gas
    // But sponsor pays for it
    const sponsoredResult = await sponsoredTransaction(
      aptos,
      bob,
      sponsor,
      "0x1::aptos_account::transfer",
      [alice.accountAddress, 100]
    );
    console.log(`Sponsored transaction success: ${sponsoredResult.success}`);
  } catch (error) {
    console.log("Sponsored transaction failed (expected in some cases)");
  }

  // Check final balances
  console.log("\n--- Final Balances ---");
  const aliceBalance = await aptos.getAccountAPTAmount({
    accountAddress: alice.accountAddress,
  });
  const bobBalance = await aptos.getAccountAPTAmount({
    accountAddress: bob.accountAddress,
  });
  const sponsorBalance = await aptos.getAccountAPTAmount({
    accountAddress: sponsor.accountAddress,
  });

  console.log(`Alice: ${aliceBalance} octas`);
  console.log(`Bob: ${bobBalance} octas`);
  console.log(`Sponsor: ${sponsorBalance} octas`);
}

main().catch(console.error);
