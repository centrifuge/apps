import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import {AxisTheme} from '@centrifuge/axis-theme';
import { NotificationConsumer, NotificationProvider, NOTIFICATION } from './NotificationContext';
import { shallow, mount } from 'enzyme';
import {Modal} from '@centrifuge/axis-modal'
import {serializeSnapshot} from '../../testing/serialize';


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
                {
                  title: 'Title',
                  message:'Messsge',
                }
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
                  {
                    title: 'Title',
                    message:'Messsge',
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
                {
                  title: 'Title',
                  message:'Messsge',
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
                {
                  title: 'Title',
                  message:'Messsge',
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
                  {
                    title: 'Title',
                    message:'Messsge',
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
