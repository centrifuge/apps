const dotenv = require('dotenv')
const ethers = require('ethers')
const navFeedAbi = require('../src/abi/NAVFeed.abi.json')

dotenv.config()

/**
 * This is a simple script to help with decoding function calls found on Etherscan.
 */

const contract = new ethers.Contract('0x00cD3AE59fdbd375A187BF8074DB59eDAF766C19', navFeedAbi)

const run = async () => {
  const decoded = contract.interface.decodeFunctionData('borrow', '0x0ecbcdab0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000675e56da063e8940000')
  decoded.forEach((value) => {
    console.log(value.toString())
  })

}

run()