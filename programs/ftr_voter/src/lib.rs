//! A simple chat program using a ring buffer to store messages.

use anchor_lang::prelude::*;

use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Burn, Mint, MintTo, TokenAccount, Transfer,SetAuthority};

declare_id!("CpboR5xRD2mrwEo73Gjsj2DwvsrKUJTXBK4YJpEYLdRY");

#[program]
pub mod chat {
    use super::*;

    pub fn create_user(ctx: Context<UserCreator>, bump: u8) -> Result<()> {
      
        ctx.accounts.user.user_authority = *ctx.accounts.authority.key;
        ctx.accounts.user.bump = bump;
        ctx.accounts.user.vote = 0;
        ctx.accounts.user.locked = 0;


        Ok(())
    }




    pub fn initialize_pool(
        ctx: Context<InitializePool>,
     
        nonce: u8,

    ) -> Result<()> {


        let pool_account = &mut ctx.accounts.pool_account;
        
        pool_account.pool_ftr = *ctx.accounts.pool_ftr.to_account_info().key;
        
        pool_account.ftr_mint = ctx.accounts.pool_ftr.mint;
        pool_account.distribution_authority = *ctx.accounts.distribution_authority.key;
        pool_account.nonce = nonce;

        pool_account.vote_1_global=0;
        pool_account.vote_2_global=0;
        pool_account.vote_3_global=0;



        Ok(())
    }


    pub fn receive_vote_nd_ftr(
        ctx: Context<ExchangeFtrVoteToPool>,
      
        data:u64,
        msg:u8
    ) -> Result<()> {

        let amount=data ;
        // While token::transfer will check this, we prefer a verbose err msg.
        
        if ctx.accounts.user_ftr.amount < amount.into() {
            return Err(ErrorCode::LowFTR.into());
        }


        let mut user = &mut ctx.accounts.user;
       
        // Transfer user's USDC to pool USDC account.
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_ftr.to_account_info(),
            to: ctx.accounts.pool_ftr.to_account_info(),
            authority: ctx.accounts.user_authority.clone(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;


    
        user.locked=data;
        user.vote=msg;

        let mut pool = &mut ctx.accounts.pool_account; 
        if msg==1{
            pool.vote_1_global=pool.vote_1_global+data;
        }

        if msg==2{
            pool.vote_2_global=pool.vote_1_global+data;
        }

        if msg==3{
            pool.vote_3_global=pool.vote_1_global+data;
        }

        
        
     
        Ok(())
    }


    pub fn send_back_ftr(
        ctx: Context<ExchangeFtrVoteToUser>,

    ) -> Result<()> {

        
        // While token::burn will check this, we prefer a verbose err msg.
        if ctx.accounts.user.locked ==0 {
            return Err(ErrorCode::NoVote.into());
        }


        let mut user = &mut ctx.accounts.user;
    




 

        // Transfer USDC from pool account to user.
        let seeds = &[
            ctx.accounts.pool_account.ftr_mint.as_ref(),
            &[ctx.accounts.pool_account.nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_ftr.to_account_info(),
            to: ctx.accounts.user_ftr.to_account_info(),
            authority: ctx.accounts.pool_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, user.locked)?;


        let mut pool_account_loc = &mut ctx.accounts.pool_account;
        
        if user.vote==1{
            pool_account_loc.vote_1_global=pool_account_loc.vote_1_global-user.locked;
        }

        if user.vote==2{
            pool_account_loc.vote_2_global=pool_account_loc.vote_1_global-user.locked;
        }

        if user.vote==3{
            pool_account_loc.vote_3_global=pool_account_loc.vote_1_global-user.locked;
        }

        user.vote=0;
        user.locked=0;




        Ok(())
    }







}



#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(zero)]
    pub pool_account: Box<Account<'info, PoolAccount>>,
    pub pool_signer: AccountInfo<'info>,
    
    pub ftr_mint: Account<'info, Mint>,

    pub pool_ftr: Account<'info, TokenAccount>,
    #[account(signer)]
    pub distribution_authority: AccountInfo<'info>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}

impl<'info> InitializePool<'info> {
    fn accounts(ctx: &Context<InitializePool<'info>>, nonce: u8) -> Result<()> {
        let expected_signer = Pubkey::create_program_address(
            &[ctx.accounts.pool_ftr.mint.as_ref(), &[nonce]],
            ctx.program_id,
        )
        .map_err(|_| ErrorCode::InvalidNonce)?;
        if ctx.accounts.pool_signer.key != &expected_signer {
            return Err(ErrorCode::InvalidNonce.into());
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ExchangeFtrVoteToPool<'info> {
    #[account(mut, has_one = pool_ftr)]
    pub pool_account: Account<'info, PoolAccount>,
    #[account(signer)]
    pub user_authority: AccountInfo<'info>,
    #[account(
        seeds = [pool_account.ftr_mint.as_ref()],
        bump = pool_account.nonce,
    )]
    pool_signer: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [user_authority.key().as_ref()],
        bump = user.bump,
        has_one = user_authority,
        
    )]
    pub user: Account<'info, User>,
  
    #[account(mut)]
    pub pool_ftr: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_ftr: Account<'info, TokenAccount>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct ExchangeFtrVoteToUser<'info> {
    #[account(mut,has_one = pool_ftr)]
    pub pool_account: Account<'info, PoolAccount>,
    #[account(
        seeds = [pool_ftr.mint.as_ref()],
        bump = pool_account.nonce,
    )]
    pool_signer: AccountInfo<'info>,
    #[account(mut, constraint = pool_ftr.owner == *pool_signer.key)]
    pub pool_ftr: Account<'info, TokenAccount>,
    #[account(signer)]
    pub user_authority: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [user_authority.key().as_ref()],
        bump = user.bump,
        has_one = user_authority,
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub user_ftr: Account<'info, TokenAccount>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}



#[account]
pub struct PoolAccount {

    pub ftr_mint: Pubkey,
    pub pool_ftr: Pubkey,
    pub distribution_authority: Pubkey,
    pub vote_1_global:u64,
    pub vote_2_global:u64,
    pub vote_3_global:u64,
    pub nonce: u8,

}
#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct UserCreator<'info> {
    #[account(
        init,
        seeds = [authority.key().as_ref()],
        bump = bump,
        payer = authority,
        space = 800,
    )]
    user: Account<'info, User>,
    #[account(signer)]
    authority: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
}



#[account]
pub struct User {

    user_authority: Pubkey,
    bump: u8,
    vote: u8,
    locked: u64,
}





#[error]
pub enum ErrorCode {
    #[msg("IDO must start in the future")]
    IdoFuture,
    #[msg("We get there")]
    CheckError,
    #[msg("IDO times are non-sequential")]
    SeqTimes,
    #[msg("Already existing vote please cancel before resubmitting a vote")]
    ExistingVote,
    #[msg("IDO has not started")]
    StartIdoTime,
    #[msg("Deposits period has ended")]
    EndDepositsTime,
    #[msg("IDO has ended")]
    EndIdoTime,
    #[msg("IDO has not finished yet")]
    IdoNotOver,
    #[msg("Insufficient USDC")]
    LowUsdc,
    #[msg("No vote or locked funds registered at your address")]
    NoVote,
    #[msg("Insufficient FTR")]
    LowFTR,
    #[msg("Insufficient redeemable tokens")]
    LowRedeemable,
    #[msg("USDC total and redeemable total don't match")]
    UsdcNotEqRedeem,
    #[msg("Given nonce is invalid")]
InvalidNonce,
    Unknown,
}