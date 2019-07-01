// tslint:disable-next-line:variable-name
const SignerProvider = require('ethjs-provider-signer');
const { sign } = require('ethjs-signer');
import assert from 'assert';
const fs = require('fs');
const rpcUrl = process.env['ETH_RPC_URL'];
// tslint:disable-next-line:import-name
import BN from 'bn.js';

import Tinlake from '../dist/Tinlake';

const SUCCESS_STATUS = '0x1';

let tinlake: Tinlake;
const ethFrom = `0x${process.env['ETH_FROM']}`;
let tokenID: string;
let loanID: string;
const addresses = JSON.parse(fs.readFileSync(process.env['ADDRESSES_TINLAKE']).toString());

const gasLimit = 1000000;

describe('functional tinlake tests', () => {
  before(() => {
    tinlake = new Tinlake(
      new SignerProvider(rpcUrl, {
        signTransaction: (rawTx: any, cb: (arg0: null, arg1: any) => void) =>
          cb(null, sign(rawTx, process.env.ETH_PRIVATE_KEY)),
        accounts: (cb: (arg0: null, arg1: string[]) => void) => cb(null, [ethFrom]),
      }),
      {
        ethConfig: { from: ethFrom, gasLimit: `0x${gasLimit.toString(16)}` },
      },
    );
  });

  describe.only('tinlake call functionality', function () {
    this.timeout(50000);

    it('count number of loans', async () => {
      const count = await tinlake.loanCount();
      console.log(`Found ${count} loans `);
      assert(count.gte(new BN(0)));
    });

    it('get a loan', async () => {
      const res = await tinlake.getLoan(20);
      assert(res.price instanceof BN);
      assert(res.principal instanceof BN);
      assert(typeof res.registry === 'string');
      assert(res.tokenId instanceof BN);
    });

    it('get balance and debt from pile for a loan', async () => {
      const res = await tinlake.getBalanceDebt(20);
      assert(res.balance instanceof BN);
      assert(res.debt instanceof BN);
    });
  });

  describe('tinlake borrow and repay', function () {
    this.timeout(50000);
    const principal = '100';
    const appraisal = '300';
    it('borrow and repay successful', () => {
      console.log(`appraisal: ${appraisal}`);
      console.log(`principal: ${principal}`);
      tokenID = `0x${Math.floor(Math.random() * (10 ** 15))}`;
      console.log(`token id: ${tokenID}`);
      return tinlake.mintNFT(ethFrom, tokenID).then((result) => {
        console.log('mint result');
        console.log(result.txHash);
        assert.equal(result.status, SUCCESS_STATUS, 'tx should be successful');
        assert.equal(result.events[0].event.name, 'Transfer', 'tx should be successful');
        console.log('-------------------------------------');
        console.log('admin whitelist NFT');
        console.log('-------------------------------------');

        return tinlake.adminAdmit(addresses['NFT_COLLATERAL'], tokenID, principal, ethFrom);
      }).then((result) => {
        console.log('admit result');
        console.log(result.txHash);

        // parse loanID from event
        loanID = result.events[0].data[2].toString();
        console.log(`Loan id: ${loanID}`);

        assert.equal(result.status, SUCCESS_STATUS, 'tx should be successful');
        assert.equal(result.events[0].event.name, 'Transfer', 'tx should be successful');
        return tinlake.approveNFT(tokenID, addresses['SHELF']);
      },      (err: any) => {
        console.log(err);
        throw err;
      }).then((result) => {
        console.log('approve results');
        console.log(result.txHash);
        assert.equal(result.status, SUCCESS_STATUS, 'tx should be successful');
        assert.equal(result.events[0].event.name, 'Approval', 'tx should be successful');
        return tinlake.adminAppraise(loanID, appraisal);

      }).then((result: { txHash: any; status: any; }) => {
        console.log('appraisal results');
        console.log(result.txHash);
        assert.equal(result.status, SUCCESS_STATUS, 'tx should be successful');
        console.log('-------------------------------------');
        console.log('borrow');
        console.log('-------------------------------------');
        return tinlake.borrow(loanID, ethFrom);

      }).then((result: { txHash: any; status: any; }) => {
        console.log(result.txHash);
        assert.equal(result.status, SUCCESS_STATUS, 'tx should be successful');
        return tinlake.balanceOfCurrency(ethFrom);
      }).then((balance) => {
        console.log('DAI Balance after borrow');
        console.log(`${balance['0'].toString()} DAI`);
        console.log('-------------------------------------');
        console.log('repay');
        console.log('-------------------------------------');
        return tinlake.approveCurrency(addresses['PILE'], principal);
      }).then((result) => {
        console.log(result.txHash);
        assert.equal(result.events[0].event.name, 'Approval', 'tx should be successful');
        assert.equal(result.status, SUCCESS_STATUS, 'tx should be successful');
        return tinlake.repay(loanID, principal, ethFrom, ethFrom);

      }).then((result: { txHash: any; status: any; }) => {
        console.log(result.txHash);
        assert.equal(result.status, SUCCESS_STATUS, 'tx should be successful');
        return tinlake.balanceOfCurrency(ethFrom);

      }).then((balance) => {
        console.log('DAI Balance after Repay');
        console.log(`${balance['0'].toString()} DAI`);
        return Promise.resolve('success');
      });

    });
  });
});
