const { ethers } = require("ethers");

 const key = `{"address":"c74becd55cf6093e9d47d46d9626ca87fcaf576f","crypto":{"cipher":"aes-128-ctr","ciphertext":"694daaace33b37afb366a7ec11d7f76cbf2c020ea20e05d2ea698e246dc87452","cipherparams":{"iv":"9a3d71c74b53daf03ce94c3cad7b9c74"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"2cce9f0d67aed05645dec1687998f2d9bdf9564ed53d9ddd98df4aeca9121be0"},"mac":"34953fa812391bd91793c2b51bba8c628d78bc200a676317e9c39479d1926f7a"},"id":"e5c0fe36-e8a0-4c56-8075-3f15b12a71aa","version":3}
`
async function extract(){
  const wallet = await ethers.Wallet.fromEncryptedJson(key, [], null)
    .catch(err => console.log(err))
  console.log("Private Key: " + wallet.privateKey)
}

extract()
