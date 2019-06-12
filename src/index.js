module.exports = Tinlake;

const fs = require('fs');
const SignerProvider = require('ethjs-provider-signer');
const sign = require('ethjs-signer').sign;
const Eth = require('ethjs');

let eth;
let contracts;
let abiDir
let ethFrom;
let ethConfig;

/**
 * Returns the Tinlake instance.
 *
 * @method Tinlake
 * @param {Object} rpcUrl
 * @param {Object} options the Eth options object
 * @returns {Object} tinlake Tinlake object instance
* @throws if the new flag is not used in construction
*/

function Tinlake(rpcUrl,mainAddress,privateKey, contractAbi, contractAddresses, options) {
    ethFrom = mainAddress;
    abiDir = contractAbi;

    let provider = new SignerProvider(rpcUrl, {
        signTransaction: (rawTx, cb) => cb(null, sign(rawTx, privateKey)),
        accounts: (cb) => cb(null, [ethFrom]),
    });

    eth = new Eth(provider,options);

    contracts = {
        "nft": getContract('test/SimpleNFT.abi', contractAddresses["nft"]),
        "title": getContract('Title.abi', contractAddresses["title"]),
        "currency": getContract('test/SimpleToken.abi',contractAddresses["currency"]) ,
        "admit": getContract('Admit.abi',contractAddresses["admit"]),
        "reception": getContract('Reception.abi', contractAddresses["reception"]),
        "desk": getContract('Desk.abi',  contractAddresses["desk"]),
        "shelf": getContract('Shelf.abi', contractAddresses["shelf"]),
        "appraiser": getContract('Appraiser.abi', contractAddresses["appraiser"]),
    };


    let gasLimit = 1000000;
    ethConfig = {from: ethFrom,  gasLimit: "0x"+gasLimit.toString(16)};

}
Tinlake.prototype.approveNFT = () => console.log('not implemented yet');

Tinlake.prototype.mintNFT = (deposit, tokenID) => contracts.nft.mint(deposit, tokenID, ethConfig);

Tinlake.prototype.admit = (registry, nft, principal, usr) => contracts.admit.admit(registry, nft, principal, usr, ethConfig);

Tinlake.prototype.borrow = () => console.log('not implemented yet');


function getContract(file, address) {
    let rawdata = fs.readFileSync(abiDir+file);
    return eth.contract(JSON.parse(rawdata)).at(address);
}