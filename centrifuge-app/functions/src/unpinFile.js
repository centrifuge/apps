import { unpinFile } from './pinata/api'

const handler = async (req, res) => {
  try {
    const { hash } = req.body
    if (req.method !== 'DELETE' || !hash) {
      return res.status(400).send('Bad request: hash is required')
    }
    await unpinFile(hash)
    return res.status(201)
  } catch (e) {
    console.log(e)
    return res.status(500).send(e.message || 'Server error')
  }
}

module.exports = handler
