import React, { Component } from 'react';
import { Spinner } from '@centrifuge/axis-spinner';


type PreloaderProps = {
  message: string,
  withSound?: boolean
}


export class Preloader extends Component<PreloaderProps> {

  render() {

    const autoplay = process.env.NODE_ENV !== 'development';

    const { message, withSound } = this.props;
    return <>
      <Spinner message={message} width={'100%'} height={'calc(100vh - 90px)'}/>
      {withSound && <audio src="/sound.mp3" autoPlay={autoplay} loop={true}></audio>}
    </>
  }
}

