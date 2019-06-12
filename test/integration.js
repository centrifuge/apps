let assert = require('assert');
const rpcUrl  = process.env['ETH_RPC_URL'];

const Tinlake = require('../src/index.js');

let tinlake;
let ethFrom = "0x"+process.env['ETH_FROM'];
let nftID;
let addresses = {
    "nft":process.env['NFT_COLLATERAL'],
    "title":process.env['TITLE'],
    "currency":process.env['CURRENCY'],
    "admit":process.env['ADMIT'],
    "reception":process.env['RECEPTION'],
    "desk":process.env['DESK'],
    "shelf":process.env['SHELF'],
    "appraiser":process.env['APPRAISER'],
};

describe('functional tinlake tests', function() {
    before(() => {
        tinlake = new Tinlake(rpcUrl,ethFrom, process.env['ETH_PRIVATE_KEY'],process.env['CONTRACTS_ABI'],addresses, {});
    })
    describe('tinlake borrow', function() {
        it('should mint an NFT', () => {
            nftID = Math.floor(Math.random()*(10**15));
            tinlake.mintNFT(ethFrom,"0x"+nftID).then((result) => {
                console.log("[Mint NFT] Ethereum Transaction: " + result);
            }, (err) => {
              console.log(err);
            });
        });
        it('should admit NFT', () => {
            let principal = 100;
            tinlake.admit(addresses["nft"],nftID, principal, ethFrom).then((result) => {
                console.log("[admit Admit] Ethereum Transaction: " + result);
            }, (err) => {
                console.log(err);
            });

        });
        it('should appraiser file NFT', () => {
            //todo
        });
    });


});