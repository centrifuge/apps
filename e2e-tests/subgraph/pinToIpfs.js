const ipfsClient = require('ipfs-http-client')
const metadata = require('./pools-metadata')

const ipfs = ipfsClient('ipfs');

const asyncBlock = async () => {
    try {
        const cid = await ipfs.add(JSON.stringify(metadata))
        console.log(cid)
        process.exit(0)   
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}

asyncBlock();