let assert = require('assert');
let  fs = require("fs");
const rpcUrl  = process.env['ETH_RPC_URL'];

const Tinlake = require('../src/index.js');

let tinlake;
let ethFrom = "0x"+process.env['ETH_FROM'];
let nftID;
let addresses = JSON.parse(fs.readFileSync(process.env['ADDRESSES_TINLAKE']).toString());

describe('functional tinlake tests', function() {
    before(() => {
        tinlake = new Tinlake(rpcUrl,ethFrom, process.env['ETH_PRIVATE_KEY'],process.env['CONTRACTS_ABI'],addresses, {});
    })
    describe('tinlake borrow', function() {
        it('should mint an NFT & admit', () => {
            nftID = Math.floor(Math.random()*(10**15));
            tinlake.mintNFT(ethFrom,"0x"+nftID).then((result) => {
                console.log("mint result");
                console.log(result.txHash);
                console.log(result.events);
                let principal = 100;
               return tinlake.admit(addresses["NFT_COLLATERAL"],nftID, principal, ethFrom);
            }).then(result  => {
                console.log("admit result");
                console.log(result.txHash);
                console.log(result.events);

                let loanID = result.events[0].data[2].toString();
                console.log("Loan ID ==> "+loanID);


            }, (err) => {
                console.log(err);
            });

        });
    });
});