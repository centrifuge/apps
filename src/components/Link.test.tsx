import React from 'react';
import { shallow } from 'enzyme';

import Link from './Link';

describe('Link', () => {
  describe('default', () => {
    it('matches snapshot', () => {
      const bodyShallow = shallow(<Link label="link-label" to="route" />);
      expect(bodyShallow).toMatchSnapshot();
    });
  });

  describe('with size', () => {
    it('matches snapshot', () => {
      const bodyShallow = shallow(
        <Link label="link-label" to="route" size="small" />,
      );
      expect(bodyShallow).toMatchSnapshot();
    });
  });
});
