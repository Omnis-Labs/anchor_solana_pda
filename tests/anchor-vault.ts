import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VaultProgram } from "../target/types/vault_program"; // Import the generated types
import { assert } from "chai";
import { Keypair, SystemProgram, PublicKey } from "@solana/web3.js";

describe("anchor-vault", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Use the program generated from the IDL
  const program = anchor.workspace.VaultProgram as Program<VaultProgram>;

  // We'll use the provider's wallet as the authority for simplicity
  const authority = provider.wallet as anchor.Wallet;
  console.log(`Using authority: ${authority.publicKey.toBase58()}`);

  // Derive the PDA address for the vault account
  // Use the same seeds as defined in the Rust program's InitializeVault struct
  let vaultPda: PublicKey;
  let vaultBump: number;

  before(async () => {
    // Derive the PDA before running tests
    [vaultPda, vaultBump] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("vault"), // Seed "vault"
        authority.publicKey.toBuffer(),         // Authority's public key
      ],
      program.programId
    );
    console.log(`Derived Vault PDA: ${vaultPda.toBase58()}`);
    console.log(`Using Program ID: ${program.programId.toBase58()}`);
  });

  it("Initializes the Vault PDA!", async () => {
    console.log("\nSending initialize_vault transaction...");

    try {
      // Check if the account already exists (optional, good practice)
      const existingAccount = await provider.connection.getAccountInfo(vaultPda);
      if (existingAccount) {
        console.log(`Vault PDA ${vaultPda.toBase58()} already exists. Skipping initialization.`);
        // You might want to fetch and check data here instead of skipping
        const vaultAccount = await program.account.vaultData.fetch(vaultPda);
        console.log("Existing Vault Data:", {
          owner: vaultAccount.owner.toBase58(),
          createdAt: vaultAccount.createdAt.toNumber(), // Convert BN to number for logging
          value: vaultAccount.value.toNumber(), // Convert BN to number for logging
        });
        assert.isTrue(vaultAccount.owner.equals(authority.publicKey), "Owner mismatch in existing account");
        return; // Exit the test if it already exists
      }

      // Call the initialize_vault instruction
      const txSignature = await program.methods
        .initializeVault()
        .accounts({
          vault: vaultPda,             // The PDA address we derived
          authority: authority.publicKey, // The payer and signer
          systemProgram: SystemProgram.programId,
        })
        // No explicit signers needed here if using provider.wallet which signs automatically
        .rpc();

      console.log("Transaction successful with signature:", txSignature);

      // Fetch the created account data
      console.log("Fetching created account data...");
      const vaultAccount = await program.account.vaultData.fetch(vaultPda);

      console.log("Decoded Vault Data:", {
        owner: vaultAccount.owner.toBase58(),
        createdAt: vaultAccount.createdAt.toNumber(), // Convert BN to number for logging
        value: vaultAccount.value.toNumber(), // Convert BN to number for logging
      });

      // Assertions to verify the data
      assert.isTrue(vaultAccount.owner.equals(authority.publicKey), "Owner does not match authority");
      assert.strictEqual(vaultAccount.value.toNumber(), 0, "Initial value should be 0");
      assert.isAbove(vaultAccount.createdAt.toNumber(), 0, "Created timestamp should be positive");

      console.log("Vault PDA initialized and verified successfully!");

    } catch (error) {
      console.error("Transaction failed:", error);
      // Log Solana transaction logs if available
      if (error.logs) {
        console.error("\nSolana Transaction Logs:");
        error.logs.forEach(log => console.error(log));
      }
      // Rethrow or fail the test explicitly
      assert.fail(`Transaction failed: ${error}`);
    }
  });

  // Add more tests here later, e.g., for updating the vault value
  // it("Updates the vault value!", async () => {
  //   // ... implementation ...
  // });
}); 