/// <reference types="cypress" />
import '@synthetixio/synpress/support'
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//

Cypress.Commands.add('connectWallet', (config) => {
  const connectButton = cy.contains('Connect').click()
  cy.get('button').contains('Centrifuge').click()
  cy.get('button').contains('MetaMask').click()
  if (config?.init) {
    cy.acceptMetamaskAccess({ allAccounts: true })
  }
  connectButton.should('not.exist')
})

Cypress.Commands.add('confirmTransaction', () => {
  cy.confirmMetamaskTransaction({ gasConfig: 'market' })
  cy.contains('Transaction pending').should('exist')
  cy.contains('Transaction pending', { timeout: 100000 }).should('not.exist')
  cy.contains('Transaction failed').should('not.exist')
  cy.contains('Transaction successful').should('exist')
})

declare global {
  namespace Cypress {
    interface Chainable {
      connectWallet(config?: { init: true }): Chainable<void>
      confirmTransaction(): Chainable<void>
      //   login(email: string, password: string): Chainable<void>
      //   drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      //   dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      //   visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
    }
  }
}
