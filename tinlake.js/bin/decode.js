const dotenv = require('dotenv')
const ethers = require('ethers')
const actionsAbi = require('../src/abi/Actions.abi.json')

dotenv.config()

/**
 * This is a simple script to help with decoding function calls found on Etherscan.
 */

const contract = new ethers.Contract('0xA0B0d8394ADC79f5d1563a892abFc6186E519644', actionsAbi)

const run = async () => {
  const decoded = contract.interface.decodeFunctionData('close', '0xe49280cb000000000000000000000000a0b0d8394adc79f5d1563a892abfc6186e5196440000000000000000000000000000000000000000000000000000000000000044')
  decoded.forEach((value) => {
    console.log(value.toString())
  })

}

run()