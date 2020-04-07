const abiCoder = require('web3-eth-abi');
import { sha3 } from 'web3-utils';

export interface ethI {
  send: Function;
  web3_sha3: (signature: string) => string;
  getTransactionReceipt: (arg0: any, arg1: (err: any, receipt: any) => void) => void;
  getTransactionByHash: (arg0: any, arg1: (err: any, tx: any) => void) => void;
  contract: (arg0: any) => { at: (arg0: any) => void };
  sendRawTransaction: any;
  getTransactionCount: any;
  abi: any;
}

export interface Events {
  txHash: string;
  status: any;
  events: { event: { name: any }, data: any[] }[];
}

export async function executeAndRetry(f: Function, args: any = []) : Promise<any> {
  try {
    const result = await f(...args);
    return result;
  } catch (e) {
      // using error message, since error code -32603 is not unique enough
      // todo introduce retry limit
    if (e && e.message && (e.message.indexOf("Cannot read property 'number' of null") !== -1 ||
          e.message.indexOf('error with payload')  !== -1)) {
      console.log('internal RPC error detected, retry triggered...', e);
      throw (new Error('Internal RPC Error. Please try again.'));
        // await sleep(1000);
        // return executeAndRetry(f, args);
    } else {
      throw(e);
    }
  }
}

export const waitAndReturnEvents = async (eth: ethI, txHash: string, abi: any, transactionTimeout: number) => {
  const tx:any = await waitForTransaction(eth, txHash, transactionTimeout);
  return new Promise((resolve, reject) => {
    eth.getTransactionReceipt(tx.hash, (err: null, receipt: any) => {
      if (err != null) {
        reject('failed to get receipt');
      }
      const events = getEvents(receipt, abi);
      resolve({ events, txHash: tx.hash, status: receipt.status });
    });
  });
};

  // todo replace with a better polling
  // TODO : use polling interval from config
export const waitForTransaction = (eth: ethI, txHash: any, transactionTimeout: number) => {
  return new Promise((resolve, reject) => {
    const secMax = transactionTimeout;
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
            reject(new Error(`waiting for transaction tx ${txHash} timed out after ${secMax} seconds`));
          }
        });
      },         1000);
    };
    wait(txHash);
  });
};

export const findEvent = (abi: { filter: (arg0: (item: any) => boolean | undefined) => any[]; },
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
