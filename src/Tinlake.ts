import defaultContractAddresses from './defaultContractAddresses';
// tslint:disable-next-line:variable-name
const Eth = require('ethjs');
// tslint:disable-next-line:variable-name
const Abi = require('web3-eth-abi');
const abiCoder = new Abi.AbiCoder();
const utils = require('web3-utils');

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
  contractAbiPath?: string;
  contractAddresses?: ContractAddresses;
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

class Tinlake {
  private contractAbiPath: string;
  private contractAddresses: ContractAddresses;
  private provider: any;
  private ethOptions: any;
  private ethConfig: any;
  private eth: ethI;
  private contracts: Contracts;

  constructor(
    provider: any, { contractAbiPath, contractAddresses, ethOptions, ethConfig }: Options = {}) {
    this.contractAbiPath = contractAbiPath || './abi';
    this.contractAddresses = contractAddresses || defaultContractAddresses;
    this.provider = provider;
    this.ethOptions = ethOptions || {};
    this.ethConfig = ethConfig;
    this.eth = new Eth(this.provider, this.ethOptions) as ethI;

    this.contracts = {
      nft: getContract(this.eth, this.contractAbiPath,
                       'test/SimpleNFT.abi', this.contractAddresses['NFT_COLLATERAL']),
      title: getContract(this.eth, this.contractAbiPath,
                         'Title.abi', this.contractAddresses['TITLE']),
      currency: getContract(this.eth, this.contractAbiPath,
                            'test/SimpleToken.abi', this.contractAddresses['CURRENCY']),
      admit: getContract(this.eth, this.contractAbiPath,
                         'Admit.abi', this.contractAddresses['ADMIT']),
      reception: getContract(this.eth, this.contractAbiPath,
                             'Reception.abi', this.contractAddresses['RECEPTION']),
      desk: getContract(this.eth, this.contractAbiPath,
                        'Desk.abi', this.contractAddresses['DESK']),
      shelf: getContract(this.eth, this.contractAbiPath,
                         'Shelf.abi', this.contractAddresses['SHELF']),
      appraiser: getContract(this.eth, this.contractAbiPath,
                             'Appraiser.abi', this.contractAddresses['APPRAISER']),
      lender: getContract(this.eth, this.contractAbiPath,
                          'MakerAdapter.abi', this.contractAddresses['LENDER']),
    };
  }

  approveNFT = (tokenID: string, to: string): Promise<Events> => {
    return this.contracts.nft.approve(to, tokenID, this.ethConfig).then((txHash: string) => {
      console.log(`[NFT Approve] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['nft'].abi);
    });
  }

  ownerOfNFT = (tokenID: string): Promise<Events> => {
    return this.contracts.nft.ownerOf(tokenID);
  }

  balanceOfCurrency = (usr: string): Promise<Balance> => {
    return this.contracts.currency.balanceOf(usr);
  }

  mintNFT = (deposit: string, tokenID: string): Promise<Events> => {
    return this.contracts.nft.mint(deposit, tokenID, this.ethConfig).then((txHash: string) => {
      console.log(`[NFT.mint] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['nft'].abi);
    });
  }

  adminAdmit = (registry: string, nft: string, principal: number, usr: string): Promise<Events> => {
    return this.contracts.admit.admit(registry, nft, principal, usr, this.ethConfig)
      .then((txHash: string) => {
        console.log(`[Admit.admit] txHash: ${txHash}`);
        return waitAndReturnEvents(this.eth, txHash, this.contracts['nft'].abi);
      });
  }

  adminAppraise = (loanID: string, appraisal: number): Promise<Events> => {
    return this.contracts.appraiser.file(loanID, appraisal, this.ethConfig)
      .then((txHash: string) => {
        console.log(`[Appraisal.file] txHash: ${txHash}`);
        return waitAndReturnEvents(this.eth, txHash, this.contracts['nft'].abi);
      });
  }

  borrow = (loanID: string, to: string): Promise<Events> => {
    return this.contracts.reception.borrow(loanID, to, this.ethConfig).then((txHash: string) => {
      console.log(`[Reception.borrow] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['reception'].abi);
    });
  }

  repay = (loan: string, wad: number, usrT: string, usr: string): Promise<Events> => {
    return this.contracts.reception.repay(loan, wad, usrT, usr, this.ethConfig)
      .then((txHash: string) => {
        console.log(`[Reception.repay] txHash: ${txHash}`);
        return waitAndReturnEvents(this.eth, txHash, this.contracts['reception'].abi);
      });
  }

  approveCurrency = (usr: string, wad: number): Promise<Events> => {
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
    const hash = utils.sha3(signature);
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

const getContract = (eth: ethI, path: string, file: string, address: string) => {
  const json = require(`${path}/${file}.ts`);

  // console.log(file, json)

  return eth.contract(json.default).at(address);
};

export default Tinlake;
