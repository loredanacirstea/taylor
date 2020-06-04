import React, { Component } from 'react';
import { View, Item, Input, Text, Button, Icon, Picker } from 'native-base';
import { getProvider } from '../utils/web3.js';
import { addAddress, getAddresses } from '../utils/taylor.js';
import maltay from 'taylor/maltay/maltay.js';
import { web3util } from '../utils/contract.js';
import { editorOpts } from '../utils/config.js';

const textStyle = {
  color: 'beige',
  fontSize: editorOpts.fontSize,
  fontFamily: 'monospace',
}

const pickerStyle = {
  backgroundColor: 'rgb(169, 169, 169)',
}

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

  onChangeRootAddress(newaddress) {
    const { addresses } = this.state;
    const name = Object.keys(addresses).find(name => addresses[name] === newaddress) || newaddress;

    const rootAddress = { name, address: newaddress};
    if (!addresses[name]) {
      addresses[name] = newaddress;
      this.setState({ addresses });
    }
    this.setState({ rootAddress });
    this.setContract(rootAddress.address);
    this.setRegistered(newaddress);
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
    styles.width -= 10;
    const { rootAddress, addresses, registered, rootFunctions } = this.state;

    const addrs = Object.assign({}, addresses);
    delete addrs.root;
    const rootOptions = Object.keys(addrs)
      .map(name => {
        return <Picker.Item label={name} value={addresses[name]} key={name}/>
      })

    return (
        <View style={{ ...styles, flex: 1 }}>
          <Text style={textStyle}>load Root:</Text>
          <Item picker style={{ borderColor: false}}>
            <Picker
              mode="dropdown"
              style={{ width: styles.width, ...pickerStyle }}
              selectedValue={this.state.rootAddress.name}
              onValueChange={this.onChangeRootAddress}
            >
              { rootOptions }
            </Picker>
          </Item>

          <br></br><br></br>
          <Text style={{...textStyle, fontWeight: 'bold', fontSize: textStyle.fontSize + 2}}>Address: { rootAddress.address || '-' }</Text>
          <br></br>
          <Text style={textStyle}>registered contracts:</Text>

          <Item picker style={{ borderColor: false}}>
            <Picker
              mode="dropdown"
              style={{ width: styles.width, ...pickerStyle }}
              selectedValue={this.state.rootAddress.name}
              onValueChange={this.onChangeRootAddress}
            >
              <Picker.Item label="..." value={''} />
              {
                Object.keys(registered).map(name => {
                  return <Picker.Item label={name} value={addresses[name]} key={name}/>
                })
              }
            </Picker>
          </Item>

          <br></br>
          <Text style={textStyle}>environment functions:</Text>
          
          <Item picker style={{ borderColor: false}}>
            <Picker
              mode="dropdown"
              style={{ width: styles.width, ...pickerStyle }}
            >
              <Picker.Item label="..." value={''} />
              {
                rootFunctions.map((name, i) => {
                  return <Picker.Item label={name} value={name} key={i}/>
                })
              }
            </Picker>
          </Item>

          <br></br><br></br><br></br><br></br>
          <Text style={textStyle}>register new Taylor contract in Root:</Text>
          <Item style={{ width: styles.width }}>
            <Input
              style={textStyle}
              placeholder='address'
              label='address'
              onChangeText={this.onChangeRegisteredAddress}
            />
            <Button small light onClick={this.onRegister}>
              <Icon name='save' type='FontAwesome' />
            </Button>
          </Item>
          
          
          <br></br><br></br><br></br>
          <Text style={textStyle}>load/save Taylor contract:</Text>
          <Item style={{ width: styles.width }}>
            <Input
              style={textStyle}
              placeholder='address'
              label='address'
              onChangeText={this.onChangeAddress}
            />
          </Item>
          <Item style={{ width: styles.width, marginBottom: 5 }}>
            <Input
              style={textStyle}
              placeholder='name'
              label='name'
              onChangeText={this.onChangeCurrentName}
            />
          </Item>
          <Button small light onClick={this.onAddressSave}>
            <Icon name='save' />
          </Button>
        </View>
    );
  }
}

export default MalTayContract;
