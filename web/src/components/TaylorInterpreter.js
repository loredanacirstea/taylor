import React, { Component } from 'react';
import { View, Item, Input, Text, Button, Icon } from 'native-base';
import { getProvider } from '../utils/web3.js';
import { getStoredTypes, saveType, executeType } from '../utils/interpreter.js';
import { storeAddress, getAddress } from '../utils/taylor.js';

class TaylorInterpreter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      provider: null,
      signer: null,
      addressData: null,
      types: [],
      currentType: {},
      currentUserInputs: null,
    }

    this.onChangeAddress = this.onChangeAddress.bind(this);
    this.changeCurrentName = this.changeCurrentName.bind(this);
    this.changeCurrentSig = this.changeCurrentSig.bind(this);
    this.onTypeSave = this.onTypeSave.bind(this);
    this.changeUserInputs = this.changeUserInputs.bind(this);
    this.onExecute = this.onExecute.bind(this);

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

  changeUserInputs(currentUserInputs) {
    this.setState({ currentUserInputs });
  }

  async onExecute() {
    const { currentUserInputs, currentType, provider, addressData } = this.state;
    let args = (currentUserInputs || '').split(',');
    args = encodeInput(args);
    args = strip0x(currentType.signature) + args;

    const executeAnswer = await executeType(provider)(addressData.address)(args);
    this.setState({ executeAnswer });
  }

  async onTypeSave() {
    const { currentType, signer, addressData } = this.state;
    const { result, errors } = this.props.currentGraph;
    let encodedData;
    if (result.result) {
      const { steps, tr } = result.result[0];
      const {hadc_inputs, user_inputs, prog_steps} = buildInputs(steps, tr);

      encodedData = buildType(currentType.name, currentType.signature, {hadc_inputs, user_inputs, prog_steps});

      saveType(signer)(addressData.address)(encodedData.encoded);
    }
  }

  render() {
    const {styles} = this.props;
    const { types, addressData, executeAnswer } = this.state;
    console.log('types', types);
    return (
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

        <Item style={{ width: styles.width }}>
          <Input
            style={{ color: 'white' }}
            placeholder='user input'
            label='user input'
            onChangeText={this.changeUserInputs}
          />
        </Item>
        <Button small light onClick={this.onExecute}>
          <Icon name='play' />
        </Button>
        <Text style={{ color: 'grey' }}>{JSON.stringify(executeAnswer)}</Text>
      </View>
    );
  }
}

export default TaylorInterpreter;



function buildInputs(steps, tr) {
  const user_inputs = [];
  const hadc_inputs = [];
  const prog_steps = [];

  console.log('steps', steps)
  steps.forEach(step => {
    console.log('step', step)
    const fname = step[0]
    const args = step[1];
    let arglen = args ? args.length : 0;
    console.log('--arglen', arglen)
    const prog_step = {
      typeid: tr[fname] ? tr[fname].sig : '',
      inputIndexes: [],
    }

    const user_inputs_step = [];
    const hardc_inputs_step = [];
    for ( let i = 0; i < arglen; i ++ ) {
      if (typeof args[i] === 'string' && args[i].substring(0, 2) === 'x_' && args[i].length >= 3) {
        user_inputs_step.push(args[i]);
      } else if (!isNaN(args[i])) {
        hardc_inputs_step.push(args[i]);
      }
    }

    console.log('user_inputs_step', user_inputs_step)
    console.log('hardc_inputs_step', hardc_inputs_step)

    for ( let i = 0; i < arglen; i ++ ) {
      console.log('args[i]', args[i]);

      console.log('user_inputs', user_inputs)
      console.log('hadc_inputs', hadc_inputs)

      if (typeof args[i] === 'string' && args[i].substring(0, 2) === 'x_' && args[i].length >= 3) {
        prog_step.inputIndexes.push(user_inputs.length);
        user_inputs.push(args[i]);
      }
      else if (isNaN(args[i])) {
        prog_step.inputIndexes.push(
          user_inputs_step.length + user_inputs.length
          + hardc_inputs_step.length + hadc_inputs.length
        );
      } else {
        prog_step.inputIndexes.push(
          Math.max(user_inputs_step.length, user_inputs.length)
          + hadc_inputs.length
        );
        hadc_inputs.push(args[i]);

      }
      console.log('999999999', JSON.stringify(hadc_inputs), JSON.stringify(user_inputs))
    };

    if (tr[fname]) {
      prog_steps.push(prog_step);
    }
  });

  return {user_inputs, hadc_inputs, prog_steps};
}

function encode(value, size) {
  return value.toString(16).padStart(size*2, '0');
}

const isInt = value => parseInt(value) === value;
const isUint = value => isInt(value) && (value >= 0);
const isFloat = value => parseFloat(value) === value;

const isIntDyn = value => parseInt(value) == value;
const isUintDyn = value => isIntDyn(value) && (value >= 0);
const isFloatDyn = value => parseFloat(value) == value;


function encodeDynamic(value) {
  if (isUint(value)) return '11000004' + encode(value, 4);
  if (isInt(value)) return '12000004' + encode(value, 4);

  if (isUintDyn(value)) return '11000004' + encode(value, 4);
  if (isIntDyn(value)) return '12000004' + encode(value, 4);

  throw new Error('unsupported type');
}

function strip0x(value) {
  if (value.substring(0, 2) === '0x') {
    return value.substring(2);
  }
}

function encodeInput (args) {
  args = args.map(encodeDynamic);
  console.log('args', args);
  args = 'ee'
    + encode(args.length, 3)
    + args.map((arg, i) => {
        return encode(
          args.slice(0, i+1).reduce((sum, val) => sum + val.length/2, 0),
          4,
        )
      }).join('')
    + args.join('')
  return args;
}

function buildType(name, signature, {user_inputs, hadc_inputs, prog_steps}) {
  let dtype = '';
  let steps = '';
  let hcinputs = encodeInput(hadc_inputs);
  hcinputs = encode(hcinputs.length / 2, 4) + hcinputs;

  dtype += strip0x(signature) + encode(prog_steps.length, 1);
  dtype = encode(dtype.length / 2, 4) + dtype

  prog_steps.forEach(step => {
    steps += step.typeid;
    steps += encode(step.inputIndexes.length, 4)
    step.inputIndexes.forEach(ind => {
      steps += encode(ind, 1)
    });
  })

  steps = encode(steps.length / 2, 4) + steps

  return { dtype, steps, hcinputs, encoded: dtype + hcinputs + steps }
}
