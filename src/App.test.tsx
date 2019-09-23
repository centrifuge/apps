import React from 'react';
import ReactDOM from 'react-dom';
import { MemoryRouter } from 'react-router';


import App from './App';


it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <MemoryRouter>
      <App loggedInUser={null}/>
    </MemoryRouter>,
    div,
  );
  ReactDOM.unmountComponentAtNode(div);
});
