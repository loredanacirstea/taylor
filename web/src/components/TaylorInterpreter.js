import React, { Component } from 'react';
import { View, Item, Input, Text } from 'native-base';
import { getProvider } from '../utils/web3.js';
import { getStoredTypes } from '../utils/interpreter.js';
import { storeAddress, getAddress } from '../utils/taylor.js';

class TaylorInterpreter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      provider: null,
      signer: null,
      addressData: null,
      types: [],
    }

    this.onChangeAddress = this.onChangeAddress.bind(this);

    this.setWeb3();
  }

  async setWeb3() {
    const { provider, signer } = await getProvider();
    const chainid = (await provider.getNetwork()).chainId;
    const addressData = getAddress(chainid);
    console.log('chainid', chainid, addressData);
    this.setState({ addressData, provider, signer });

    const types = await this.getStoredTypes(provider, addressData);
    this.setState({ types });
  }

  getStoredTypes(provider, addressData) {
    if (!provider || !addressData) {
      ({ provider, addressData } = this.state);
    }
    return getStoredTypes(provider)(addressData);
  }

  async onChangeAddress(address) {
    console.log('onChangeAddress', address);
    const { provider  } = this.state;
    const chainid = (await provider.getNetwork()).chainId;
    storeAddress(chainid, address);
    const addressData = { address, block: 0 };

    this.setState({ addressData })
    const types = await this.getStoredTypes(provider, addressData);
    this.setState({ types });
  }

  render() {
    const {styles} = this.props;
    const { types } = this.state;
    console.log('types', types);
    return (
      <View style={{ ...styles, flex: 1 }}>
        <Item style={{ width: styles.width }}>
          <Input style={{ color: 'white' }} placeholder='interpreter address' onChangeText={this.onChangeAddress} />
        </Item>

        <Text style={{ color: 'grey' }}>{JSON.stringify(types)}</Text>
      </View>
    );
  }
}

export default TaylorInterpreter;
