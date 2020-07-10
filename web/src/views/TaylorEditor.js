import React, { Component } from 'react';
import { Dimensions, ScrollView } from 'react-native';
import { View, Button, Icon, Text, Content, Body, ListItem, CheckBox } from 'native-base';
import MonacoEditor from 'react-monaco-editor';
import { editorOpts, priceApi } from '../utils/config.js';
import MalTayContract from '../components/MalTayContract.js';
import * as taylorUtils from '../utils/taylor.js';
import taylor from '@pipeos/taylor';
import { monacoTaylorExtension } from '../utils/taylor_editor.js';
import ReactJson from 'custom-react-json-view'

const MIN_WIDTH = 800;

const getGasRate = async (currency) => (await (await fetch(priceApi + currency)).json()).ethereum[currency];

class TaylorEditor extends Component {
  constructor(props) {
    super(props);

    const code =  taylorUtils.getCode();
    const encoded = taylor.expr2h(code);
    this.scrollRef = React.createRef();

    this.state = {
      ...this.getWindowDimensions(),
      pageNumber: 3,
      code,
      encoded,
      result: [{data: encoded}],
      errors: '',
      result2: null,
      errors2: '',
      rootAddress: null,
      tayinterpreter: null,
      malbackend: null,
      backend: 'javascript',
      gasprofile: {currency: 'eur', ethrate: null, profile: 'average'},
      functionsToDeploy: this.defaultFToD(),
      currentDeployment: {},
    }

    this.onContentSizeChange = this.onContentSizeChange.bind(this);
    this.getWindowDimensions = this.getWindowDimensions.bind(this);
    this.onTextChange = this.onTextChange.bind(this);
    this.execute = this.execute.bind(this);
    this.onRootChange = this.onRootChange.bind(this);
    this.onFunctionsChange = this.onFunctionsChange.bind(this);
    this.editorDidMount = this.editorDidMount.bind(this);
    this.onGasprofileChange = this.onGasprofileChange.bind(this);
    this.onDeploy = this.onDeploy.bind(this);
    this.onDeployScreen = this.onDeployScreen.bind(this);
    this.onSelectFToD = this.onSelectFToD.bind(this);

    this.editor = null;
    this.monaco = null;

    Dimensions.addEventListener('change', () => {
      this.onContentSizeChange();
    });

    this.setEthrate(this.state.gasprofile);
  }

  defaultFToD() {
    let functionsToDeploy = {};
    Object.keys(taylor.bootstrap_functions).forEach(name => {
      functionsToDeploy[name] = true;
    });
    return functionsToDeploy;
  }

  onRootChange(backend, tayinterpreter, malbackend) {
    this.setState({ backend, tayinterpreter, malbackend });
    if (!tayinterpreter && backend !== 'javascript') {
      const errors = "No web3 provider found. Please connect to one (e.g. Metamask).";
      this.setState({ errors });
    } else {
      this.execute({ backend, tayinterpreter, malbackend, errors: '' });

      if (this.monaco) {
        this.onFunctionsChange(tayinterpreter.functions);
      }
    }
  }

  async setEthrate(gasprofile) {
    gasprofile = gasprofile || this.state.gasprofile;
    const ethrate = await getGasRate(gasprofile.currency);
    gasprofile.ethrate = ethrate;
    this.setState({ gasprofile });
  }

  async onGasprofileChange(gasprofile) {
    const ethrate = await getGasRate(gasprofile.currency);
    gasprofile.ethrate = ethrate;
    this.setState({ gasprofile });
  }

  async getGasCost(interpreter, code, isTransaction) {
    let gas = (await interpreter.estimateGas(code)).toNumber();
    const value = await interpreter.calculateCost(code);

    if (isTransaction) {
      const { currency, profile, ethrate } = this.state.gasprofile;
      const gaspricedata = await(await fetch('https://ethgasstation.info/api/ethgasAPI.json')).json();
      // gasprice / 10 = gwei
      const gasprice = gaspricedata[profile] * 1000000000 / 10; // wei
  
      return { gas, currency, ethrate, gasprice, value };
    }
    return {gas, value};
  }

  onFunctionsChange(functions={}) {
    monacoTaylorExtension(this.monaco, Object.assign({}, functions, taylor.nativeEnv));
  }

  async executeInner(backend, interpreter, callback, {encdata, code, force=false}={}) {
      encdata = encdata || this.state.encoded;
      code = code || this.state.code;
      const isTransaction = code && code.includes("!");
      let gascost;

      if (backend === 'injected') {
        gascost = await this.getGasCost(interpreter, code, isTransaction);
      }

      if (!isTransaction || backend === 'javascript') {
        let result, error;
        try {
          result = await interpreter.call(code, {from: interpreter.signer._address});
        } catch (e) {
          error = e.message;
        }
        callback({ result, error, gascost, encdata })
      
      } else if (force) {
        let response, error, receipt = {};
        try {
          response = await interpreter.send(code, {value: gascost.value, gasPrice: gascost.gasprice});
          callback({ receipt: response, gascost, isTransaction })

          receipt = await response.wait();
        } catch (e) {
          error = e.message;
          callback({ error, encdata })
        }
  
        if (receipt.status === 0) {
          callback({ error: 'Transaction failed', receipt, encdata })
        } else {
          callback({ receipt })
        }
      } else {
        callback({ gascost, encdata, isTransaction })
      }
  }

