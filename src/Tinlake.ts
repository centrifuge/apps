import Eth from 'ethjs';
import { AbiCoder } from 'web3-eth-abi';
const abiCoder = new AbiCoder();
import BN from 'bn.js';
import { sha3 } from 'web3-utils';

import contractAbiNft from './abi/test/SimpleNFT.abi.json';
import contractAbiTitle from './abi/Title.abi.json';
import contractAbiCurrency from './abi/test/SimpleToken.abi.json';
import contractAbiAdmit from './abi/Admit.abi.json';
import contractAbiReception from './abi/Reception.abi.json';
import contractAbiDesk from './abi/Desk.abi.json';
import contractAbiShelf from './abi/Shelf.abi.json';
import contractAbiAppraiser from './abi/Appraiser.abi.json';
import contractAbiLender from './abi/MakerAdapter.abi.json';
import contractAbiCollateral from './abi/Collateral.abi.json';
import contractAbiPile from './abi/Pile.abi.json';
import contractAbiAdmin from './abi/Admin.abi.json';
// the following are just different orders of the methods in the ABI file. Reason is that ethjs
// does not expose overloaded methods under different keys,
// but instead just uses the last method, e. g. `file`. The following ABIs put the needed `file`
// method last.
import contractAbiPileForAdd from './abi/PileForAdd.json';
import contractAbiPileForInit from './abi/PileForInit.abi.json';

interface ContractAbis {
  'nft': any;
  'title': any;
  'currency': any;
  'admit': any;
  'reception': any;
  'desk': any;
  'shelf': any;
  'appraiser': any;
  'lender': any;
  'collateral': any;
  'pile': any;
  'pileForAdd': any;
  'pileForInit': any;
  'admin': any;
  'nftData': any;
}

interface ContractAddresses {
  'APPRAISER': string;
  'TITLE': string;
  'LIGHTSWITCH': string;
  'PILE': string;
  'SHELF': string;
  'COLLATERAL': string;
  'DESK': string;
  'RECEPTION': string;
  'LENDER': string;
  'CVTJOIN': string;
  'CVTPIP': string;
  'NFT_COLLATERAL': string;
  'DEPLOYER': string;
  'ADMIT': string;
  'SPELL': string;
  'CURRENCY': string;
  'ADMIN': string;
}

interface Options {
  contractAbis?: ContractAbis;
  ethOptions?: any;
  ethConfig?: any;
}

interface Contracts {
  nft: any;
  title: any;
  currency: any;
  admit: any;
  reception: any;
  desk: any;
  shelf: any;
  appraiser: any;
  lender: any;
  collateral: any;
  pile: any;
  pileForAdd: any;
  pileForInit: any;
  admin: any;
  nftData: any;
}

interface ethI {
  web3_sha3: (signature: string) => string;
  getTransactionReceipt: (arg0: any, arg1: (err: any, receipt: any) => void) => void;
  getTransactionByHash: (arg0: any, arg1: (err: any, tx: any) => void) => void;
  contract: (arg0: any) => { at: (arg0: any) => void };
}

interface Events {
  txHash: string;
  status: any;
  events: { event: { name: any }, data: any[] }[];
}

interface Balance {
  [x: string]: { toString: () => string; };
}

export type Address = string;

export interface Loan {
  registry: Address;
  tokenId: BN;
  price: BN;
  principal: BN;
}

export interface BalanceDebt {
  debt: BN;
  balance: BN;
  fee: BN;
  chi: BN;
}

export interface AbiOutput {
  name: string;
  type: 'uint265' | 'address';
}

export const LOAN_ID_IDX = 2;

export class Tinlake {
  public provider: any;
  public eth: ethI;
  public ethOptions: any;
  public ethConfig: any;
  public contractAddresses: ContractAddresses;
  public contracts: Contracts;
  public contractAbis: ContractAbis;

