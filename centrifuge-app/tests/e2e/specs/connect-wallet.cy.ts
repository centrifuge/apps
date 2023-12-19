describe('Synpress health check', () => {
  it('Connects a wallet', () => {
    cy.visit('/pools', { failOnStatusCode: false })
    const connectButton = cy.contains('Connect')
    connectButton.click()
    cy.get('button').contains('Centrifuge').click()
    cy.get('button').contains('MetaMask').click()
    cy.acceptMetamaskAccess()
    connectButton.should('not.exist')
  })
})
