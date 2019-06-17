let assert = require('assert');
let  fs = require("fs");
const rpcUrl  = process.env['ETH_RPC_URL'];

const Tinlake = require('../src/index.js');

let tinlake;
let ethFrom = "0x"+process.env['ETH_FROM'];
let tokenID;
let loanID;
let addresses = JSON.parse(fs.readFileSync(process.env['ADDRESSES_TINLAKE']).toString());

describe('functional tinlake tests', function() {
    before(() => {
        tinlake = new Tinlake(rpcUrl,ethFrom, process.env['ETH_PRIVATE_KEY'],process.env['CONTRACTS_ABI'],addresses, {});
    })
    describe('tinlake borrow and repay', function() {
        this.timeout(50000);

        let principal = 100;
        let appraisal = 300;
        console.log("appraisal: "+appraisal);
        console.log("principal: "+principal);
        it('borrow and repay successful', () => {
            tokenID = "0x"+Math.floor(Math.random()*(10**15));
            console.log("Token ID -> "+tokenID);
            return tinlake.mintNFT(ethFrom,tokenID).then((result) => {
                console.log("mint result");
                console.log(result.txHash);
                console.log(result.events);

               return tinlake.adminAdmit(addresses["NFT_COLLATERAL"],tokenID, principal, ethFrom);
            }).then(result  => {
                console.log("admit result");
                console.log(result.txHash);
                console.log(result.events);

                // parse loanID from event
                loanID = result.events[0].data[2].toString();
                console.log("Loan ID ==> "+loanID);
                return tinlake.approveNFT(tokenID, addresses["SHELF"]);

            }, (err) => {
                console.log(err);
            }).then(result => {
                console.log("approve results");
                console.log(result.txHash);
                console.log(result.events);
                return tinlake.adminAppraise(loanID, appraisal);

            }).then(result => {
                console.log("appraisal results");
                console.log(result.txHash);
                console.log(result.events);
                return tinlake.borrow(loanID, ethFrom);

            }).then(result => {
                console.log("borrow results");
                console.log(result.txHash);
                console.log(result.events);
                return tinlake.balanceOfCurrency(ethFrom);
            }).then(balance => {
                console.log("DAI Balance after borrow");
                console.log(balance["0"].toString() + " DAI");
                console.log("repay");
                return tinlake.approveCurrency(addresses["PILE"],principal);
            }).then(result => {
                console.log(result);
                return tinlake.repay(loanID, principal,ethFrom, ethFrom);

            }).then(result => {
                console.log(result);
                return tinlake.balanceOfCurrency(ethFrom);

            }).then(balance => {
                console.log("DAI Balance after Repay");
                console.log(balance["0"].toString() +" DAI");
                return Promise.resolve("success");
            });

        });
    });
});