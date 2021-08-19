import React from 'react'
import ReactDOM from 'react-dom'
import { Router } from 'react-router'
import App from './App'
import { Auth } from './auth/Auth'
import { history } from './history'
import HttpClient from './http-client'
import * as serviceWorker from './serviceWorker'

const runApplication = () => {
  ReactDOM.render(
    <Router history={history}>
      <Auth>
        <HttpClient>
          <App />
        </HttpClient>
      </Auth>
    </Router>,
    document.getElementById('root')
  )
}

runApplication()

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister()
