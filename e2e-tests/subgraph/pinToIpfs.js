const ipfsClient = require('ipfs-http-client')
const metadata = require('./pools-metadata.json')

const ipfs = ipfsClient('ipfs');

console.log(metadata)

const asyncBlock = async () => {
    try {
        const cid = await ipfs.add(JSON.stringify(metadata), { pin: true })
        console.log(cid)
        process.exit(0)   
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}

asyncBlock();