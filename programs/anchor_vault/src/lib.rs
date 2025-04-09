use anchor_lang::prelude::*;

declare_id!("C1Hj34Yrhc2R4vnFbRtABeoRLozAnx9VhgpScg3hHuHp");

#[program]
pub mod anchor_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        msg!("Initializing Vault PDA...");

        let vault = &mut ctx.accounts.vault;

        vault.owner = *ctx.accounts.authority.key;
        vault.created_at = Clock::get()?.unix_timestamp;
        vault.value = 0;

        msg!("Vault PDA initialized successfully:");
        msg!(" Owner: {}", vault.owner);
        msg!(" Created At: {}", vault.created_at);
        msg!(" Value: {}", vault.value);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        seeds = [b"vault", authority.key().as_ref()],
        bump,
        payer = authority,
        space = 8 + 32 + 8 + 8
    )]
    pub vault: Account<'info, VaultData>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct VaultData {
    pub owner: Pubkey,
    pub created_at: i64,
    pub value: u64,
}
