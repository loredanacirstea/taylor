import React, { Component } from 'react';
import { View, Item, Input, Text, Button, Icon, Picker } from 'native-base';
import { getProvider } from '../utils/web3.js';
import { addAddress, getAddresses } from '../utils/taylor.js';
import maltay from 'taylor/maltay/maltay.js';
import { web3util } from '../utils/contract.js';

class MalTayContract extends Component {
  constructor(props) {
    super(props);

    this.state = {
      provider: null,
      signer: null,
      rootAddress: {},
      addresses: {},
      rootFunctions: [],
      addrToBeRegistered: null,
      registered: {},
    }

    this.onChangeAddress = this.onChangeAddress.bind(this);
    this.onChangeCurrentName = this.onChangeCurrentName.bind(this);
    this.onAddressSave = this.onAddressSave.bind(this);
    this.onChangeRootAddress = this.onChangeRootAddress.bind(this);
    this.onChangeRegisteredAddress = this.onChangeRegisteredAddress.bind(this);
    this.onRegister = this.onRegister.bind(this);
  
    this.setWeb3();
  }

  async setWeb3() {
    const { provider, signer } = await getProvider();
    const chainid = (await provider.getNetwork()).chainId;
    const addresses = getAddresses(chainid);
    const rootAddress = {name: addresses.root, address: addresses[addresses.root]};
    this.setState({ addresses, rootAddress, provider, signer });
    
    this._web3util = web3util(provider, signer);
    this.setContract(rootAddress.address);
    this.setRegistered(rootAddress.address);
  }

  setContract(address) {
    address = address || this.state.rootAddress;
    if(!address) {
        this.web3util = null;
    } else {
      this.web3util = this._web3util(address);
      this.props.onRootChange(this.web3util.call, this.web3util.send);

      this.setFunctions(address);
    }
  }

  async setRegistered(address) {
    address = address || this.state.rootAddress.address;
    if (!address) return;

    let count = await this.web3util.call('0x44444440');
    count = parseInt(count, 16);
    let registered = {};

    for (let i = 1; i <= count; i++) {
      const expr = maltay.expr2h('(getregistered ' + i + ')');
      let raddr = await this.web3util.call(expr);
      raddr = '0x' + raddr.substring(10);
      registered[raddr] = raddr;
    }
    this.setState({ registered });
  }

  async setFunctions(address) {
    address = address || this.state.rootAddress.address;
    if (!address) return;

    let logs = await this.web3util.getFns();
    let rootFunctions = logs.map(log => log.name)
      .concat(Object.keys(maltay.nativeEnv));
    this.setState({ rootFunctions });
  }

  async onChangeAddress(address) {
    const { rootAddress } = this.state;
    rootAddress.address = address;
    this.setState({ rootAddress });
  }

  onChangeCurrentName(name) {
    const { rootAddress } = this.state;
    rootAddress.name = name;
    this.setState({ rootAddress });
  }

  async onAddressSave() {
    const { rootAddress } = this.state;
    const { provider  } = this.state;
    const chainid = (await provider.getNetwork()).chainId;

    addAddress(chainid, rootAddress.address, rootAddress.name);
    this.setContract(rootAddress.address);
    this.setRegistered(rootAddress);
  }

  onChangeRootAddress(newval) {
    const { addresses } = this.state;
    const name = Object.keys(addresses).find(name => addresses[name] === newval);
    const rootAddress = { name, address: newval};
    this.setState({ rootAddress });
    this.setContract(rootAddress.address);
    this.setRegistered(newval);
  }

  onChangeRegisteredAddress(newval) {
    this.setState({ addrToBeRegistered: newval });
  }

  async onRegister() {
    const { addrToBeRegistered } = this.state;
    
    const expr = maltay.expr2h('(register! 0x"' + addrToBeRegistered.substring(2) + '")');
    await this.web3util.send(expr);

    // TODO check receipt for success;
    this.setRegistered();
  }

  render() {
    const {styles} = this.props;
    const { rootAddress, addresses, registered, rootFunctions } = this.state;

    return (
      <View style={{ ...styles, fontSize: 18}}>
        <View style={{ ...styles, flex: 1 }}>
          <Item style={{ width: styles.width }}>
            <Input
              style={{ color: 'white' }}
              placeholder='address'
              label='address'
              onChangeText={this.onChangeAddress}
            />
          </Item>
          <Item style={{ width: styles.width }}>
            <Input
              style={{ color: 'white' }}
              placeholder='name'
              label='name'
              onChangeText={this.onChangeCurrentName}
            />
          </Item>
          <Button small light onClick={this.onAddressSave}>
            <Icon name='save' />
          </Button>
        </View>
        <View style={{ ...styles, flex: 1 }}>
          <Item picker>
            <Picker
              mode="dropdown"
              style={{ width: styles.width, backgroundColor: 'rgb(169, 169, 169)' }}
              selectedValue={this.state.rootAddress.name}
              onValueChange={this.onChangeRootAddress}
            >
              <Picker.Item label="select root" value={''} />
              {
                Object.keys(addresses).map(name => {
                  return <Picker.Item label={name} value={addresses[name]} key={name}/>
                })
              }
            </Picker>
          </Item>
          <View style={{ width: styles.width, flex: 1, paddingTop: 10 }}>
            <Text style={{ color: 'beige', fontSize: 18 }}>Root Contract</Text>
            <br></br>
            <Text style={{ color: 'beige', fontSize: 18 }}>{ rootAddress.name || '-' } - { rootAddress.address || '-' }</Text>
          </View>
          <Item picker>
            <Picker
              mode="dropdown"
              style={{ width: styles.width, backgroundColor: 'rgb(169, 169, 169)' }}
              selectedValue={this.state.rootAddress.name}
              onValueChange={this.onChangeRootAddress}
            >
              <Picker.Item label="select registered contract" value={''} />
              {
                Object.keys(registered).map(name => {
                  return <Picker.Item label={name} value={addresses[name]} key={name}/>
                })
              }
            </Picker>
          </Item>
          <Item style={{ width: styles.width }}>
            <Input
              style={{ color: 'white' }}
              placeholder='address'
              label='address'
              onChangeText={this.onChangeRegisteredAddress}
            />
          </Item>
          <Button small light onClick={this.onRegister}>
            <Text>register</Text>
          </Button>
          <View>
              <Text></Text>
          </View>
        </View>
        <View style={{ ...styles, flex: 1 }}>
          <Item picker>
            <Picker
              mode="dropdown"
              style={{ width: styles.width, backgroundColor: 'rgb(169, 169, 169)' }}
            >
              <Picker.Item label="available functions" value={''} />
              {
                rootFunctions.map(name => {
                  return <Picker.Item label={name} value={name} key={name}/>
                })
              }
            </Picker>
          </Item>
        </View>
      </View>
    );
  }
}

export default MalTayContract;
