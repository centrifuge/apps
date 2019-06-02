const fs = require('fs');

const Eth = require('ethjs');
const eth = new Eth(new Eth.HttpProvider(process.env['ETH_RPC_URL']));

const me = process.env['ETH_FROM'];

const abiDir = process.env['CONTRACTS_ABI'];
function getContract(file, address) {
    let rawdata = fs.readFileSync(abiDir+file);
    return eth.contract(JSON.parse(rawdata)).at(address);
}

let registry_addr = process.env['NFT_COLLATERAL'];
let title_addr = process.env['TITLE'];
let contracts = {
    "nft": getContract('test/SimpleNFT.abi', registry_addr),
    "title": getContract('Title.abi', title_addr),
    "currency": getContract('test/SimpleToken.abi', process.env['CURRENCY']),
    "admit": getContract('Admit.abi', process.env['ADMIT']),
    "reception": getContract('Reception.abi', process.env['RECEPTION']),
    "desk": getContract('Desk.abi', process.env['DESK']),
    "shelf": getContract('Shelf.abi', process.env['SHELF']),
    "appraiser": getContract('Appraiser.abi', process.env['APPRAISER']),
}

filter_logs = (event) => {
    if (event.address != title_addr) {
        console.log(event);
    }
}

let nft_value = 150*10**18;
let principal = 100*10**18;

function admitNft(id_) {
    console.log(contracts.admit.admit);
    let p = new Promise((resolve) => {
        // the following is broken because ethjs does not support on('event', ...). Question to @SilentCicero oustanding
        contracts.admit.methods.admit(registry_addr, id_, principal, me).send({from: me, gas:10**6*1.7}).on('receipt', (receipt) => {
            console.log(receipt);
            resolve(receipt);
        });
    });
    return p;
}

async function run() {
    // Mint some money
    //await contracts.currency.mint(me, 100, {from: me});
    console.log("ME:", me);
    // Mint an NFTi
    let nft_id = Math.floor(Math.random()*(10**15));
    console.log("NFT ID:", nft_id);
    let nft_tx = await contracts.nft.mint(me, nft_id, {from: me});


    // Approve the NFT
    admitNft(nft_id);
    console.log("TX Hash:", res);
    res = await eth.getTransactionReceipt(res);
    console.log(contracts.admit.Created());
    //console.log(contracts.title.Created.processReceipt(res));
    //console.log("RES", res);
    res = await contracts.shelf.shelf(0);
    console.log("Loan", res);
    let supply = await contracts.currency.totalSupply();
}

run();
