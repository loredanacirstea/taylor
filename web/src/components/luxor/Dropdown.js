import React, { Component } from 'react';
import { View, Item, Text, Button, Icon, Picker, CheckBox } from 'native-base';



const pickerStyle = {
    backgroundColor: 'rgb(169, 169, 169)',
  }
  
  const btniconStyle = { marginLeft: '10px', marginRight: '10px'}
  
  class Dropdown extends Component {
    constructor(props) {
      super(props);
    }

    render() {
      return (
        <Item picker style={{ borderColor: false, marginRight: '60px' }}>
        <Picker
          mode="dropdown"
          style={{ width: styles.width, ...pickerStyle }}
          selectedValue={this.state.gasprofile}
          onValueChange={this.onChangeGasprofile}
        >
          <Picker.Item label="safe low" value="safeLow" key="safeLow"/>
          <Picker.Item label="average" value="average" key="average"/>
          <Picker.Item label="fast" value="fast" key="fast"/>
          <Picker.Item label="fastest" value="fastest" key="fastest"/>
        </Picker>
      </Item>
      );
    }
  }
  
  export default Dropdown;
  