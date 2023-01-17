const { pinJson } = require('./pinata/api')

const ipfsHashToURI = (hash) => `ipfs://ipfs/${hash}`

const handler = async (req, res) => {
  try {
    const { json } = req.body
    if (!json) {
      return res.status(400).send('Bad request: json is required')
    }

    const pinJsonResponse = await pinJson(json)
    const jsonHash = pinJsonResponse.IpfsHash
    const jsonURL = ipfsHashToURI(jsonHash)

    return res.status(200).send(JSON.stringify({ uri: jsonURL }))
  } catch (e) {
    return res.status(500).send(e.message || 'Server error')
  }
}

module.exports = handler
