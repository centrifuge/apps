const ipfsClient = require('ipfs-http-client');
const metadata = require('./pools-metadata.json');

const ipfs = ipfsClient('ipfs');

console.log(metadata);

// there are two file formats for ipfs data:
// one for a root list of all pools and one for each pool
// the subgraph expects the data per-pool, but tinlake-ui expects the root list
const poolsRoot = {};
poolsRoot[metadata.addresses.ROOT_CONTRACT] = metadata;

const asyncBlock = async () => {
    try {
        const cid = await ipfs.add(JSON.stringify(metadata), { pin: true });
        console.log('pool', cid);
        const cid_root = await ipfs.add(JSON.stringify(poolsRoot), { pin: true });
        console.log('pool_root', cid_root);
        process.exit(0);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

asyncBlock();