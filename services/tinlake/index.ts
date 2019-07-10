import Tinlake from 'tinlake';
import contractAddresses from './addresses_tinlake.json';

declare var web3: any;

let tinlake: Tinlake | null = null;

export async function getTinlake() {
  if (tinlake) { return tinlake; }

  const provider = await web3Connect();

  const accounts = await provider.enable();
  const account = accounts[0];
  console.log(`Using account ${account}`);

  tinlake = new Tinlake(provider, contractAddresses, {
    ethConfig: { from: account },
  });

  return tinlake;
}

async function web3Connect(): Promise<any> {
  return new Promise((resolve, reject) => {
    // require here since we only want it to be loaded in browser, not on server side rendering
    const Web3Connect = require('web3connect').default;

    console.log({ Web3Connect });

    const web3Connect = new Web3Connect.Core({
      providerOptions: {
        portis: {
          id: '2ea2735d-4963-40f5-823f-48cab29f7319', // required
          // network: 'mainnet', // optional
          network: 'kovan', // optional
        },
        // fortmatic: {
        //   key: 'FORTMATIC_KEY', // required
        // },
      },
    });

    // subscibe to connect
    web3Connect.on('connect', (provider: any) => {
      resolve(provider);
    });

    // subscibe to close
    web3Connect.on('close', () => {
      reject('Web3Connect Modal Closed');
    });

    web3Connect.toggleModal(); // open modal on button click
  });
}
