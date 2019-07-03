// tslint:disable-next-line:import-name
import Tinlake from 'tinlake';
// tslint:disable-next-line:import-name
import contractAddresses from './addresses_tinlake.json';

declare var web3: any;

let tinlake: Tinlake | null = null;

export async function getTinlake() {
  if (tinlake) { return tinlake; }

  const accounts = await web3.currentProvider.enable();
  const account = accounts[0];
  // console.log(`Using account ${account}`);

  tinlake = new Tinlake(web3.currentProvider, contractAddresses, {
    ethConfig: { from: account },
  });

  return tinlake;
}
