"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var defaultContractAddresses_1 = require("./defaultContractAddresses");
// tslint:disable-next-line:variable-name
var Eth = require('ethjs');
// tslint:disable-next-line:variable-name
var Abi = require('web3-eth-abi');
var abiCoder = new Abi.AbiCoder();
var utils = require('web3-utils');
var Tinlake = /** @class */ (function () {
    function Tinlake(provider, _a) {
        var _this = this;
        var _b = _a === void 0 ? {} : _a, contractAbiPath = _b.contractAbiPath, contractAddresses = _b.contractAddresses, ethOptions = _b.ethOptions, ethConfig = _b.ethConfig;
        this.approveNFT = function (tokenID, to) {
            return _this.contracts.nft.approve(to, tokenID, _this.ethConfig).then(function (txHash) {
                console.log("[NFT Approve] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['nft'].abi);
            });
        };
        this.ownerOfNFT = function (tokenID) {
            return _this.contracts.nft.ownerOf(tokenID);
        };
        this.balanceOfCurrency = function (usr) {
            return _this.contracts.currency.balanceOf(usr);
        };
        this.mintNFT = function (deposit, tokenID) {
            return _this.contracts.nft.mint(deposit, tokenID, _this.ethConfig).then(function (txHash) {
                console.log("[NFT.mint] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['nft'].abi);
            });
        };
        this.adminAdmit = function (registry, nft, principal, usr) {
            return _this.contracts.admit.admit(registry, nft, principal, usr, _this.ethConfig)
                .then(function (txHash) {
                console.log("[Admit.admit] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['nft'].abi);
            });
        };
        this.adminAppraise = function (loanID, appraisal) {
            return _this.contracts.appraiser.file(loanID, appraisal, _this.ethConfig)
                .then(function (txHash) {
                console.log("[Appraisal.file] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['nft'].abi);
            });
        };
        this.borrow = function (loanID, to) {
            return _this.contracts.reception.borrow(loanID, to, _this.ethConfig).then(function (txHash) {
                console.log("[Reception.borrow] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['reception'].abi);
            });
        };
        this.repay = function (loan, wad, usrT, usr) {
            return _this.contracts.reception.repay(loan, wad, usrT, usr, _this.ethConfig)
                .then(function (txHash) {
                console.log("[Reception.repay] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['reception'].abi);
            });
        };
        this.approveCurrency = function (usr, wad) {
            return _this.contracts.currency.approve(usr, wad, _this.ethConfig).then(function (txHash) {
                console.log("[Currency.approve] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['currency'].abi);
            });
        };
        this.lenderRely = function (usr) {
            return _this.contracts.lender.rely(usr, _this.ethConfig).then(function (txHash) {
                console.log("[Lender.rely] txHash: " + txHash);
                return waitAndReturnEvents(_this.eth, txHash, _this.contracts['lender'].abi);
            });
        };
        this.contractAbiPath = contractAbiPath || './abi';
        this.contractAddresses = contractAddresses || defaultContractAddresses_1.default;
        this.provider = provider;
        this.ethOptions = ethOptions || {};
        this.ethConfig = ethConfig;
        this.eth = new Eth(this.provider, this.ethOptions);
        this.contracts = {
            nft: getContract(this.eth, this.contractAbiPath, 'test/SimpleNFT.abi', this.contractAddresses['NFT_COLLATERAL']),
            title: getContract(this.eth, this.contractAbiPath, 'Title.abi', this.contractAddresses['TITLE']),
            currency: getContract(this.eth, this.contractAbiPath, 'test/SimpleToken.abi', this.contractAddresses['CURRENCY']),
            admit: getContract(this.eth, this.contractAbiPath, 'Admit.abi', this.contractAddresses['ADMIT']),
            reception: getContract(this.eth, this.contractAbiPath, 'Reception.abi', this.contractAddresses['RECEPTION']),
            desk: getContract(this.eth, this.contractAbiPath, 'Desk.abi', this.contractAddresses['DESK']),
            shelf: getContract(this.eth, this.contractAbiPath, 'Shelf.abi', this.contractAddresses['SHELF']),
            appraiser: getContract(this.eth, this.contractAbiPath, 'Appraiser.abi', this.contractAddresses['APPRAISER']),
            lender: getContract(this.eth, this.contractAbiPath, 'MakerAdapter.abi', this.contractAddresses['LENDER']),
        };
    }
    return Tinlake;
}());
var waitAndReturnEvents = function (eth, txHash, abi) {
    return new Promise(function (resolve, reject) {
        waitForTransaction(eth, txHash).then(function (tx) {
            eth.getTransactionReceipt(tx.hash, function (err, receipt) {
                if (err != null) {
                    reject('failed to get receipt');
                }
                var events = getEvents(receipt, abi);
                resolve({ events: events, txHash: tx.hash, status: receipt.status });
            });
        });
    });
};
// todo replace with a better polling
var waitForTransaction = function (eth, txHash) {
    return new Promise(function (resolve, reject) {
        var secMax = 5;
        var sec = 0;
        var wait = function (txHash) {
            setTimeout(function () {
                eth.getTransactionByHash(txHash, function (err, tx) {
                    if (tx.blockHash != null) {
                        resolve(tx);
                        return;
                    }
                    console.log("waiting for tx :" + txHash);
                    sec = sec + 1;
                    if (sec !== secMax) {
                        wait(txHash);
                    }
                });
            }, 1000);
        };
        wait(txHash);
    });
};
var findEvent = function (abi, funcSignature) {
    return abi.filter(function (item) {
        if (item.type !== 'event')
            return false;
        var signature = item.name + "(" + item.inputs.map(function (input) { return input.type; }).join(',') + ")";
        var hash = utils.sha3(signature);
        if (hash === funcSignature)
            return true;
    });
};
var getEvents = function (receipt, abi) {
    if (receipt.logs.length === 0) {
        return null;
    }
    var events = [];
    receipt.logs.forEach(function (log) {
        var funcSignature = log.topics[0];
        var matches = findEvent(abi, funcSignature);
        if (matches.length === 1) {
            var event = matches[0];
            var inputs = event.inputs.filter(function (input) { return input.indexed; })
                .map(function (input) { return input.type; });
            // remove 0x prefix from topics
            var topics = log.topics.map(function (t) {
                return t.replace('0x', '');
            });
            // concat topics without first topic (func signature)
            var bytes = "0x" + topics.slice(1).join('');
            var data = abiCoder.decodeParameters(inputs, bytes);
            events.push({ event: event, data: data });
        }
    });
    return events;
};
var getContract = function (eth, path, file, address) {
    var json = require(path + "/" + file + ".ts");
    // console.log(file, json)
    return eth.contract(json.default).at(address);
};
exports.default = Tinlake;
//# sourceMappingURL=Tinlake.js.map