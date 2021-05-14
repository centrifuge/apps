const dotenv = require('dotenv')
const ethers = require('ethers')
const memberlistAbi = require('../src/abi/Memberlist.abi.json')
const memberAdminAbi = require('../src/abi/MemberAdmin.abi.json')
const fetch = require('node-fetch');
let fs = require("fs")
const stringify = require('csv-stringify');

const poolConfigUrl = 'https://github.com/centrifuge/tinlake-pools-mainnet/releases/download/8a2d1c8/pools.json'
const etherscanApiKey = 'ZR1IIQFEW4NK8DNSMW9SRWT1K5VKH8T6R2'

dotenv.config()

const memberlistInterface = new ethers.utils.Interface(memberlistAbi);
const memberAdminInterface = new ethers.utils.Interface(memberAdminAbi);

const getAddresses = async (provider, contract) => {
  const history = await provider.getHistory(contract)

  return history
    .map((tx) => memberlistInterface.parseTransaction(tx))
    .filter((tx) => tx.name === 'updateMember')
    .map((tx) => tx.args[0])

}

const run = async () => {
  const provider = new ethers.providers.EtherscanProvider(null, etherscanApiKey)
  const poolConfigRes = await fetch(poolConfigUrl)
  const poolConfig = await poolConfigRes.json()
  
  let data = [];
  let columns = {
    pool: 'Pool',
    tranche: 'Tranche',
    address: 'Address'
  };

  // Get non-internal tx from separate memberlists
  let memberlistToPoolTranche = {}
  for (let config of Object.values(poolConfig)) {
    if (!config.addresses || !('JUNIOR_MEMBERLIST' in config.addresses)) continue
    
    const juniorAddresses = await getAddresses(provider, config.addresses['JUNIOR_MEMBERLIST'])
    for (let address of juniorAddresses) {
      data.push([
        config.metadata.shortName || config.metadata.name,
        'junior',
        address,
      ])
    }
    memberlistToPoolTranche[config.addresses['JUNIOR_MEMBERLIST']] = {
      pool: config.metadata.shortName || config.metadata.name,
      tranche: 'junior'
    }
    
    const seniorAddresses = await getAddresses(provider, config.addresses['SENIOR_MEMBERLIST'])
    for (let address of seniorAddresses) {
      data.push([
        config.metadata.shortName || config.metadata.name,
        'senior',
        address,
      ])
    }
    memberlistToPoolTranche[config.addresses['SENIOR_MEMBERLIST']] = {
      pool: config.metadata.shortName || config.metadata.name,
      tranche: 'senior'
    }
  }

  // console.log(memberlistToPoolTranche)
  
  // Get tx from member admin
  // const history = await provider.getHistory('0xB7e70B77f6386Ffa5F55DDCb53D87A0Fb5a2f53b')

  // return history
  //   .map((tx) => memberAdminInterface.parseTransaction(tx))
  //   .map((tx) => console.log(tx))
  //   // .filter((tx) => tx.name === 'updateMember')

  stringify(data, { header: true, columns: columns }, (err, output) => {
    if (err) throw err;
    fs.writeFile('members.csv', output, (err) => {
      if (err) throw err;
      console.log('members.csv saved.');
    });
  });  

}

run()