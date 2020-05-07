import React, { Component } from 'react';
import { View } from 'native-base';
import Editor from './Editor.js';

export default class GraphView extends Component {
  render() {
    const {styles} = this.props;

    return (
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 0,
      }}>
        <Editor styles={{...styles, width: styles.width / 2}} />
      </View>
    );
  }
}
