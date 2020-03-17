const web3 = require('web3-utils');

export function isValidAddress(rawInput: string) {
    try {
        const address = web3.toChecksumAddress(rawInput)
    } catch(e) { 
        console.error('invalid ethereum address', e.message) 
        return false;
    }
    return true;
}