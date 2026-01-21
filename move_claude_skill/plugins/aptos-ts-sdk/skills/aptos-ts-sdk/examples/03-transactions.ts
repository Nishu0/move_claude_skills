/**
 * 03-transactions.ts
 * Building, Signing, and Submitting Transactions
 *
 * Transaction flow:
 * 1. Build - Create transaction payload
 * 2. Simulate (optional) - Test without submitting
 * 3. Sign - Create signature
 * 4. Submit - Send to network
 * 5. Wait - Confirm execution
 */

import {
  Account,
  Aptos,
  AptosConfig,
  Network,
  InputGenerateTransactionPayloadData,
} from "@aptos-labs/ts-sdk";

// ============ Simple Transfer ============

async function simpleTransfer(
  aptos: Aptos,
  sender: Account,
  recipientAddress: string,
  amount: number
) {
  // 1. Build
  const transaction = await aptos.transaction.build.simple({
    sender: sender.accountAddress,
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [recipientAddress, amount],
    },
  });

  // 2. Simulate (optional)
  const [simulation] = await aptos.transaction.simulate.simple({
    signerPublicKey: sender.publicKey,
    transaction,
  });

  if (!simulation.success) {
    throw new Error(`Simulation failed: ${simulation.vm_status}`);
  }

  console.log(`Gas used (simulated): ${simulation.gas_used}`);

  // 3. Sign
  const senderAuthenticator = aptos.transaction.sign({
    signer: sender,
    transaction,
  });

  // 4. Submit
  const submitted = await aptos.transaction.submit.simple({
    transaction,
    senderAuthenticator,
  });

  // 5. Wait
  const result = await aptos.waitForTransaction({
    transactionHash: submitted.hash,
  });

  return result;
}

// ============ Call Custom Module Function ============

async function callModuleFunction(
  aptos: Aptos,
  sender: Account,
  moduleAddress: string,
  moduleName: string,
  functionName: string,
  typeArgs: string[],
  args: any[]
) {
  const transaction = await aptos.transaction.build.simple({
    sender: sender.accountAddress,
    data: {
      function: `${moduleAddress}::${moduleName}::${functionName}`,
      typeArguments: typeArgs,
      functionArguments: args,
    },
  });

  const auth = aptos.transaction.sign({ signer: sender, transaction });
  const result = await aptos.transaction.submit.simple({
    transaction,
    senderAuthenticator: auth,
  });

  return await aptos.waitForTransaction({ transactionHash: result.hash });
}

// ============ Transaction with Options ============

async function transferWithOptions(
  aptos: Aptos,
  sender: Account,
  recipientAddress: string,
  amount: number
) {
  const transaction = await aptos.transaction.build.simple({
    sender: sender.accountAddress,
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [recipientAddress, amount],
    },
    options: {
      maxGasAmount: 10000, // Maximum gas willing to pay
      gasUnitPrice: 100, // Gas price in octas
      expireTimestamp: Math.floor(Date.now() / 1000) + 600, // 10 min expiry
    },
  });

  const auth = aptos.transaction.sign({ signer: sender, transaction });
  const result = await aptos.transaction.submit.simple({
    transaction,
    senderAuthenticator: auth,
  });

  return await aptos.waitForTransaction({ transactionHash: result.hash });
}

// ============ Batch Transactions ============

async function batchTransfer(
  aptos: Aptos,
  sender: Account,
  recipients: { address: string; amount: number }[]
) {
  const results = [];

  for (const { address, amount } of recipients) {
    const tx = await aptos.transaction.build.simple({
      sender: sender.accountAddress,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [address, amount],
      },
    });

    const auth = aptos.transaction.sign({ signer: sender, transaction: tx });
    const submitted = await aptos.transaction.submit.simple({
      transaction: tx,
      senderAuthenticator: auth,
    });

    results.push(submitted.hash);
  }

  // Wait for all transactions
  await Promise.all(
    results.map((hash) =>
      aptos.waitForTransaction({ transactionHash: hash })
    )
  );

  return results;
}

// ============ Sign and Submit Helper ============

async function signAndSubmit(
  aptos: Aptos,
  sender: Account,
  data: InputGenerateTransactionPayloadData
) {
  const transaction = await aptos.transaction.build.simple({
    sender: sender.accountAddress,
    data,
  });

  return await aptos.signAndSubmitTransaction({
    signer: sender,
    transaction,
  });
}

// ============ Example Usage ============

async function main() {
  console.log("=== Transaction Example ===\n");

  const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

  // Create accounts
  const alice = Account.generate();
  const bob = Account.generate();

  console.log(`Alice: ${alice.accountAddress}`);
  console.log(`Bob: ${bob.accountAddress}`);

  // Fund accounts
  console.log("\nFunding accounts...");
  await aptos.fundAccount({
    accountAddress: alice.accountAddress,
    amount: 100_000_000,
  });
  await aptos.fundAccount({
    accountAddress: bob.accountAddress,
    amount: 100,
  });

  // Check balances before
  const aliceBefore = await aptos.getAccountAPTAmount({
    accountAddress: alice.accountAddress,
  });
  const bobBefore = await aptos.getAccountAPTAmount({
    accountAddress: bob.accountAddress,
  });

  console.log(`\nBefore transfer:`);
  console.log(`  Alice: ${aliceBefore} octas`);
  console.log(`  Bob: ${bobBefore} octas`);

  // Simple transfer
  console.log("\nTransferring 1,000,000 octas...");
  const result = await simpleTransfer(
    aptos,
    alice,
    bob.accountAddress.toString(),
    1_000_000
  );

  console.log(`Transaction hash: ${result.hash}`);
  console.log(`Success: ${result.success}`);

  // Check balances after
  const aliceAfter = await aptos.getAccountAPTAmount({
    accountAddress: alice.accountAddress,
  });
  const bobAfter = await aptos.getAccountAPTAmount({
    accountAddress: bob.accountAddress,
  });

  console.log(`\nAfter transfer:`);
  console.log(`  Alice: ${aliceAfter} octas`);
  console.log(`  Bob: ${bobAfter} octas`);
  console.log(`\nBob received: ${bobAfter - bobBefore} octas`);
}

main().catch(console.error);
