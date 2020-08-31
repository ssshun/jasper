import React from 'react';
import styled from 'styled-components';
import ReactDOM from 'react-dom';
import {AppIPC} from '../../../IPC/AppIPC';
import {TimerUtil} from '../Util/TimerUtil';
import {PlatformUtil} from '../Util/PlatformUtil';

type Props = {
}

type State = {
  show: boolean;
}

export class TrafficLightsSpace extends React.Component<Props, State> {
  state: State = {
    show: false,
  }

  componentDidMount() {
    this.handlePosition();
    AppIPC.onToggleLayout(() => this.handlePosition());
  }

  private async handlePosition() {
    await TimerUtil.sleep(16);
    const el = ReactDOM.findDOMNode(this).parentElement as HTMLElement;
    const rect = el.getBoundingClientRect();
    if (rect.left < TrafficLightSize.width) {
      this.setState({show: true});
    } else {
      this.setState({show: false});
    }
  }

  private handleMaximize() {
    AppIPC.toggleMaximizeWindow();
  }

  render() {
    const display = PlatformUtil.isMac() && this.state.show ? 'block' : 'none';
    return (
      <Root style={{display}} onDoubleClick={() => this.handleMaximize()}/>
    );
  }
}

const TrafficLightSize = {
  width: 70,
  height: 24,
};

const Root = styled.div`
  -webkit-app-region: drag;
  width: ${TrafficLightSize.width}px;
  height: ${TrafficLightSize.height}px;
`;