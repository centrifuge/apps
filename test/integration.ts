// tslint:disable-next-line:variable-name
const SignerProvider = require('ethjs-provider-signer');
const { sign } = require('ethjs-signer');
import assert from 'assert';
const rpcUrl = process.env['ETH_RPC_URL'];
// tslint:disable-next-line:import-name
import BN from 'bn.js';
// tslint:disable-next-line:import-name
import contractAddresses from './addresses_tinlake.json';

import Tinlake from '../dist/Tinlake';

const SUCCESS_STATUS = '0x1';

let adminTinlake: Tinlake;
let borrowerTinlake: Tinlake;
const adminEthFrom = `0x${process.env['ETH_FROM']}`;
const borrowerEthFrom = `0x${process.env['BORROWER_ETH_FROM']}`;
const tokenID = `0x${Math.floor(Math.random() * (10 ** 15))}`;
let loanID: string;

const gasLimit = 1000000;

describe('functional tinlake tests', () => {
  before(() => {
    adminTinlake = new Tinlake(
      new SignerProvider(rpcUrl, {
        signTransaction: (rawTx: any, cb: (arg0: null, arg1: any) => void) =>
          cb(null, sign(rawTx, process.env.ETH_PRIVATE_KEY)),
        accounts: (cb: (arg0: null, arg1: string[]) => void) => cb(null, [adminEthFrom]),
      }),
      contractAddresses,
      {
        ethConfig: { from: adminEthFrom, gasLimit: `0x${gasLimit.toString(16)}` },
      },
    );
    borrowerTinlake = new Tinlake(
      new SignerProvider(rpcUrl, {
        signTransaction: (rawTx: any, cb: (arg0: null, arg1: any) => void) =>
          cb(null, sign(rawTx, process.env.BORROWER_ETH_PRIVATE_KEY)),
        accounts: (cb: (arg0: null, arg1: string[]) => void) => cb(null, [borrowerEthFrom]),
      }),
      contractAddresses,
      {
        ethConfig: { from: borrowerEthFrom, gasLimit: `0x${gasLimit.toString(16)}` },
      },
    );
  });

  describe('tinlake borrow and repay', function () {
    this.timeout(50000);
    const principal = '100';
    const appraisal = '300';
    it('borrow and repay successful', () => {
      console.log(`appraisal: ${appraisal}`);
      console.log(`principal: ${principal}`);
      console.log(`token id: ${tokenID}`);
      return borrowerTinlake.mintNFT(borrowerEthFrom, tokenID).then((result) => {
        console.log('mint result');
        console.log(result.txHash);
        assert.equal(result.status, SUCCESS_STATUS, 'tx should be successful');
        assert.equal(result.events[0].event.name, 'Transfer', 'tx should be successful');
        console.log('-------------------------------------');
        console.log('admin whitelist NFT');
        console.log('-------------------------------------');

        return adminTinlake.adminAdmit(contractAddresses['NFT_COLLATERAL'], tokenID, principal,
                                       borrowerEthFrom);
      }).then((result) => {
        console.log('admit result');
        console.log(result.txHash);

        // parse loanID from event
        loanID = result.events[0].data[2].toString();
        console.log(`Loan id: ${loanID}`);

        assert.equal(result.status, SUCCESS_STATUS, 'tx should be successful');
        assert.equal(result.events[0].event.name, 'Transfer', 'tx should be successful');

        return adminTinlake.adminAppraise(loanID, appraisal);
      }).then((result: { txHash: any; status: any; }) => {
        console.log('appraisal results');
        console.log(result.txHash);
        assert.equal(result.status, SUCCESS_STATUS, 'tx should be successful');

        console.log('-------------------------------------');
        console.log('borrow');
        console.log('-------------------------------------');

        return borrowerTinlake.approveNFT(tokenID, contractAddresses['SHELF']);
      },      (err: any) => {
        console.log(err);
        throw err;
      }).then((result) => {
        console.log('approve results');
        console.log(result.txHash);
        assert.equal(result.status, SUCCESS_STATUS, 'tx should be successful');
        assert.equal(result.events[0].event.name, 'Approval', 'tx should be successful');

        return borrowerTinlake.borrow(loanID, borrowerEthFrom);
      }).then((result: { txHash: any; status: any; }) => {
        console.log(result.txHash);
        assert.equal(result.status, SUCCESS_STATUS, 'tx should be successful');
        return borrowerTinlake.balanceOfCurrency(borrowerEthFrom);
      }).then((balance) => {
        console.log('DAI Balance after borrow');
        console.log(`${balance['0'].toString()} DAI`);
        console.log('-------------------------------------');
        console.log('repay');
        console.log('-------------------------------------');
        return borrowerTinlake.approveCurrency(contractAddresses['PILE'], principal);
      }).then((result) => {
        console.log(result.txHash);
        assert.equal(result.events[0].event.name, 'Approval', 'tx should be successful');
        assert.equal(result.status, SUCCESS_STATUS, 'tx should be successful');
        return borrowerTinlake.repay(loanID, principal, borrowerEthFrom, borrowerEthFrom);

      }).then((result: { txHash: any; status: any; }) => {
        console.log(result.txHash);
        assert.equal(result.status, SUCCESS_STATUS, 'tx should be successful');
        return borrowerTinlake.balanceOfCurrency(borrowerEthFrom);

      }).then((balance) => {
        console.log('DAI Balance after Repay');
        console.log(`${balance['0'].toString()} DAI`);
        return Promise.resolve('success');
      });

    });
  });

  describe('tinlake call functionality', function () {
    this.timeout(50000);

    it('count number of loans', async () => {
      const count = await adminTinlake.loanCount();
      console.log(`Found ${count} loans `);
      assert(count.gte(new BN(0)));
    });

    it('get a loan', async () => {
      const res = await adminTinlake.getLoan(loanID);
      assert(BN.isBN(res.price));
      assert(BN.isBN(res.principal));
      assert(typeof res.registry === 'string');
      assert(BN.isBN(res.tokenId));
    });

    it('get balance and debt from pile for a loan', async () => {
      const res = await adminTinlake.getBalanceDebt(loanID);
      assert(BN.isBN(res.balance));
      assert(BN.isBN(res.debt));
    });

    it('gets the owner of a loan', async () => {
      const res = await adminTinlake.ownerOfLoan(loanID);
      assert.equal(typeof res, 'string');
    });

    it('gets the owner of an nft', async () => {
      const res = await adminTinlake.ownerOfNFT(tokenID);
      assert.equal(typeof res, 'string');
    });
  });
});
