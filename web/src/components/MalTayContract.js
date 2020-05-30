import React, { Component } from 'react';
import { View, Item, Input, Text, Button, Icon, Picker } from 'native-base';
import { getProvider } from '../utils/web3.js';
import { getStoredTypes, saveType, executeType } from '../utils/interpreter.js';
import { storeAddress, getAddress } from '../utils/taylor.js';
import * as taylorUtils from 'taylor/taylor/interpreter.js';

const MalTay = '0xebbe8e1d1f0e63185fdff556aaad031682924ab5';

class MalTayContract extends Component {
  constructor(props) {
    super(props);

    this.state = {
      provider: null,
      signer: null,
      addressData: null,
      types: [],
      currentType: {},
      currentUserInputs: null,
      currentSignature: null,
    }

    this.onChangeAddress = this.onChangeAddress.bind(this);
    this.changeCurrentName = this.changeCurrentName.bind(this);
    this.changeCurrentSig = this.changeCurrentSig.bind(this);
    this.onTypeSave = this.onTypeSave.bind(this);
    this.changeUserInputs = this.changeUserInputs.bind(this);
    this.onExecute = this.onExecute.bind(this);
    this.changeCurrentSig2 = this.changeCurrentSig2.bind(this);

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

  changeCurrentName(name) {
    const { currentType } = this.state;
    currentType.name = name;
    this.setState({ currentType });
  }

  changeCurrentSig(signature) {
    const { currentType } = this.state;
    currentType.signature = signature;
    this.setState({ currentType });
  }

  changeCurrentSig2(currentSignature) {
    console.log('changeCurrentSig2', currentSignature);
    this.setState({ currentSignature });
  }

  changeUserInputs(currentUserInputs) {
    this.setState({ currentUserInputs });
  }

  async onExecute() {
    const { currentUserInputs, currentType, provider, addressData, currentSignature } = this.state;
    let args = (currentUserInputs || '').split(',');
    args = taylorUtils.encodeInput(args);
    args = taylorUtils.strip0x(currentSignature || currentType.signature) + args;

    const executeAnswer = await executeType(provider)(addressData.address)(args);
    console.log('executeAnswer', executeAnswer)
    this.setState({ executeAnswer });
  }

  async onTypeSave() {
    const { currentType, signer, addressData } = this.state;
    const { result, errors } = this.props.currentGraph;
    console.log('onTypeSave', currentType, this.props.currentGraph);
    let encodedData;
    if (result.result) {
      const { steps, tr } = result.result[0];
      const {hadc_inputs, user_inputs, prog_steps} = taylorUtils.buildInputs(steps, tr);
      console.log('--- buildInputs ', hadc_inputs, user_inputs, prog_steps);

      encodedData = taylorUtils.buildType(currentType.name, currentType.signature, {hadc_inputs, user_inputs, prog_steps});
      console.log('-----encodedData', encodedData);

      saveType(signer)(addressData.address)(encodedData.encoded);
    }
  }

  render() {
    const {styles} = this.props;
    const { types, addressData, executeAnswer } = this.state;
    const { result, errors } = this.props.currentGraph || {};

    // console.log('types', types);
    const tfunctions = result && result.result && result.result[0] ? result.result[0].tr : {};

    return (
      <View style={{ ...styles}}>
        <View style={{ ...styles, flex: 1 }}>
          <Item style={{ width: styles.width }}>
            <Input
              style={{ color: 'white' }}
              placeholder='name'
              label='name'
              onChangeText={this.changeCurrentName}
            />
          </Item>
          <Item style={{ width: styles.width }}>
            <Input
              style={{ color: 'white' }}
              placeholder='signature'
              label='signature'
              onChangeText={this.changeCurrentSig}
            />
          </Item>
          <Button small light onClick={this.onTypeSave}>
            <Icon name='save' />
          </Button>
        </View>
        <View style={{ ...styles, flex: 1 }}>
          <Item style={{ width: styles.width }}>
            <Input
              value={ addressData ? addressData.address : '' }
              style={{ color: 'white' }}
              placeholder='interpreter address'
              onChangeText={this.onChangeAddress}
            />
          </Item>
          <Text style={{ color: 'grey' }}>{JSON.stringify(types)}</Text>

          <Item picker>
            <Picker
              mode="dropdown"
              style={{ width: styles.width, backgroundColor: 'rgb(169, 169, 169)' }}
              selectedValue={this.state.currentSignature}
              onValueChange={this.changeCurrentSig2}
            >
              <Picker.Item label="select signature" value={''} />
              {
                Object.keys(tfunctions).map(name => {
                  return <Picker.Item label={name} value={tfunctions[name].sig} key={tfunctions[name].sig}/>
                })
              }
            </Picker>
          </Item>

          <Item style={{ width: styles.width }}>
            <Input
              style={{ color: 'white' }}
              placeholder='input'
              label='input'
              onChangeText={this.changeUserInputs}
            />
          </Item>
          <Button small light onClick={this.onExecute}>
            <Icon name='play' />
          </Button>
          <Text style={{ color: 'grey' }}>{JSON.stringify(executeAnswer)}</Text>
        </View>
      </View>
    );
  }
}

export default MalTayContract;
