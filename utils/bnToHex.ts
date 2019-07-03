// tslint:disable-next-line:import-name
import BN from 'bn.js';

export const bnToHex = (bn: BN) => `0x${bn.toString(16)}`;
