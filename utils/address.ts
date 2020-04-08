const web3 = require('web3-utils');

export function isValidAddress(rawInput: string) {
    try {
        const address = web3.toChecksumAddress(rawInput);
    } catch(e) { 
        return false;
    }
    return true;
}