  async execute({backend, tayinterpreter, malbackend, encdata, code, force=false}={}) {
    backend = backend || this.state.backend;
    let interpreters = {
      javascript: malbackend || this.state.malbackend,
      injected: tayinterpreter || this.state.tayinterpreter,
    }

    const getResult =  ({ result, receipt, encdata, error, backend, gascost, isTransaction }) => {
      const resultObj = {};
      resultObj.result = result;
      if (receipt) resultObj.receipt = receipt;
      if (encdata) resultObj.data = encdata;
      if (backend) resultObj.backend = backend;
      if (gascost) {
        resultObj.gas = gascost.gas;
        
        if (isTransaction) {
          const currency = gascost.currency.toUpperCase();
          resultObj.value = gascost.value;  // wei
          resultObj.cost = {};
          resultObj.cost.gasprice = gascost.gasprice; // wei
          resultObj.cost.eth = (gascost.gas * gascost.gasprice + gascost.value) / 1000000000000000000; // eth // 1000000000;
          resultObj.cost.cost = (resultObj.cost.eth * gascost.ethrate).toString() + ' ' + currency;

          resultObj.value = (resultObj.value / 1000000000000000000).toFixed(18) + ' ETH (fee)';
          resultObj.cost.eth = resultObj.cost.eth.toString() + ' ETH';
          resultObj.cost.ethrate = `${gascost.ethrate} ${currency}/ETH`;
          resultObj.cost.gasprice = (resultObj.cost.gasprice / 1000000000).toString() + ' GWEI';
        }
      }

      return { resultObj, error };
    }

    let callb = {
      main: btype => (data) => {
        data.backend = btype;
        const { resultObj, error } = getResult(data);
        this.setState({ result: resultObj, errors: error });
      },
      second: btype => (data) => {
        data.backend = btype;
        const { resultObj, error } = getResult(data);
        this.setState({ result2: resultObj, errors2: error });
      },
    }

    if (interpreters[backend]) {
      this.executeInner(backend, interpreters[backend], callb.main(), {encdata, code, force});
    } else if (backend === 'both') {
      this.executeInner('javascript', interpreters.javascript, callb.main('javascript'), {encdata, code, force});
      this.executeInner('injected', interpreters.injected, callb.second('web3 provider'), {encdata, code, force});
    }
  }

  onContentSizeChange() {
    this.setState(this.getWindowDimensions());
  }

  getWindowDimensions() {
    let wdims = Dimensions.get('window');
    let rootDims = document.getElementById('TaylorRoot').getBoundingClientRect();

    const dims = {
      width: wdims.width || rootDims.width,
      height: wdims.height || rootDims.height,
    }
    return dims;
  }

  editorDidMount(editor, monaco) {
    editor.focus();
    this.editor = editor;
    this.monaco = monaco;
  }

  editorWillMount(monaco) {
    monacoTaylorExtension(monaco, taylor.nativeEnv);
  }

  onTextChange(code) {
      this.setState({ code });
      taylorUtils.storeCode(code);
      try {
        const encoded = taylor.expr2h(code);
        this.execute({encdata: encoded, code});
      } catch(e) {}
  }

  async onDeployScreen() {
    let { width } = this.state;
    this.scrollRef.current.scrollTo({x: width - 100});
  }

  async onDeploy() {
    const { tayinterpreter, functionsToDeploy } = this.state;
    const ftod = Object.keys(functionsToDeploy).filter(key => functionsToDeploy[key]).map(name => taylor.bootstrap_functions[name]);

    let receipt = await taylor.deploy(tayinterpreter.signer);
    console.log('deploy receipt', receipt);
    let currentDeployment = {address: receipt.contractAddress };
    if (ftod.length > 0) currentDeployment.waiting = true;
    this.setState({ currentDeployment });

    let newtay = taylor.getTaylor(tayinterpreter.provider, tayinterpreter.signer)(receipt.contractAddress);
    
    receipt = await taylor.bootstrap(newtay, ftod);
    console.log('bootstrap receipt', receipt);

    currentDeployment.waiting = false;
    this.setState({ functionsToDeploy: this.defaultFToD(), currentDeployment });
  }

  onSelectFToD(name) {
    let { functionsToDeploy } = this.state;
    functionsToDeploy[name] = !(functionsToDeploy[name] || false);
    this.setState({ functionsToDeploy });
  }

