const { ethers } = require("ethers");

 const key = `{"address":"a49be2371e13049400f0330c26778aae3537087a","crypto":{"cipher":"aes-128-ctr","ciphertext":"c3b92d86a73e856e4eb66470addfa15829e2af9093da04c0555dfb1734d423d0","cipherparams":{"iv":"d5ba72c8dd600b0d3ee9818e041ab3c8"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"d5902caf8e509ea0886f93d008cb99fbd392210c3f7ff24b525df4ce1788a0ac"},"mac":"d92a0cc3fe335f20d5e757804ae2c901a6764eebae49ad2b64139122271fc0a4"},"id":"2c31ff99-ba0e-42aa-bea8-a50d04a8072b","version":3}`
async function extract(){
  const wallet = await ethers.Wallet.fromEncryptedJson(key, [], null)
    .catch(err => console.log(err))
  console.log("Private Key: " + wallet.privateKey)
}

extract()
