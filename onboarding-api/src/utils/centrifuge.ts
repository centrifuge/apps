import Centrifuge from '@centrifuge/centrifuge-js'

export const centrifuge = new Centrifuge({
  centrifugeWsUrl: 'wss://fullnode.development.cntrfg.com',
})
