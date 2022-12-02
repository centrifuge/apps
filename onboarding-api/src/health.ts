import { GcloudWrapper } from './gcloudWrapper'

const healthCheckFunction = new GcloudWrapper()
exports.health = healthCheckFunction.post((req, res) => {
  return res.send('Running')
})
