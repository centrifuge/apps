// tslint:disable-next-line:import-name
import Eth from 'ethjs';
import { AbiCoder } from 'web3-eth-abi';
const abiCoder = new AbiCoder();
import { sha3 } from 'web3-utils';
// tslint:disable-next-line:import-name
import BN from 'bn.js';

// tslint:disable:import-name no-duplicate-imports
import contractAbiNft from './abi/test/SimpleNFT.abi.json';
import contractAbiTitle from './abi/Title.abi.json';
import contractAbiCurrency from './abi/test/SimpleToken.abi.json';
import contractAbiAdmit from './abi/Admit.abi.json';
import contractAbiReception from './abi/Reception.abi.json';
import contractAbiDesk from './abi/Desk.abi.json';
import contractAbiShelf from './abi/Shelf.abi.json';
import contractAbiAppraiser from './abi/Appraiser.abi.json';
import contractAbiLender from './abi/MakerAdapter.abi.json';
import contractAbiPile from './abi/Pile.abi.json';
// tslint:enable:import-name

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
  'pile': any;
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
  pile: any;
}

// tslint:disable-next-line:class-name
interface ethI {
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

class Tinlake {
  public provider: any;
  public eth: ethI;
  public ethOptions: any;
  public ethConfig: any;
  public contractAddresses: ContractAddresses;
  public contracts: Contracts;
  public contractAbis: ContractAbis;

  constructor(provider: any, contractAddresses: ContractAddresses,
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
      pile: contractAbiPile,
    };
    this.contractAddresses = contractAddresses;
    this.provider = provider;
    this.ethOptions = ethOptions || {};
    this.ethConfig = ethConfig || {};
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
      pile: this.eth.contract(this.contractAbis.pile)
        .at(this.contractAddresses['PILE']),
    };
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
    const secMax = 5;
    let sec = 0;
    const wait = (txHash: string) => {
      setTimeout(() => {
        eth.getTransactionByHash(txHash, (err: any, tx: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (tx.blockHash != null) {
            resolve(tx);
            return;
          }
          console.log(`waiting for tx :${txHash}`);
          sec = sec + 1;
          if (sec !== secMax) {
            wait(txHash);
          }

        });
      },         1000);

    };
    wait(txHash);
  });
};

const findEvent = (abi: { filter: (arg0: (item: any) => boolean | undefined) => any[]; },
                   funcSignature: any) => {
  return abi.filter((item: { type: string; name: string;
    inputs: { map: (arg0: (input: any) => any) => { join: (arg0: string) => string; }; }; }) => {
    if (item.type !== 'event') return false;
    const signature =
      `${item.name}(${item.inputs.map((input: { type: any; }) => input.type).join(',')})`;
    const hash = sha3(signature);
    if (hash === funcSignature) return true;
  });
};

const getEvents = (receipt: { logs:
                    { length: number; forEach: (arg0: (log: any) => void) => void; }; },
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

export default Tinlake;
