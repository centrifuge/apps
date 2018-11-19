import React from 'react';
import { shallow } from 'enzyme';

import SpacedContent from './SpacedContent';

describe('SpacedContent', () => {
  it('matches snapshot', () => {
    const bodyShallow = shallow(<SpacedContent />);
    expect(bodyShallow).toMatchSnapshot();
  });
});