  constructor(provider: any, contractAddresses: ContractAddresses, nftDataOutputs: AbiOutput[],
              { contractAbis, ethOptions, ethConfig }: Options = {}) {
    this.contractAbis = contractAbis || {
      nft: contractAbiNft,
      title: contractAbiTitle,
      currency: contractAbiCurrency,
      admit: contractAbiAdmit,
      reception: contractAbiReception,
      desk: contractAbiDesk,
      shelf: contractAbiShelf,
      appraiser: contractAbiAppraiser,
      lender: contractAbiLender,
      collateral: contractAbiCollateral,
      pile: contractAbiPile,
      pileForAdd: contractAbiPileForAdd,
      pileForInit: contractAbiPileForInit,
      admin: contractAbiAdmin,
      nftData: [{
        constant: true,
        inputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        name: 'data',
        outputs: nftDataOutputs,
        payable: false,
        stateMutability: 'view',
        type: 'function',
      }],
    };
    this.contractAddresses = contractAddresses;

    this.setProvider(provider, ethOptions);
    this.setEthConfig(ethConfig || {});
  }

  setProvider = (provider: any, ethOptions?: any) => {
    this.provider = provider;
    this.ethOptions = ethOptions || {};

    this.eth = new Eth(this.provider, this.ethOptions) as ethI;

    this.contracts = {
      nft: this.eth.contract(this.contractAbis.nft)
        .at(this.contractAddresses['NFT_COLLATERAL']),
      title: this.eth.contract(this.contractAbis.title)
        .at(this.contractAddresses['TITLE']),
      currency: this.eth.contract(this.contractAbis.currency)
        .at(this.contractAddresses['CURRENCY']),
      admit: this.eth.contract(this.contractAbis.admit)
        .at(this.contractAddresses['ADMIT']),
      reception: this.eth.contract(this.contractAbis.reception)
        .at(this.contractAddresses['RECEPTION']),
      desk: this.eth.contract(this.contractAbis.desk)
        .at(this.contractAddresses['DESK']),
      shelf: this.eth.contract(this.contractAbis.shelf)
        .at(this.contractAddresses['SHELF']),
      appraiser: this.eth.contract(this.contractAbis.appraiser)
        .at(this.contractAddresses['APPRAISER']),
      lender: this.eth.contract(this.contractAbis.lender)
        .at(this.contractAddresses['LENDER']),
      collateral: this.eth.contract(this.contractAbis.collateral)
        .at(this.contractAddresses['COLLATERAL']),
      pile: this.eth.contract(this.contractAbis.pile)
        .at(this.contractAddresses['PILE']),
      pileForAdd: this.eth.contract(this.contractAbis.pileForAdd)
        .at(this.contractAddresses['PILE']),
      pileForInit: this.eth.contract(this.contractAbis.pileForInit)
        .at(this.contractAddresses['PILE']),
      admin: this.eth.contract(this.contractAbis.admin)
        .at(this.contractAddresses['ADMIN']),
      nftData: this.eth.contract(this.contractAbis.nftData)
        .at(this.contractAddresses['NFT_COLLATERAL']),
    };
  }

  setEthConfig = (ethConfig: { [key: string]: any }) => {
    this.ethConfig = ethConfig;
  }

  isAdmin = async (address: Address): Promise<boolean> => {
    const res = await this.contracts.admin.wards(address);
    return !(res[0] as BN).isZero();
  }

  loanCount = async (): Promise<BN> => {
    const res = await this.contracts.title.count();
    return res[0];
  }

  getLoan = async (loanId: string): Promise<Loan> => {
    return await this.contracts.shelf.shelf(loanId);
  }

  getBalanceDebt = async (loanId: string): Promise<BalanceDebt> => {
    return await this.contracts.pile.loans(loanId);
  }

  approveNFT = (tokenId: string, to: string): Promise<Events> => {
    return this.contracts.nft.approve(to, tokenId, this.ethConfig).then((txHash: string) => {
      console.log(`[NFT Approve] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['nft'].abi);
    });
  }

  ownerOfNFT = async (tokenId: Address): Promise<Address> => {
    const res = await this.contracts.nft.ownerOf(tokenId);
    return res['0'];
  }

  ownerOfLoan = async (loanId: Address): Promise<Address> => {
    const res = await this.contracts.title.ownerOf(loanId);
    return res['0'];
  }

  balanceOfCurrency = (usr: string): Promise<Balance> => {
    return this.contracts.currency.balanceOf(usr);
  }

  /**
   * @param owner Owner of the new NFT
   */
  mintNFT = (owner: string, tokenId: string): Promise<Events> => {
    return this.contracts.nft.mint(owner, tokenId, this.ethConfig).then((txHash: string) => {
      console.log(`[NFT.mint] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['nft'].abi);
    });
  }

