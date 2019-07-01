"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line:variable-name
var Eth = require('ethjs');
// tslint:disable-next-line:variable-name
var Abi = require('web3-eth-abi');
var abiCoder = new Abi.AbiCoder();
var utils = require('web3-utils');
var defaultContractAddresses = require('./addresses_tinlake.json');
// tslint:disable:import-name
var contractAbiNft = require('./abi/test/SimpleNFT.abi');
var contractAbiTitle = require('./abi/Title.abi');
var contractAbiCurrency = require('./abi/test/SimpleToken.abi');
var contractAbiAdmitJson = require('./abi/Admit.abi.json');
var contractAbiAdmit = require('./abi/Admit.abi');
var contractAbiReception = require('./abi/Reception.abi');
var contractAbiDesk = require('./abi/Desk.abi');
var contractAbiShelf = require('./abi/Shelf.abi');
var contractAbiAppraiser = require('./abi/Appraiser.abi');
var contractAbiLender = require('./abi/MakerAdapter.abi');
var contractAbiPile = require('./abi/Pile.abi');
// tslint:enable:import-name
console.log({ contractAbiAdmit: contractAbiAdmit });
console.log({ contractAbiAdmitJson: contractAbiAdmitJson });
var Tinlake = /** @class */ (function () {
    function Tinlake(provider, _a) {
        var _this = this;
        var _b = _a === void 0 ? {} : _a, contractAbis = _b.contractAbis, contractAddresses = _b.contractAddresses, ethOptions = _b.ethOptions, ethConfig = _b.ethConfig;
        this.loanCount = function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.title.count()];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res[0]];
                }
            });
        }); };
        this.getLoan = function (loanId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.shelf.shelf(loanId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); };
        this.getBalanceDebt = function (loanId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contracts.pile.loans(loanId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); };
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
        this.contractAbis = contractAbis || {
            nft: contractAbiNft,
            title: contractAbiTitle,
            currency: contractAbiCurrency,
            admit: contractAbiAdmit,
            reception: contractAbiReception,
            desk: contractAbiDesk,
            shelf: contractAbiShelf,
            appraiser: contractAbiAppraiser,
            lender: contractAbiLender,
            pile: contractAbiPile,
        };
        this.contractAddresses = contractAddresses || defaultContractAddresses;
        this.provider = provider;
        this.ethOptions = ethOptions || {};
        this.ethConfig = ethConfig || {};
        this.eth = new Eth(this.provider, this.ethOptions);
        this.contracts = {
            nft: this.eth.contract(this.contractAbis.nft)
                .at(this.contractAddresses['NFT_COLLATERAL']),
            title: this.eth.contract(this.contractAbis.title)
                .at(this.contractAddresses['TITLE']),
            currency: this.eth.contract(this.contractAbis.currency)
                .at(this.contractAddresses['CURRENCY']),
            admit: this.eth.contract(this.contractAbis.admit)
                .at(this.contractAddresses['ADMIT']),
            reception: this.eth.contract(this.contractAbis.reception)
                .at(this.contractAddresses['RECEPTION']),
            desk: this.eth.contract(this.contractAbis.desk)
                .at(this.contractAddresses['DESK']),
            shelf: this.eth.contract(this.contractAbis.shelf)
                .at(this.contractAddresses['SHELF']),
            appraiser: this.eth.contract(this.contractAbis.appraiser)
                .at(this.contractAddresses['APPRAISER']),
            lender: this.eth.contract(this.contractAbis.lender)
                .at(this.contractAddresses['LENDER']),
            pile: this.eth.contract(this.contractAbis.pile)
                .at(this.contractAddresses['PILE']),
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
exports.default = Tinlake;
//# sourceMappingURL=Tinlake.js.map