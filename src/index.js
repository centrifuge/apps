module.exports = Tinlake;

const fs = require('fs');
const SignerProvider = require('ethjs-provider-signer');
const sign = require('ethjs-signer').sign;
const Eth = require('ethjs');

const Abi = require("web3-eth-abi");
const abiCoder = new Abi.AbiCoder();
const Web3 = require('web3'); // todo replace with sha3 lib
const web3 = new Web3(); // todo replace with sha3 lib

let eth;
let contracts;
let abiDir
let ethFrom;
let ethConfig;

function Tinlake(rpcUrl,mainAddress,privateKey, contractAbi, contractAddresses, options) {
    ethFrom = mainAddress;
    abiDir = contractAbi;

    let provider = new SignerProvider(rpcUrl, {
        signTransaction: (rawTx, cb) => cb(null, sign(rawTx, privateKey)),
        accounts: (cb) => cb(null, [ethFrom]),
    });

    eth = new Eth(provider,options);

    contracts = {
        "nft": getContract('test/SimpleNFT.abi', contractAddresses["NFT_COLLATERAL"]),
        "title": getContract('Title.abi', contractAddresses["TITLE"]),
        "currency": getContract('test/SimpleToken.abi',contractAddresses["CURRENCY"]) ,
        "admit": getContract('Admit.abi',contractAddresses["ADMIT"]),
        "reception": getContract('Reception.abi', contractAddresses["RECEPTION"]),
        "desk": getContract('Desk.abi',  contractAddresses["DESK"]),
        "shelf": getContract('Shelf.abi', contractAddresses["SHELF"]),
        "appraiser": getContract('Appraiser.abi', contractAddresses["APPRAISER"]),
    };


    let gasLimit = 1000000;
    ethConfig = {from: ethFrom,  gasLimit: "0x"+gasLimit.toString(16)};

}
Tinlake.prototype.approveNFT = () => console.log('not implemented yet');

Tinlake.prototype.mintNFT = (deposit, tokenID) => {
    return new Promise((resolve, reject)=> {
        contracts.nft.mint(deposit, tokenID, ethConfig).then(txHash => {
            console.log("[Mint] txHash: "+txHash);
            return waitForTransaction(txHash)
        }).then(tx => {
            eth.getTransactionReceipt(tx.hash, (err, receipt) => {
                if (err != null) {
                    reject("failed to get receipt")
                }
                let events = getEvents(receipt, contracts["nft"].abi);
                resolve({"txHash":tx.hash,"events":events});
            });

        })
    });

}

Tinlake.prototype.admit = (registry, nft, principal, usr) => {
    return new Promise((resolve, reject)=> {
        contracts.admit.admit(registry, nft, principal, usr, ethConfig).then(txHash => {
            console.log("[Admit] txHash: "+txHash);
            return waitForTransaction(txHash)
        }).then(tx => {
            eth.getTransactionReceipt(tx.hash, (err, receipt) => {
                if (err != null) {
                    reject("failed to get receipt")
                }
                let events = getEvents(receipt, contracts["nft"].abi);
                resolve({"txHash":tx.hash,"events":events});
            });

        })
    });
};

Tinlake.prototype.borrow = () => console.log('not implemented yet');

// todo replace with a better pooling
let waitForTransaction = (txHash) => {
    return  new Promise(function(resolve, reject) {
            let secMax = 5;
            let sec = 0;
            let wait = (txHash) => {
                setTimeout(()=> {
                    eth.getTransactionByHash(txHash, (err, tx) => {
                        if (tx.blockHash != null)  {
                            resolve(tx);
                            return;
                        }
                        console.log("waiting for tx :" + txHash)
                        sec++;
                        if (sec != secMax) {
                            wait(txHash);
                        }

                    });
                }, 1000);

            }
            wait(txHash);
    })
}

let findEvent = (abi, funcHash) => {
    return abi.filter((item) => {
        if (item.type !== "event") return false;
        let signature = item.name + "(" + item.inputs.map((input) => input.type).join(",") + ")";
        let hash = web3.utils.sha3(signature);
        if (hash === funcHash) return true;
    });

}
let getEvents = (receipt, abi) => {
    let log = receipt.logs[0];
    let events = [];

    let matches = findEvent(abi, log.topics[0]);
    if (matches.length === 1) {
        let event = matches[0];
        let inputs = event.inputs.map((input)=>input.type);

        // remove 0x prefix from topics
        let topics = log.topics.map((t) => t.replace("0x",""));

        // concat topics without first topic (function signature)
        let bytes = "0x"+topics.slice(1).join("");

        let data = abiCoder.decodeParameters(inputs, bytes);

        events.push({"event":event,"data":data})

    }
    return events;

}

let getContract = (file, address)  => {
    let rawdata = fs.readFileSync(abiDir+file);
    return eth.contract(JSON.parse(rawdata)).at(address);
}