  /**
   * @param owner Owner of the created loan
   */
  adminAdmit = (registry: string, nft: string, principal: string, owner: string):
    Promise<Events> => {
    return this.contracts.admit.admit(registry, nft, principal, owner, this.ethConfig)
      .then((txHash: string) => {
        console.log(`[Admit.admit] txHash: ${txHash}`);
        return waitAndReturnEvents(this.eth, txHash, this.contracts['nft'].abi);
      });
  }

  adminAppraise = (loanID: string, appraisal: string): Promise<Events> => {
    return this.contracts.appraiser.file(loanID, appraisal, this.ethConfig)
      .then((txHash: string) => {
        console.log(`[Appraisal.file] txHash: ${txHash}`);
        return waitAndReturnEvents(this.eth, txHash, this.contracts['nft'].abi);
      });
  }

  getAppraisal = async (loanID: string): Promise<BN> => {
    const res = await this.contracts.appraiser.value(loanID);
    return res['0'];
  }

  /**
   * @param to Address that should receive the currency (e. g. DAI)
   */
  borrow = (loanId: string, to: string): Promise<Events> => {
    return this.contracts.reception.borrow(loanId, to, this.ethConfig).then((txHash: string) => {
      console.log(`[Reception.borrow] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['reception'].abi);
    });
  }

  /**
   * @param from Address that pays back the currency (e. g. DAI)
   * @param to Address that receives the NFT
   */
  repay = (loanId: string, wad: string, from: string, to: string): Promise<Events> => {
    return this.contracts.reception.repay(loanId, wad, from, to, this.ethConfig)
      .then((txHash: string) => {
        console.log(`[Reception.repay] txHash: ${txHash}`);
        return waitAndReturnEvents(this.eth, txHash, this.contracts['reception'].abi);
      });
  }

  approveCurrency = (usr: string, wad: string): Promise<Events> => {
    return this.contracts.currency.approve(usr, wad, this.ethConfig).then((txHash: string) => {
      console.log(`[Currency.approve] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['currency'].abi);
    });
  }

