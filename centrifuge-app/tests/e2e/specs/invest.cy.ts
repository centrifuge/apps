import pool from '../data/pool.json'

describe('Invest flows', () => {
  before(() => {
    cy.renameMetamaskAccount('Pool Admin') // rename account to Pool Admin
    cy.switchMetamaskAccount('Account 1')
    cy.renameMetamaskAccount('Investor') // rename account to Investor
  })
  it('Pool Admin: Transfer DEVEL (fund investor)', () => {
    cy.visit('/portfolio', { failOnStatusCode: false })
    cy.connectWallet({ init: true }) // init true to accept metamask connection, only required in first test case
    cy.switchMetamaskAccount('Investor') // switch to investor account to grab address
    cy.get('a[href="/portfolio?send=DEVEL"]').click()
    cy.getMetamaskWalletAddress().then((address) => {
      cy.get('input[name="recipientAddress"]').type(address)
    })
    cy.switchMetamaskAccount('Pool Admin')
    cy.get('input[name="amount"]').type('1')
    cy.get('input[name=isDisclaimerAgreed]').check()
    cy.get('button[type="submit"]').click()
    cy.confirmTransaction()
  })
  it('Pool Admin: Transfer USDT (fund investor)', () => {
    cy.visit('/portfolio', { failOnStatusCode: false })
    cy.connectWallet()
    cy.switchMetamaskAccount('Investor') // switch to investor account to grab address
    cy.visit(`/portfolio?send=${pool.poolCurrency}`, { failOnStatusCode: false })
    cy.getMetamaskWalletAddress().then((address) => {
      cy.get('input[name="recipientAddress"]').type(address)
    })
    cy.switchMetamaskAccount('Pool Admin')
    cy.get('input[name="amount"]').type(pool.investAmount)
    cy.get('button[type="submit"]').click()
    cy.confirmTransaction()
  })
  it('Pool Admin: Whitelist an investor wallet', () => {
    cy.switchMetamaskAccount('Pool Admin')
    cy.visit('/pools', { failOnStatusCode: false })
    cy.connectWallet()
    cy.contains(pool.name).click() // issuer pool link
    cy.contains('Investors').click()
    cy.switchMetamaskAccount('Investor') // switch to investor account to grab address
    cy.getMetamaskWalletAddress().then((address) => {
      cy.switchMetamaskAccount('Pool Admin')
      cy.get('input[name="investorStatus"]').type(address)
    })
    cy.switchMetamaskAccount('Pool Admin') // switch back to pool admin account
    cy.contains(pool.poolAdmin).should('not.be.true')
    cy.switchMetamaskAccount('Pool Admin')
    cy.get(`button[aria-label='Add ${pool.tranches[0].id} to memberlist']`).click()
    cy.confirmTransaction()
  })
  it('Investor: Invest in Junior tranche', () => {
    cy.visit('/pools', { failOnStatusCode: false })
    cy.connectWallet()
    cy.switchMetamaskAccount('Investor')
    cy.get(`a[aria-label="Go to ${pool.name} details"]`).click() // investor pool link
    cy.get(`button[aria-label="Invest in ${pool.tranches[0].id}"]`).click() // should be whitelisted
    cy.get('input[name="amount"]').type(pool.investAmount)
    cy.get('button[type="submit"]').click()
    cy.confirmTransaction()
    cy.contains(`Invested ${pool.poolCurrency} value ${pool.investAmount} ${pool.poolCurrency}`).should('exist')
  })
  it('Pool Admin: Close epoch (execute investment)', () => {
    cy.visit('/pools', { failOnStatusCode: false })
    cy.switchMetamaskAccount('Pool Admin')
    cy.connectWallet()
    cy.contains(pool.name).click()
    cy.contains('Liquidity').click()
    cy.get('div[data-testId="data-table-row-0-0"]').children().should('have.length', pool.tranches.length) // redemptions table row
    cy.get('div[data-testId="data-table-col-0-0-Order"]')
      .contains(`${pool.tranches[0].symbol} investments`)
      .should('exist')
    cy.get('div[data-testId="data-table-col-0-0-Locked"]')
      .contains(`${pool.investAmount} ${pool.poolCurrency}`)
      .should('exist')
    cy.contains('Start order execution', { timeout: 60000 }).should('not.be.disabled').click()
    cy.confirmTransaction()
    cy.get('div[data-testId="data-table-col-0-0-Locked"]').contains(`0 ${pool.poolCurrency}`).should('exist')
  })
  it('Investor: Claim tranche tokens', () => {
    cy.visit('/pools', { failOnStatusCode: false })
    cy.switchMetamaskAccount('Investor')
    cy.connectWallet()
    cy.get(`a[aria-label="Go to ${pool.name} details"]`).click() // investor pool link
    cy.get(`button[aria-label="Invest in ${pool.tranches[0].id}"]`).click()
    cy.get(`button[aria-label="Claim ${pool.investAmount}.0 ${pool.tranches[0].symbol}"]`).click()
  })
  it('Investor: Redeem investment', () => {
    cy.visit('/pools', { failOnStatusCode: false })
    cy.switchMetamaskAccount('Investor')
    cy.connectWallet()
    cy.get(`a[aria-label="Go to ${pool.name} details"]`).click() // investor pool link
    cy.get(`button[aria-label="Invest in ${pool.tranches[0].id}"]`).click()
    cy.get('button[aria-label="Go to redeem tab"]').click()
    cy.get(`button[aria-label="Claim ${pool.investAmount}.0 ${pool.tranches[0].symbol}"]`).click()
    cy.confirmTransaction()
    cy.get('button[aria-label="Set max amount"]').click()
    cy.get('button[type="submit"]').click()
    cy.confirmTransaction()
    cy.contains(`${pool.poolCurrency} value ~${pool.investAmount} ${pool.poolCurrency}`).should('exist')
  })
  it('Pool Admin: Close epoch (execute redemption)', () => {
    cy.visit('/pools', { failOnStatusCode: false })
    cy.switchMetamaskAccount('Pool Admin')
    cy.connectWallet()
    cy.contains(pool.name).click()
    cy.contains('Liquidity').click()
    cy.get('div[data-testId="data-table-row-0-1"]').children().should('have.length', pool.tranches.length) // redemptions table row
    cy.get('div[data-testId="data-table-col-0-1-Order"]')
      .contains(`${pool.tranches[0].symbol} redemptions`)
      .should('exist')
    cy.get('div[data-testId="data-table-col-0-1-Locked"]')
      .contains(`${pool.investAmount} ${pool.poolCurrency}`)
      .should('exist')
    cy.contains('Start order execution', { timeout: 60000 }).should('not.be.disabled').click() // make sure min epoch time has passed
    cy.confirmTransaction()
    cy.get('div[data-testId="data-table-col-0-0-Locked"]').contains(`0 ${pool.poolCurrency}`).should('exist')
  })
  it('Investor: Claim tokens', () => {
    cy.visit(`/pools/${pool.poolId}`, { failOnStatusCode: false })
    cy.switchMetamaskAccount('Investor')
    cy.connectWallet()
    cy.get(`button[aria-label="Invest in ${pool.tranches[0].id}"]`).click()
    cy.get('button[aria-label="Go to redeem tab"]').click()
    cy.get(`button[aria-label="Claim ${pool.investAmount}.0 ${pool.poolCurrency}"]`).click()
    cy.confirmTransaction()
  })
})
