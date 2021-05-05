import React, { Component } from 'react';
import { Spinner } from '@centrifuge/axis-spinner';


type PreloaderProps = {
  message: string,
}


export class Preloader extends Component<PreloaderProps> {

  render() {
    const { message } = this.props;
    return <>
      <Spinner message={message} width={'100%'} height={'calc(100vh - 90px)'}/>
    </>

  }
}