  render() {
    let {
      width,
      height,
    } = this.state;
    const {code, result, result2, errors, errors2, backend, functionsToDeploy, currentDeployment} = this.state;

    let editorStyles = { width, height: height * 4 / 7 };
    let consoleStyles = { width, height: height - editorStyles.height };
    let panelStyles = { width, height };
    
    if (width > MIN_WIDTH) {
      const page = width / 3;
      editorStyles.width = page * 2;
      consoleStyles.width = page * 2;
      panelStyles.width = page;
    }

    let resultFlexDirection = 'row';
    if (backend === 'both' && width <= MIN_WIDTH) {
      resultFlexDirection = 'column';
    }
    
    return (
      <ScrollView
          ref={this.scrollRef}
          horizontal={true}
          pagingEnabled={true}
          scrollEnabled={true}
          scrollEventThrottle={100}
          nestedScrollEnabled={true}
          onContentSizeChange={this.onContentSizeChange}
      >
        <MonacoEditor
            width={editorStyles.width}
            height={editorStyles.height}
            language="taylor"
            theme="vs-dark"
            value={code}
            options={editorOpts}
            onChange={this.onTextChange}
            editorWillMount={this.editorWillMount}
            editorDidMount={this.editorDidMount}
        />

        <View style={{
          ...consoleStyles,
          flex: 1,
          flexDirection: resultFlexDirection,
          position: 'fixed',
          bottom: '0px',
          left: '0px'
        }}>
          {backend === 'both'
            ? <Icon
                name='circle-o'
                type="FontAwesome"
                style={{
                  color: result && result2 && JSON.stringify(result.result) === JSON.stringify(result2.result) ? 'green' : 'red',
                  fontWeight: 'bold', position: 'absolute', left: '47%', top: '-10px', zIndex: 10 
                }}
              />
            : <div></div>
          }
          <ScrollView
            horizontal={false}
            scrollEnabled={true}
            scrollEventThrottle={100}
            nestedScrollEnabled={true}
          >
            {errors
                ? <Text style={{color: 'firebrick', fontSize: editorOpts.fontSize }}>{errors}</Text>
                : <ReactJson
                src={result || {}}
                name={null}
                theme="twilight"
                collapsed={6}
                shouldCollapse={field => field.name === 'cost' }
                style={{ fontSize: editorOpts.fontSize }}
                />
            }
          </ScrollView>
          <ScrollView
            horizontal={false}
            scrollEnabled={true}
            scrollEventThrottle={100}
            nestedScrollEnabled={true}
          >
            {backend === 'both'
              ? (errors2
                  ? <Text style={{color: 'firebrick', fontSize: editorOpts.fontSize }}>{errors2}</Text>
                  : <ReactJson
                  src={result2 || {}}
                  name={null}
                  theme="twilight"
                  collapsed={6}
                  shouldCollapse={field => field.name === 'd' }
                  style={{  fontSize: editorOpts.fontSize }}
                  />
                )
              : <div></div>
            }
          </ScrollView>
        
        </View>

        <Button
            small
            light
            style={{ position: 'fixed', top: '0px', left: '0px', backgroundColor: 'white',  opacity: 0.5 }}
            onClick={() => this.execute({force: true})}
        >
            <Icon style={{ marginLeft: '10px', marginRight: '10px'}} type="FontAwesome" name='play' />
        </Button>
        <ScrollView
          horizontal={false}
          scrollEnabled={true}
          scrollEventThrottle={100}
          nestedScrollEnabled={true}
          contentContainerStyle={panelStyles}
        >
          <MalTayContract
              styles={{...panelStyles}}
              onRootChange={this.onRootChange}
              onFunctionsChange={this.onFunctionsChange}
              onGasprofileChange={this.onGasprofileChange}
              onDeploy={this.onDeployScreen}
          />
        </ScrollView>
        <ScrollView
          horizontal={false}
          scrollEnabled={true}
          scrollEventThrottle={100}
          nestedScrollEnabled={true}
          contentContainerStyle={editorStyles}
        >
          <View style={{
            ...editorStyles,
          }}>
            <Content>
              {
                Object.keys(functionsToDeploy).map(name => {
                  return (<ListItem>
                    <CheckBox
                      checked={functionsToDeploy[name] ? true : false}
                      onClick={() => this.onSelectFToD(name)}
                    />
                    <Body>
                      <Text style={textStyle}>{name}</Text>
                    </Body>
                  </ListItem>)
                })
              }
              
            </Content>
            <br></br>
            <Button light
              onClick={this.onDeploy}
              style={{ width: '55px', marginLeft: '50%' }}
            >
            <Icon name='rocket' type="FontAwesome" />
            </Button>
            {currentDeployment.address
              ? <Text style={textStyle}>Deployed: {currentDeployment.address}</Text>
              : <div></div>
            }
            {currentDeployment.waiting
              ? <Text style={textStyle}>...bootstrapping</Text>
              : <div></div>
            }
          </View>
        </ScrollView>
      </ScrollView>
    );
  }
}

export default TaylorEditor;

const textStyle = {
  color: 'beige',
  fontSize: editorOpts.fontSize,
  fontFamily: 'monospace',
}
