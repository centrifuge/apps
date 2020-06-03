import { CentrifugeWorld } from './world'
import Tinlake, { ITinlake } from 'tinlake'
import { config } from './config';
const SignerProvider = require('ethjs-provider-signer');
const sign = require('ethjs-signer').sign;

export async function ensureTinlakeInit(world: CentrifugeWorld): Promise<ITinlake> {
  if (world.tinlake) {
    return world.tinlake
  }

  world.tinlake = new Tinlake({
    transactionTimeout: 3600,
    contractAddresses: config.tinlakePool.addresses,
    provider: createSignerProvider(config.rpcUrl, config.ethAdminPrivateKey, config.ethAdminAddress),
    contractConfig: config.tinlakePool.contractConfig,
    ethConfig: { from: config.ethAdminAddress, gasLimit: `0x${config.gasLimit.toString(16)}` },
  }) as any;

  await world.tinlake.setContractAddresses();

  return world.tinlake;
}

function createSignerProvider(rpcUrl: string, privateKey: string, address: string) {
  return new SignerProvider(rpcUrl, {
    signTransaction: (rawTx: any, cb: (arg0: null, arg1: any) => void) =>
          cb(null, sign(rawTx, privateKey)),
    accounts: (cb: (arg0: null, arg1: string[]) => void) => cb(null, [address]),
  });
}
