const { ethers } = require("ethers");

 const key = `<PASTE KEY STRING HERE!>`
async function extract(){
  const wallet = await ethers.Wallet.fromEncryptedJson(key, [], null)
    .catch(err => console.log(err))
  console.log("Private Key: " + wallet.privateKey)
}

extract()
