import React, { Component } from 'react';
import { View } from 'native-base';
import Editor from './Editor.js';
import TaylorInterpreter from './TaylorInterpreter.js';

export default class GraphView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentGraph: null,
    }

    this.onGraphChange = this.onGraphChange.bind(this);
  }

  onGraphChange(currentGraph) {
    this.setState({ currentGraph });
  }

  render() {
    const {styles, grammar} = this.props;
    const {currentGraph} = this.state;

    return (
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 0,
      }}>
        <Editor
          grammar={grammar}
          styles={{...styles, width: styles.width / 2}}
          onGraphChange={this.onGraphChange}
        />
        <TaylorInterpreter
          currentGraph={currentGraph}
          styles={{...styles, width: styles.width / 2}}
        />
      </View>
    );
  }
}
