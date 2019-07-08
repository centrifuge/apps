import { Injectable } from '@nestjs/common';
import { Transaction } from "web3/eth/types";
import config from "../../../src/common/config";

const Eth = require('ethjs');
const eth = new Eth(new Eth.HttpProvider(config.ethProvider));

@Injectable()
export class EthService {
  getTransactionByHash(hash: string): Promise<Transaction> {
    return eth.getTransactionByHash(hash)
  }
}