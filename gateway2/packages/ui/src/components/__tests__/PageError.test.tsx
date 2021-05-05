import { mount } from 'enzyme';
import React from 'react';
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers';
import { PageError } from '../PageError';
import { Heading, Paragraph } from 'grommet';

describe('Page Error', () => {

  it('should display a Error error and message when receiving a normal error', () => {
    const component = mount(
      withAllProvidersAndContexts(
        <PageError error={new Error('Some random error')}/>,
      ),
    );
    expect(component.find(Heading).text()).toEqual('Error');
    expect(component.find(Paragraph).text()).toEqual('Some random error');
  });

  it('should display nice errors for AxiosErrors when the response is a json with a message key', () => {
    const error: any = {
      isAxiosError: true,
      response: {
        status: 404,
        data: {
          message: 'Some Axios Error',
        },
      },

    };
    const component = mount(
      withAllProvidersAndContexts(
        <PageError error={error}/>,
      ),
    );

    expect(component.find(Heading).text()).toEqual('404');
    expect(component.find(Paragraph).text()).toEqual('Some Axios Error');
  });


  it('should display nice errors for AxiosErrors when the response does return a json with a message key', () => {
    const error: any = {
      isAxiosError: true,
      response: {
        status: 500,
        statusText: 'Some random status test error',
      },

    };
    const component = mount(
      withAllProvidersAndContexts(
        <PageError error={error}/>,
      ),
    );

    expect(component.find(Heading).text()).toEqual('500');
    expect(component.find(Paragraph).text()).toEqual('Some random status test error');
  });

  it('should display handle bad format for an Axios error', () => {
    const error: any = {
      isAxiosError: true,
      response: {
      },

    };
    const component = mount(
      withAllProvidersAndContexts(
        <PageError error={error}/>,
      ),
    );

    expect(component.find(Heading).text()).toEqual('Error');
    expect(component.find(Paragraph).text()).toEqual('Something is terribly wrong');
  });
});
