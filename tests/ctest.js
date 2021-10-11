const anchor = require("@project-serum/anchor");
const assert = require("assert");
const fs = require('fs')
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

 console.log("CREATING FTR Mint");

  let fakeFTRMintToken = await createMint(provider);

  let ftrMint = fakeFTRMintToken.publicKey;
  fs.writeFile('ftr_mint_voter.txt', ftrMint.toString(),(err) => {if (err) throw err; }) 

  const [_poolSigner, nonce] = await anchor.web3.PublicKey.findProgramAddress(
    [ftrMint.toBuffer()],
    program.programId
  );
//console.log(ftrMint.toString())


const authority = program.provider.wallet.publicKey;


const [user, bump] = await PublicKey.findProgramAddress(
      [authority.toBuffer()],
      program.programId
    );



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









poolSigner = _poolSigner;

poolFtr = await createTokenAccount(
  provider,
  ftrMint,
  poolSigner
);

userFtr = await createTokenAccount(
  provider,
  ftrMint,
  provider.wallet.publicKey
);


  fs.writeFile('poolFtr_voter.txt', poolFtr.toString(),(err) => {if (err) throw err; }) 

  fs.writeFile('userFtr_voter.txt', userFtr.toString(),(err) => {if (err) throw err; }) 

  fs.writeFile('poolSigner_voter.txt', poolSigner.toString(),(err) => {if (err) throw err; }) 




poolAccount = anchor.web3.Keypair.generate();
//console.log(poolAccount.publicKey.toString());


  fs.writeFile('poolAccount_voter.txt', poolAccount.publicKey.toString(),(err) => {if (err) throw err; }) 





// Atomically create the new account and initialize it with the program.
try{
await program.rpc.initializePool(
nonce,
{
  accounts: {
    poolAccount: poolAccount.publicKey,
    poolSigner,
    ftrMint,
    poolFtr,
    distributionAuthority: provider.wallet.publicKey,

    tokenProgram: TOKEN_PROGRAM_ID,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  },
  signers: [poolAccount],
  instructions: [
await program.account.poolAccount.createInstruction(poolAccount),
  ],
})
}
     catch (err) {
      console.log("This is the error message", err.toString());
      console.log("User was probably created already");
    }
console.log("Pool created")


const firstDeposit = new anchor.BN(23_000_672);
const vote = new anchor.BN(1);
console.log(firstDeposit);
await fakeFTRMintToken.mintTo(
      userFtr,
      provider.wallet.publicKey,
      [],
      firstDeposit.toString(),
);

poolFtrAccount = await getTokenAccount(provider, poolFtr);
userFtrAccount = await getTokenAccount(provider, userFtr);
console.log("USDC in the FTR pool")
console.log(poolFtrAccount.amount);
console.log("USDC in the user FTR wallet")
console.log(userFtrAccount.amount)

try{
await program.rpc.receiveVoteNdFtr(firstDeposit,vote,{
    accounts: {
    poolAccount: poolAccount.publicKey,
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
    poolAccount: poolAccount.publicKey,
    
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

