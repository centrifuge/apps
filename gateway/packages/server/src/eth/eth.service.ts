import { Injectable } from '@nestjs/common';
import config from 'src/config';
import { Transaction } from 'web3-eth/types';

const Eth = require('ethjs');
const eth = new Eth(new Eth.HttpProvider(config.ethProvider));

@Injectable()
export class EthService {
  getTransactionByHash(hash: string): Promise<Transaction> {
    return eth.getTransactionByHash(hash);
  }
}
