import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import {AxisTheme} from '@centrifuge/axis-theme';
import { NotificationConsumer, NotificationProvider, NOTIFICATION } from './NotificationContext';
import { shallow, mount } from 'enzyme';
import {Modal} from '@centrifuge/axis-modal'
import toJson from 'enzyme-to-json';


const serializeSnapshot = (component) => {
  // We are not interested in the theme prop and we remove it in order to reduce file size
  return toJson(
    component,
    {
      noKey:false,
      map: (node => {
        delete node.props.theme;
        return node;
      }),
    },
  );
};

const setProviders = (component) => {
  return  <AxisTheme>
    <NotificationProvider>
      {component}
    </NotificationProvider>
  </AxisTheme>
}

describe('NotificationContext', () => {

  it('Should not crash', () => {
    const tree = shallow(
      setProviders(
        <NotificationConsumer>
          {({ notify }) => {
            return <p>Test render</p>;
          }}
        </NotificationConsumer>
      )
    );
    expect(serializeSnapshot(tree)).toMatchSnapshot();
  });


  it('Should render a default popup', () => {

    const tree = mount(
      setProviders(
        <NotificationConsumer>
          {({ notify }) => {
            return <button onClick={()=> {
              notify(
                'Title',
                'Message',
              );
            }}></button>;
          }}
        </NotificationConsumer>
      ),
    );
    tree.find('button').simulate('click');
    expect(serializeSnapshot(tree.find(Modal))).toMatchSnapshot();
  });

  it('Should render a warning popup', () => {
    const tree = mount(
      setProviders(
          <NotificationConsumer>
            {({ notify }) => {
              return <button onClick={()=> {
                notify(
                  'Title',
                  'Message',
                  {
                    type: NOTIFICATION.WARNING,
                  },
                );
              }}></button>;
            }}
          </NotificationConsumer>
      ),
    );
    tree.find('button').simulate('click');
    expect(serializeSnapshot(tree.find(Modal))).toMatchSnapshot();
  });


  it('Should render a success popup', () => {
    const tree = mount(
      setProviders(
        <NotificationConsumer>
          {({ notify }) => {
            return <button onClick={()=> {
              notify(
                'Title',
                'Message',
                {
                  type: NOTIFICATION.SUCCESS,
                },
              );
            }}></button>;
          }}
        </NotificationConsumer>
      ),
    );
    tree.find('button').simulate('click');
    expect(serializeSnapshot(tree.find(Modal))).toMatchSnapshot();
  });

  it('Should render a error popup', () => {
    const tree = mount(
      setProviders(
        <NotificationConsumer>
          {({ notify }) => {
            return <button onClick={()=> {
              notify(
                'Title',
                'Message',
                {
                  type: NOTIFICATION.ERROR,
                },
              );
            }}></button>;
          }}
        </NotificationConsumer>
      ),
    );
    tree.find('button').simulate('click');
    expect(serializeSnapshot(tree.find(Modal))).toMatchSnapshot();
  });

  it('Should set the proper label for the confirm button', () => {
    const tree = mount(
      <AxisTheme>
        <NotificationProvider>
          <NotificationConsumer>
            {({ notify }) => {

              return <button onClick={()=> {
                notify(
                  'Title',
                  'Message',
                  {
                    confirmLabel: "Crazy Label",
                  },
                );
              }}></button>;
            }}
          </NotificationConsumer>
        </NotificationProvider>
      </AxisTheme>
      ,
    );

    tree.find('button').simulate('click');
    expect(serializeSnapshot(tree.find(Modal))).toMatchSnapshot();
  });

});
