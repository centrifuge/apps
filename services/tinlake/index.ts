import Tinlake from 'tinlake';
import config from '../../config';
import Eth from 'ethjs';
import { ContractAddresses } from 'tinlake/dist/Tinlake';

let tinlake: any | null = null;
let authing = false;
let authed = false;
let currentAddresses: null | ContractAddresses = null;
let currentContractConfig: null | any = null;

export async function getTinlake({ addresses, contractConfig }: {addresses?: ContractAddresses | null, contractConfig?: any | null} = {}) {
  console.log(`services/tinlake getTinlake({ addresses: ${JSON.stringify(addresses)}, contractConfig: ${JSON.stringify(contractConfig)}})`);

  if (tinlake === null) {
    const { transactionTimeout, rpcUrl } = config;

    const chosenProvider = sessionStorage && sessionStorage.getItem('chosenProvider');

    if (chosenProvider === 'injected') {
      authing = true;

      const Web3Connect = require('web3connect').default;
      const injectedProvider = await Web3Connect.ConnectToInjected();
      const accounts = await injectedProvider.enable();
      const account = accounts[0];

      tinlake = new Tinlake({ transactionTimeout, provider: injectedProvider });
      tinlake!.setEthConfig({ from: account, gasLimit: `0x${config.gasLimit.toString(16)}` });
      authed = true;
      authing = false;
    } else {
      const httpProvider = new Eth.HttpProvider(rpcUrl);
      tinlake = new Tinlake({ transactionTimeout, provider: httpProvider });
    }
  }

  let resetContractAddresses = false;
  if (!deepEqual(addresses || null, currentAddresses)) {
    currentAddresses = addresses || null;
    tinlake.contractAddresses = currentAddresses || {};
    resetContractAddresses = true;
  }

  if (!deepEqual(contractConfig || null, currentContractConfig)) {
    currentContractConfig = contractConfig || null;
    tinlake.contractConfig = currentContractConfig || {};
    resetContractAddresses = true;
  }

  if (resetContractAddresses && tinlake.contractAddresses && tinlake.contractConfig) {
    tinlake.setContracts();
    await tinlake.setContractAddresses();
  }

  return tinlake;
}

export async function authTinlake() {
  console.log('services/tinlake authTinlake');

  if (!tinlake) { await getTinlake(); }
  if (authing || authed) { return; }

  authing = true;

  try {
    const provider = await web3ConnectToLast();
    const accounts = await provider.enable();
    const account = accounts[0];
    tinlake!.setProvider(provider);
    tinlake!.setEthConfig({ from: account });
    authed = true;
    authing = false;
  } catch (e) {
    console.error(`Tinlake Auth failed ${e}`);
    authing = false;
  }
}

async function web3Connect(): Promise<any> {
  return new Promise((resolve, reject) => {
    // require here since we only want it to be loaded in browser, not on server side rendering
    const Web3Connect = require('web3connect').default;
    const web3Connect = new Web3Connect.Core({
      providerOptions: {}
    });
    // subscibe to connect
    web3Connect.on('connect', (provider: any) => {
      const info = Web3Connect.getProviderInfo(provider);
      sessionStorage.setItem('chosenProvider', info.type === 'injected' ? 'injected' : info.name);
      resolve(provider);
    });

    // subscibe to close
    web3Connect.on('close', () => {
      reject('Web3Connect Modal Closed');
    });
    // open modal
    web3Connect.toggleModal();
  });
}

async function web3ConnectToLast(): Promise<any> {
  const chosenProvider = sessionStorage.getItem('chosenProvider');

  if (!chosenProvider) { return web3Connect(); }

  // require here since we only want it to be loaded in browser, not on server side rendering
  const Web3Connect = require('web3connect').default;

  switch (chosenProvider) {
    case 'injected':
      return Web3Connect.ConnectToInjected();
    default:
      return web3Connect();
  }
}

function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
