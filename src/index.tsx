import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';

import 'normalize.css';
import config from './common/config';
import { Route, Router } from 'react-router';
import { createBrowserHistory } from 'history';

const customHistory = createBrowserHistory();

const runApplication = (preloadedState) => {
  ;
  ReactDOM.render(
    <Router history={customHistory}>
      <Route render={() => {
        return <App loggedInUser={preloadedState.user!.auth!.loggedInUser}/>;
      }}/>
    </Router>,
    document.getElementById('root'),
  );
};


// in dev mode we do not have the prerendering of redux so need to login the user
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
    body: JSON.stringify(config.admin),
  })
    .then(res => res.json())
    .then(response => {

      window['__ETH_NETWORK__'] = config.ethNetwork;
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
