import pool from '../data/pool.json'

describe('Invest flows', () => {
  before(() => {
    cy.renameMetamaskAccount('Pool Admin')
    cy.switchMetamaskAccount('Account 1')
    cy.renameMetamaskAccount('Investor')
  })
  it('Transfer DEVEL (fund investor)', () => {
    cy.visit('/portfolio', { failOnStatusCode: false })
    cy.connectWallet({ init: true })
    cy.switchMetamaskAccount('Investor')
    cy.get('a[href="/portfolio?send=DEVEL"]').click()
    cy.getMetamaskWalletAddress().then((address) => {
      cy.get('input[name="recipientAddress"]').type(address)
    })
    cy.switchMetamaskAccount('Pool Admin')
    cy.get('input[name="amount"]').type('1')
    cy.get('button[type="submit"').click()
    cy.confirmTransaction()
  })
  it('Transfer USDT (fund investor)', () => {
    cy.visit('/portfolio', { failOnStatusCode: false })
    cy.connectWallet()
    cy.switchMetamaskAccount('Investor')
    cy.visit('/portfolio?send=USDT')
    cy.getMetamaskWalletAddress().then((address) => {
      cy.get('input[name="recipientAddress"]').type(address)
    })
    cy.switchMetamaskAccount('Pool Admin')
    cy.get('input[name="amount"]').type('3')
    cy.get('button[type="submit"').click()
    cy.confirmTransaction()
  })
  it('Whitelist an investor wallet', () => {
    cy.switchMetamaskAccount('Pool Admin')
    cy.visit('/pools', { failOnStatusCode: false })
    cy.connectWallet()
    // issuer pool link
    cy.contains(pool.name).click()
    cy.contains('Investors').click()
    cy.switchMetamaskAccount('Investor')
    cy.getMetamaskWalletAddress().then((address) => {
      cy.switchMetamaskAccount('Pool Admin')
      cy.get('input[name="investorStatus"]').type(address)
    })
    cy.switchMetamaskAccount('Pool Admin')
    cy.contains('0x70fC4d9C87E9e9B0751A5680b1Dd654517f02309"]').should('not.be.true')
    cy.switchMetamaskAccount('Pool Admin')
    cy.get(`button[aria-label='Add ${pool.tranches[0].id} to memberlist']`).click()
    cy.confirmTransaction()
  })
  it('Invest in Junior tranche as investor', () => {
    cy.visit('/pools', { failOnStatusCode: false })
    // investor pool link
    cy.get('a[aria-label="Go to E2E Pool details"]').click()
    cy.connectWallet()
    cy.switchMetamaskAccount('Investor')
    cy.get(`button[aria-label="Invest in ${pool.tranches[0].id}"]`).click() // should be whitelisted
    cy.get('input[name="amount"]').type('1')
    cy.get('button[type="submit"').click()
    cy.confirmTransaction()
  })
  it('Close epoch', () => {
    cy.switchMetamaskAccount('Pool Admin')
    cy.visit('/pools', { failOnStatusCode: false })
    cy.connectWallet()
    cy.contains(pool.name).click()
    cy.contains('Liquidity').click()
    cy.contains('Start order execution').click()
    cy.confirmTransaction()
  })
  // TODO:
  // close epoch
  // test if value locked grew
  // redeem investment
  // close epoch
  // change flow so issuer is whitelisted and invested in junior
  //    and investor is whitelisted and invested in senior
})
