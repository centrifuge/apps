import Tinlake from '../src'

const SignerProvider = require('ethjs-provider-signer');
const { sign } = require('ethjs-signer');
let assert = require('assert');
let fs = require("fs");
let path = require("path");
const rpcUrl = process.env['ETH_RPC_URL'];

const SUCCESS_STATUS = "0x1";

let tinlake: Tinlake;
let ethFrom = "0x" + process.env['ETH_FROM'];
let tokenID: string;
let loanID: string;
let addresses = JSON.parse(fs.readFileSync(process.env['ADDRESSES_TINLAKE']).toString());

const gasLimit = 1000000

describe('functional tinlake tests', function () {
  before(() => {
    tinlake = new Tinlake(
      new SignerProvider(rpcUrl, {
        signTransaction: (rawTx: any, cb: (arg0: null, arg1: any) => void) => cb(null, sign(rawTx, process.env.ETH_PRIVATE_KEY)),
        accounts: (cb: (arg0: null, arg1: string[]) => void) => cb(null, [ethFrom]),
      }),
      {
        contractAbiPath: path.resolve(__dirname, '..', 'src', 'abi'),
        ethConfig: { from: ethFrom, gasLimit: "0x" + gasLimit.toString(16) }
      },
    );
  })
  describe('tinlake borrow and repay', function () {
    this.timeout(50000);
    let principal = 100;
    let appraisal = 300;
    it('borrow and repay successful', () => {
      console.log("appraisal: " + appraisal);
      console.log("principal: " + principal);
      tokenID = "0x" + Math.floor(Math.random() * (10 ** 15));
      console.log("token id: " + tokenID);
      return tinlake.mintNFT(ethFrom, tokenID).then((result) => {
        console.log("mint result");
        console.log(result.txHash);
        assert.equal(result.status, SUCCESS_STATUS, "tx should be successful");
        assert.equal(result.events[0].event.name, "Transfer", "tx should be successful");
        console.log("-------------------------------------");
        console.log("admin whitelist NFT");
        console.log("-------------------------------------");

        return tinlake.adminAdmit(addresses["NFT_COLLATERAL"], tokenID, principal, ethFrom);
      }).then((result) => {
        console.log("admit result");
        console.log(result.txHash);

        // parse loanID from event
        loanID = result.events[0].data[2].toString();
        console.log("Loan id: " + loanID);

        assert.equal(result.status, SUCCESS_STATUS, "tx should be successful");
        assert.equal(result.events[0].event.name, "Transfer", "tx should be successful");
        return tinlake.approveNFT(tokenID, addresses["SHELF"]);
      }, (err: any) => {
        console.log(err);
        throw err
      }).then((result) => {
        console.log("approve results");
        console.log(result.txHash);
        assert.equal(result.status, SUCCESS_STATUS, "tx should be successful");
        assert.equal(result.events[0].event.name, "Approval", "tx should be successful");
        return tinlake.adminAppraise(loanID, appraisal);

      }).then((result: { txHash: any; status: any; }) => {
        console.log("appraisal results");
        console.log(result.txHash);
        assert.equal(result.status, SUCCESS_STATUS, "tx should be successful");
        console.log("-------------------------------------");
        console.log("borrow");
        console.log("-------------------------------------");
        return tinlake.borrow(loanID, ethFrom);

      }).then((result: { txHash: any; status: any; }) => {
        console.log(result.txHash);
        assert.equal(result.status, SUCCESS_STATUS, "tx should be successful");
        return tinlake.balanceOfCurrency(ethFrom);
      }).then((balance) => {
        console.log("DAI Balance after borrow");
        console.log(balance["0"].toString() + " DAI");
        console.log("-------------------------------------");
        console.log("repay");
        console.log("-------------------------------------");
        return tinlake.approveCurrency(addresses["PILE"], principal);
      }).then((result) => {
        console.log(result.txHash);
        assert.equal(result.events[0].event.name, "Approval", "tx should be successful");
        assert.equal(result.status, SUCCESS_STATUS, "tx should be successful");
        return tinlake.repay(loanID, principal, ethFrom, ethFrom);

      }).then((result: { txHash: any; status: any; }) => {
        console.log(result.txHash);
        assert.equal(result.status, SUCCESS_STATUS, "tx should be successful");
        return tinlake.balanceOfCurrency(ethFrom);

      }).then((balance) => {
        console.log("DAI Balance after Repay");
        console.log(balance["0"].toString() + " DAI");
        return Promise.resolve("success");
      });

    });
  });
});
