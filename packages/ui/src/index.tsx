import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { Route, Router } from 'react-router';
import { createBrowserHistory } from 'history';

const customHistory = createBrowserHistory();

const runApplication = (preloadedState) => {
  ReactDOM.render(
    <Router history={customHistory}>
      <Route render={() => {
        return <App loggedInUser={preloadedState.user!.auth!.loggedInUser}/>;
      }}/>
    </Router>,
    document.getElementById('root'),
  );
};

// in dev mode we do not have the prerendering so we autologin a user
// and set the __ETH_NETWORK__ to kovan
if (process.env.NODE_ENV === 'development') {
  // AUTO login the admin user
  fetch('/api/users/login', {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    redirect: 'follow',
    referrer: 'no-referrer',
    body: JSON.stringify({
      email: 'gateway@centrifuge.io',
      password: 'admin',
    }),
  })
    .then(res => res.json())
    .then(response => {
      window['__ETH_NETWORK__'] = 'kovan';
      window['__PRELOADED_STATE__'] = {
        user: response,
      };

      const defaultStore = {
        user: {
          auth: {
            loggedInUser: response,
          },
        },
      };
      runApplication(defaultStore);
    });


} else {
  //@ts-ignore
  runApplication(window.__PRELOADED_STATE__ || {});
}


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
