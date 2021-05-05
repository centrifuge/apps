import { mount } from 'enzyme';
import React from 'react';
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers';
import { Spinner } from '@centrifuge/axis-spinner';
import { Heading, Paragraph } from 'grommet';
import { Preloader } from '../Preloader';

describe('Preloader', () => {

  it('Should render the spinner fullscreen with the proper message', () => {
    const component = mount(
      withAllProvidersAndContexts(
        <Preloader message={'Loading message'}/>,
      ),
    );

    const spinner = component.find(Spinner);
    expect(spinner.prop('message')).toEqual('Loading message');
    expect(spinner.prop('width')).toEqual('100%');
    expect(spinner.prop('height')).toEqual('calc(100vh - 90px)');
  });

});
