import React from 'react';
import { shallow } from 'enzyme';

import Body from './Body';

describe('Body', () => {
  it('matches snapshot', () => {
    const bodyShallow = shallow(<Body />);
    expect(bodyShallow).toMatchSnapshot();
  });
});