  lenderRely = (usr: string): Promise<Events> => {
    return this.contracts.lender.rely(usr, this.ethConfig).then((txHash: string) => {
      console.log(`[Lender.rely] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['lender'].abi);
    });
  }

  initFee = (fee: string): Promise<Events> => {
    return this.contracts.pileForInit.file(fee, fee, this.ethConfig)
      .then((txHash: string) => {
        console.log(`[Pile.file] txHash: ${txHash}`);
        return waitAndReturnEvents(this.eth, txHash, this.contracts.pileForInit.abi);
      });
  }

  existsFee = async (fee: string): Promise<boolean> => {
    const res: { speed: BN } = await this.contracts.pile.fees(fee);
    return !res.speed.isZero();
  }

  addFee = (loanId: string, fee: string, balance: string): Promise<Events> => {
    return this.contracts.pileForAdd.file(loanId, fee, balance, this.ethConfig)
      .then((txHash: string) => {
        console.log(`[Pile.file] txHash: ${txHash}`);
        return waitAndReturnEvents(this.eth, txHash, this.contracts.pileForAdd.abi);
      });
  }

  getCurrentDebt = async (loanId: string): Promise<BN> => {
    const res = await this.contracts.pile.burden(loanId);
    return res['0'];
  }

  /**
   * whitelist is a shortcut contract that calls adminAdmit (admit.admit),
   * adminAppraise (appraiser.file) and addFee (pile.file) to prevent additional
   * transactions. It is required though that the fee is already initialized
   * using initFee
   * @param owner Owner of the created loan
   */
  whitelist = (registry: Address, nft: string, principal: string, appraisal: string,
               fee: string, owner: string) => {
    return this.contracts.admin.whitelist(registry, nft, principal, appraisal, fee, owner,
                                          this.ethConfig)
      .then((txHash: string) => {
        console.log(`[Admin.whitelist] txHash: ${txHash}`);
        return waitAndReturnEvents(this.eth, txHash, this.contracts['nft'].abi);
      });
  }

  unwhitelist = (loanId: string, registry: string, nft: string):
    Promise<Events> => {
    return this.contracts.shelf.file(loanId, registry, nft, '0', this.ethConfig)
      .then((txHash: string) => {
        console.log(`[Shelf.file] txHash: ${txHash}`);
        return waitAndReturnEvents(this.eth, txHash, this.contracts['shelf'].abi);
      });
  }

  getTotalDebt = async (): Promise<BN> => {
    const res: { 0: BN } = await this.contracts.pile.Debt();
    return res['0'];
  }

  getTotalBalance = async (): Promise<BN> => {
    const res: { 0: BN } = await this.contracts.pile.Balance();
    return res['0'];
  }

  getTotalValueOfNFTs = async (): Promise<BN> => {
    const res: { 0: BN } = await this.contracts.collateral.totalSupply();
    return res['0'];
  }

  getNFTData: <T>(tokenId: string) => Promise<T> = async (tokenId) => {
    const res = await this.contracts.nftData.data(tokenId);
    return res;
  }
}

const waitAndReturnEvents = (eth: ethI, txHash: string, abi: any) => {
  return new Promise((resolve, reject) => {
    waitForTransaction(eth, txHash).then((tx: any) => {
      eth.getTransactionReceipt(tx.hash, (err: null, receipt: any) => {
        if (err != null) {
          reject('failed to get receipt');
        }
        const events = getEvents(receipt, abi);
        resolve({ events, txHash: tx.hash, status: receipt.status });
      });

    });
  });
};

// todo replace with a better polling
const waitForTransaction = (eth: ethI, txHash: any) => {
  return new Promise((resolve, reject) => {
    const secMax = 60;
    let sec = 0;
    const wait = (txHash: string) => {
      setTimeout(() => {
        eth.getTransactionByHash(txHash, (err: any, tx: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (tx && tx.blockHash != null) {
            resolve(tx);
            return;
          }
          console.log(`waiting for tx :${txHash}`);
          sec = sec + 1;
          if (sec < secMax) {
            wait(txHash);
          } else {
            reject(`waiting for transaction tx ${tx} timed out after ${secMax} seconds`);
          }
        });
      },         1000);

    };
    wait(txHash);
  });
};

const findEvent = (abi: { filter: (arg0: (item: any) => boolean | undefined) => any[]; },
                   funcSignature: any) => {
  return abi.filter((item: {
    type: string; name: string;
    inputs: { map: (arg0: (input: any) => any) => { join: (arg0: string) => string; }; };
  }) => {
    if (item.type !== 'event') return false;
    const signature =
      `${item.name}(${item.inputs.map((input: { type: any; }) => input.type).join(',')})`;
    const hash = sha3(signature);
    if (hash === funcSignature) return true;
  });
};

const getEvents = (receipt: {
  logs:
  { length: number; forEach: (arg0: (log: any) => void) => void; };
},
                   abi: any) => {
  if (receipt.logs.length === 0) {
    return null;
  }
  const events: { 'event': any; 'data': any; }[] = [];
  receipt.logs.forEach((log: { topics: any[]; }) => {
    const funcSignature = log.topics[0];
    const matches = findEvent(abi, funcSignature);
    if (matches.length === 1) {
      const event = matches[0];
      const inputs = event.inputs.filter((input: { indexed: any; }) => input.indexed)
        .map((input: { type: any; }) => input.type);

      // remove 0x prefix from topics
      const topics = log.topics.map((t: { replace: (arg0: string, arg1: string) => void; }) =>
        t.replace('0x', ''));

      // concat topics without first topic (func signature)
      const bytes = `0x${topics.slice(1).join('')}`;

      const data = abiCoder.decodeParameters(inputs, bytes);

      events.push({ event, data });

    }
  });
  return events;
};

export * from './utils/baseToDisplay';
export * from './utils/bnToHex';
export * from './utils/displayToBase';
export * from './utils/feeToInterestRate';
export * from './utils/getLoanStatus';
export * from './utils/interestRateToFee';
