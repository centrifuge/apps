import { ethers } from 'ethers';
import * as WebSocket from 'ws';

const DEFAULT_CONFIG = {
    transactionTimeout: 5 * 60 * 1000,
    gasnowWebsocketUrl: 'wss://www.gasnow.org/ws/gasprice',
    initialSpeed: 'standard',
    increasedSpeed: 'fast',
    minGasPriceIncrease: 10000000000,
    maxGasPriceAge: 10 * 60 * 1000,
    filterDuplicates: true,
    fallback: {
        stepSize: 0.2,
        maxIncreases: 3,
    },
};
class TransactionManager extends ethers.Signer {
    constructor(signer, config) {
        super();
        this.latestGasPrices = undefined;
        this.transactions = {};
        this.queue = [];
        ethers.utils.defineReadOnly(this, 'signer', signer);
        this.config = Object.assign(Object.assign({}, DEFAULT_CONFIG), config);
        const gasnowWs = new WebSocket(this.config.gasnowWebsocketUrl);
        gasnowWs.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type) {
                this.latestGasPrices = data.data;
            }
        };
    }
    async sendTransaction(transaction, increases) {
        return new Promise(async (resolve, reject) => {
            const key = `${transaction.to}-${transaction.data}`;
            if (this.config.filterDuplicates && !increases && this.transactions[key]) {
                throw new Error(`Transaction ${key} already sent`);
            }
            this.transactions[key] = { request: transaction, resolve, reject };
            this.queue.push(key);
            if (this.queue.length === 1) {
                console.log(`Processing ${key} immediately`);
                this.process(key);
            }
            else {
                console.log(`Adding ${key} to the queue`);
            }
        });
    }
    async process(key, increases = 0) {
        if (!(key in this.transactions)) {
            throw new Error(`${key} is not found in the transaction list`);
        }
        const request = this.transactions[key].response
            ? Object.assign(Object.assign({}, this.transactions[key].request), { nonce: this.transactions[key].response.nonce }) : this.transactions[key].request;
        const initialGasPrice = await this.provider.getGasPrice();
        const gasPrice = this.latestGasPrices && this.latestGasPrices.timestamp - Date.now() < this.config.maxGasPriceAge
            ? increases === 0
                ? this.latestGasPrices[this.config.initialSpeed]
                : this.latestGasPrices[this.config.increasedSpeed]
            : initialGasPrice.add(initialGasPrice
                .div(1 / this.config.fallback.stepSize)
                .mul(Math.min(increases + 1, this.config.fallback.maxIncreases)));
        if (ethers.BigNumber.from(gasPrice).lt(ethers.BigNumber.from(request.gasPrice).add(ethers.BigNumber.from(this.config.minGasPriceIncrease)))) {
            this.watch(key, increases || 0);
            return;
        }
        const txWithGasPrice = Object.assign(Object.assign({}, request), { gasPrice });
        if (increases > 0)
            console.log(`Resubmitting ${this.transactions[key].response.hash} with gas price of ${gasPrice}`);
        const response = await super.sendTransaction(Object.assign(Object.assign({}, txWithGasPrice), { gasPrice }));
        this.transactions[key] = Object.assign(Object.assign({}, this.transactions[key]), { response });
        if (increases === 0 && this.transactions[key].resolve)
            await this.transactions[key].resolve(response);
        this.watch(key, increases || 0);
    }
    async watch(key, increases) {
        var _a, _b, _c, _d;
        if (!this.provider) {
            throw new Error('Provider for TransactionManager is not initialised');
        }
        if (!((_b = (_a = this.transactions[key]) === null || _a === void 0 ? void 0 : _a.response) === null || _b === void 0 ? void 0 : _b.hash)) {
            throw new Error(`Transaction response missing for ${key}`);
        }
        try {
            console.log(`Watching ${(_c = this.transactions[key].response) === null || _c === void 0 ? void 0 : _c.hash}`);
            await this.provider.waitForTransaction((_d = this.transactions[key].response) === null || _d === void 0 ? void 0 : _d.hash, undefined, this.config.transactionTimeout);
            this.queue = this.queue.slice(1);
            this.transactions[key] = undefined;
            console.log(`Completed ${key}`);
            if (this.queue.length > 0) {
                console.log(`Moving on to ${key}`);
                this.process(this.queue[0]);
            }
        }
        catch (e) {
            console.error(`Error caught while waiting for transaction: ${e}`);
            if (e.toString().includes('timeout exceeded')) {
                this.process(key, increases + 1);
            }
        }
    }
    get provider() {
        return this.signer.provider;
    }
    connect(provider) {
        return new TransactionManager(this.signer.connect(provider));
    }
    getAddress() {
        return this.signer.getAddress();
    }
    signMessage(message) {
        return this.signer.signMessage(message);
    }
    signTransaction(transaction) {
        return this.signer.signTransaction(transaction);
    }
}

export default TransactionManager;
