import * as React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { CollectionPage } from '../pages/Collection'
import { CollectionsPage } from '../pages/Collections'
import { NavBar } from './NavBar'
import { Web3Provider } from './Web3Provider'

export const Root: React.FC = () => {
  return (
    <>
      <ThemeProvider theme={{}}>
        <Web3Provider>
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
        </Web3Provider>
      </ThemeProvider>
    </>
  )
}
