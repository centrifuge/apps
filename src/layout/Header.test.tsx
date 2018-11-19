import React from 'react';
import { shallow } from 'enzyme';

import Header from './Header';

describe('Header', () => {
  it('matches snapshot', () => {
    const bodyShallow = shallow(<Header />);
    expect(bodyShallow).toMatchSnapshot();
  });
});
