import Centrifuge from '.'

describe('Centrifuge client', () => {
  it('can be constructed', async () => {
    const cent = new Centrifuge()
    expect(typeof cent.nfts.getCollections).toBe('function')
  })
})
