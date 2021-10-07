import * as React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { CollectionPage } from '../pages/Collection'
import { CollectionsPage } from '../pages/Collections'
import { GlobalStyle } from './GlobalStyle'
import { NavBar } from './NavBar'
import { Web3Provider } from './Web3Provider'

export const Root: React.FC = () => {
  return (
    <>
      <GlobalStyle />
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
    </>
  )
}
