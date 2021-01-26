const dotenv = require('dotenv')
const ethers = require('ethers')
const actionsAbi = require('../src/abi/Actions.abi.json')
const navFeedAbi = require('../src/abi/NAVFeed.abi.json')

dotenv.config()

// const contract = new ethers.Contract('0x39e9b206dd1e8f9849f11e8ba6bb045e8321a239', actionsAbi)
const contract = new ethers.Contract('0x00cD3AE59fdbd375A187BF8074DB59eDAF766C19', navFeedAbi)

const run = async () => {
  const decoded = contract.interface.decodeFunctionData('borrow', '0x0ecbcdab0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000675e56da063e8940000')
  // const decoded = contract.interface.decodeFunctionData('lockBorrowWithdraw', '0x1614fa07000000000000000000000000c42cfb07bc1140f9a615bd63c4ffae5f8260ab220000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000675e56da063e8940000000000000000000000000000e23d39c932d1cfb8956d0291f4f06e61bb31729e')
  decoded.forEach((value) => {
    console.log(value.toString())
  })

}

run()