describe('E2E test health check', () => {
  it('Connects a wallet', () => {
    cy.visit('/pools', { failOnStatusCode: false })
    cy.connectWallet({ init: true })
  })
})
