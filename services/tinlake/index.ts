import Tinlake from 'tinlake';
import { ContractAddresses } from 'tinlake/dist/Tinlake';
import Eth from 'ethjs';

import config from '../../config';
import { networkNameToId } from '../../utils/networkNameResolver';

let tinlake: any | null = null;
let onboard: any | null = null;
let authing = false;
let authed = false;
let currentAddresses: null | ContractAddresses = null;
let currentContractConfig: null | any = null;

const wallets = [
  { walletName: 'metamask', preferred: true },
  {
    walletName: 'portis',
    apiKey: config.portisApiKey,
    label: 'Login with Portis',
    preferred: true
  },
  {
    walletName: 'ledger',
    rpcUrl: config.rpcUrl,
    preferred: true
  }
];

function loadOnboard() {
  const Onboard = require('bnc-onboard').default;
  onboard = Onboard({
    networkId: networkNameToId(config.network),
    walletSelect: { wallets },
    walletCheck: [
      { checkName: 'derivationPath' },
      { checkName: 'connect' },
      { checkName: 'accounts' },
      { checkName: 'network' }
    ],
    hideBranding: true
  });
}

function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function getProvider(cachedWallet: any | null = null) {
  if (!onboard) { loadOnboard(); }

  // already authed
  let state = await onboard.getState();
  if (state.wallet.provider) { return state.wallet.provider; }

  // authing now
  let walletSelectStatus: boolean = false;
  if (cachedWallet) { walletSelectStatus = await onboard.walletSelect(cachedWallet); }
  else { walletSelectStatus = await onboard.walletSelect(); }

  if (!walletSelectStatus) { throw new Error('Wallet not selected by user.'); }
  if (!(await onboard.walletCheck())) {
    onboard.walletReset();
    throw new Error('Wallet not checked by user.');
  }

  // caching wallet name and wallet type
  state = await onboard.getState();
  sessionStorage.setItem('cachedWallet', state.wallet.name);

  return state.wallet.provider;
}

export async function getTinlake({ addresses, contractConfig }: { addresses?: ContractAddresses | null; contractConfig?: any | null } = {}) {
  console.log(`services/tinlake getTinlake({ addresses: ${JSON.stringify(addresses)}, contractConfig: ${JSON.stringify(contractConfig)}})`);

  if (tinlake === null) {
    const { transactionTimeout, rpcUrl } = config;

    // is wallet type stored?
    const cachedWallet = sessionStorage && sessionStorage.getItem('cachedWallet');
    let authFailed: boolean = false;

    // try to auth if there is a cached wallet
    if (cachedWallet) {
      try {
        authing = true;

        const provider = await getProvider(cachedWallet);
        const accounts = await provider.enable();
        const account = accounts[0];

        tinlake = new Tinlake({ transactionTimeout, provider });
        tinlake!.setEthConfig({ from: account, gasLimit: `0x${config.gasLimit.toString(16)}` });
        authed = true;
        authing = false;
      } catch (e) {
        authing = false;
        authFailed = true;
      }
    }

    // if there is no cached wallet or auth failed
    if (!cachedWallet || authFailed) {
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
  }

  return tinlake;
}

export async function authTinlake() {
  console.log('services/tinlake authTinlake');

  if (!tinlake) { await getTinlake(); }
  if (authing || authed) { return; }

  authing = true;

  try {
    const provider = await getProvider();
    const accounts = await provider.enable();
    const account = accounts[0];
    tinlake!.setProvider(provider);
    tinlake!.setEthConfig({ from: account });
    authed = true;
    authing = false;
  } catch (e) {
    console.log(`Tinlake Auth failed ${e}`);
    authing = false;
  }
}
