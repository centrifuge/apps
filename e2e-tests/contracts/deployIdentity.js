const Web3 = require('web3');
const HDWalletProvider = require("truffle-hdwallet-provider");
const identityFactoryArtifacts = require('./build/contracts/IdentityFactory.json')

let account = process.env.ETH_FROM
let endpoint = process.env.ETH_RPC_URL
let privateKey = process.env.ETH_PRIVATE_KEY

const web3 = new Web3(new HDWalletProvider(privateKey, endpoint));

const identityFactoryAddress = identityFactoryArtifacts.networks["17"].address

const IdentityFactory = new web3.eth.Contract(
    identityFactoryArtifacts.abi,
    identityFactoryAddress
);

const asyncBlock = async () => {
    // use the already deployed identity factory to create an identity contract
    IdentityFactory.methods.createIdentity().send({ from: account })
    .then(identity => {
        // console.log the result so it can be captured in deploy.sh
        console.log(identity.events.IdentityCreated.returnValues.identity)
        process.exit(0)
    })
    .catch(err => {
        console.log(err)
        process.exit(1)

    })
}

asyncBlock()