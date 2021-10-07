import * as React from 'react'
import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom'
import { CollectionPage } from '../pages/Collection'
import { CollectionsPage } from '../pages/Collections'
import { GlobalStyle } from './GlobalStyle'

export const Root: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <Router>
        <div>
          <nav>
            <Link to="/">Home</Link> <Link to="/collection/1">Collection 1</Link>
          </nav>
          <Switch>
            <Route path="/collection/:id">
              <CollectionPage />
            </Route>
            <Route path="/">
              <CollectionsPage />
            </Route>
          </Switch>
        </div>
      </Router>
    </>
  )
}
