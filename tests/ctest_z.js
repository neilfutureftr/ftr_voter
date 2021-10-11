const anchor = require("@project-serum/anchor");
const assert = require("assert");
const { SystemProgram } = anchor.web3;
const { PublicKey } = anchor.web3;
const {
  TOKEN_PROGRAM_ID,
  sleep,
  getTokenAccount,
  createMint,
  createTokenAccount,
} = require("./utils");
process.env.ANCHOR_WALLET="/root/.config/solana/id.json"
process.env.ANCHOR_PROVIDER_URL="https://api.testnet.solana.com"

let provider=anchor.Provider.env();
anchor.setProvider(provider);
const idl_status = JSON.parse(require('fs').readFileSync('../target/idl/voterstate.json', 'utf8'));
// Address of the deployed pr
const programId = new anchor.web3.PublicKey('CpboR5xRD2mrwEo73Gjsj2DwvsrKUJTXBK4YJpEYLdRY');
const registry_idl = JSON.parse(require('fs').readFileSync('../target/idl/chat.json', 'utf8'));
const program = new anchor.Program(registry_idl, programId);
// Configure the client to use the local cluster.
// Configure the client to use the local cluster.




async function main(){

 

const authority = program.provider.wallet.publicKey;


const [user, bump] = await PublicKey.findProgramAddress(
      [authority.toBuffer()],
      program.programId
    );
const firstDeposit = new anchor.BN(2_000_672);

const vote = new anchor.BN(1);

const poolFtr=new anchor.web3.PublicKey(require('fs').readFileSync('poolFtr_voter.txt', 'utf8'));
const userFtr=new anchor.web3.PublicKey(require('fs').readFileSync('userFtr_voter.txt', 'utf8'));
const poolSigner=new anchor.web3.PublicKey(require('fs').readFileSync('poolSigner_voter.txt', 'utf8'));

const poolAccount_pk=new anchor.web3.PublicKey(require('fs').readFileSync('poolAccount_voter.txt', 'utf8'));


let account_already_created=true;

try{
const account = await program.account.user.fetch(user);
console.log(account);
}catch{
  console.log("Account not found")
  account_already_created=false;
}

try{
  if (account_already_created==false){
    console.log("Attempting to create user ");
await program.rpc.createUser( bump, {
      accounts: {
        user,
        authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });
  console.log("Successfully created user ");
}else{console.log("User was already created");}
}
     catch (err) {
      console.log("This is the error message", err.toString());
      console.log("User was probably created already");
    }







poolFtrAccount = await getTokenAccount(provider, poolFtr);
userFtrAccount = await getTokenAccount(provider, userFtr);
console.log("USDC in the FTR pool")
console.log(poolFtrAccount.amount);
console.log("USDC in the user FTR wallet")
console.log(userFtrAccount.amount)

try{
await program.rpc.receiveVoteNdFtr(firstDeposit,vote,{
    accounts: {
    poolAccount: poolAccount_pk,
    userAuthority: provider.wallet.publicKey,
    poolSigner,
    user,
    poolFtr,
    userFtr,
    tokenProgram: TOKEN_PROGRAM_ID,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  },

  }

  )

    } catch (err) {
      console.log("This is the error message", err.toString());
    }
console.log("Checking vote")
poolFtrAccount = await getTokenAccount(provider, poolFtr);
userFtrAccount = await getTokenAccount(provider, userFtr);
//userAccount = await program.account.data.fetch(user.publicKey);
console.log("USDC in the FTR pool")
console.log(poolFtrAccount.amount);
console.log("USDC in the user FTR wallet")
console.log(userFtrAccount.amount)

console.log("Cancelling vote")

try{
await program.rpc.sendBackFtr({
    accounts: {
    poolAccount: poolAccount_pk,
    
    poolSigner,
    poolFtr,
    userAuthority: provider.wallet.publicKey,
    user,
    userFtr,
    tokenProgram: TOKEN_PROGRAM_ID,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  },

  }

  )

    } catch (err) {
      console.log("This is the error message", err.toString());
    }
console.log("Checking vote")
poolFtrAccount = await getTokenAccount(provider, poolFtr);
userFtrAccount = await getTokenAccount(provider, userFtr);
console.log("USDC in the FTR pool")
console.log(poolFtrAccount.amount)
console.log("USDC in the user FTR wallet")
console.log(userFtrAccount.amount)




}
main();

