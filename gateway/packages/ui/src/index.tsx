import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { Route, Router } from 'react-router';
import { createBrowserHistory } from 'history';

const customHistory = createBrowserHistory();

const runApplication = () => {
  ReactDOM.render(
    <Router history={customHistory}>
      <Route
        render={() => {
          return <App />;
        }}
      />
    </Router>,
    document.getElementById('root'),
  );
};

runApplication();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
