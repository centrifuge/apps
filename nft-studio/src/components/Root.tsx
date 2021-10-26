import { GlobalStyle } from '@centrifuge/fabric'
// import altairDark from '@centrifuge/fabric/dist/theme/altairDark'
import centrifugeLight from '@centrifuge/fabric/dist/theme/centrifugeLight'
import * as React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { CollectionPage } from '../pages/Collection'
import { CollectionsPage } from '../pages/Collections'
import { NavBar } from './NavBar'
import { TransactionProvider } from './TransactionsProvider'
import { Web3Provider } from './Web3Provider'

export const Root: React.FC = () => {
  return (
    <>
      <ThemeProvider theme={centrifugeLight}>
        <GlobalStyle />
        <Web3Provider>
          <TransactionProvider>
            <Router>
              <NavBar />
              <Switch>
                <Route path="/collection/:id">
                  <CollectionPage />
                </Route>
                <Route path="/">
                  <CollectionsPage />
                </Route>
              </Switch>
            </Router>
          </TransactionProvider>
        </Web3Provider>
      </ThemeProvider>
    </>
  )
}
