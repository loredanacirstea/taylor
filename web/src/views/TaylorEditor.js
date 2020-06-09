import React, { Component } from 'react';
import { Dimensions, ScrollView } from 'react-native';
import { View, Button, Icon, Text } from 'native-base';
import MonacoEditor from 'react-monaco-editor';
import { editorOpts } from '../utils/config.js';
import MalTayContract from '../components/MalTayContract.js';
import * as taylorUtils from '../utils/taylor.js';
import maltay from '@pipeos/taylor';
import { monacoTaylorExtension } from '../utils/taylor_editor.js';

import ReactJson from 'custom-react-json-view'

const MIN_WIDTH = 800;

class TaylorEditor extends Component {
  constructor(props) {
    super(props);

    const code =  taylorUtils.getCode();
    const encoded = maltay.expr2h(code);

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
    }

    this.onContentSizeChange = this.onContentSizeChange.bind(this);
    this.getWindowDimensions = this.getWindowDimensions.bind(this);
    this.onTextChange = this.onTextChange.bind(this);
    this.execute = this.execute.bind(this);
    this.onRootChange = this.onRootChange.bind(this);

    Dimensions.addEventListener('change', () => {
      this.onContentSizeChange();
    });
  }

  onRootChange(backend, tayinterpreter, malbackend) {
    this.setState({ backend, tayinterpreter, malbackend });
    if (!tayinterpreter && backend !== 'javascript') {
      const errors = "No web3 provider found. Please connect to one (e.g. Metamask).";
      this.setState({ errors });
    } else {
      this.execute({ backend, tayinterpreter, malbackend, errors: '' });
    }
  }

  async executeInner(backend, interpreter, callback, {encdata, code, force=false}={}) {
      encdata = encdata || this.state.encoded;
      code = code || this.state.code;
      const isTransaction = code && code.includes("!");

      if (!isTransaction || backend === 'javascript') {
        let result, error;
        try {
          result = await interpreter.call(code);
        } catch (e) {
          error = e;
        }
        callback({ result, error, encdata })
      
      } else if (force) {
        let response, error, receipt = {};

        try {
          response = await interpreter.send(code);
          callback({ receipt: response })

          receipt = await response.wait();
        } catch (e) {
          error = e;
          callback({ error, encdata })
        }
  
        if (receipt.status === 0) {
          callback({ error: 'Transaction failed', receipt, encdata })
        } else {
          callback({ receipt })
        }
      }
  }

  async execute({backend, tayinterpreter, malbackend, encdata, code, force=false}={}) {
    backend = backend || this.state.backend;
    let interpreters = {
      javascript: malbackend || this.state.malbackend,
      injected: tayinterpreter || this.state.tayinterpreter,
    }

    const getResult =  ({ result, receipt, encdata, errors, backend }) => {
      const resultObj = {};
      if (result) resultObj.result = result;
      if (receipt) resultObj.receipt = receipt;
      if (encdata) resultObj.data = encdata;
      if (backend) resultObj.backend = backend;
      return { resultObj, errors };
    }

    let callb = {
      main: btype => (data) => {
        data.backend = btype;
        const { resultObj, errors } = getResult(data);
        this.setState({ result: resultObj, errors });
      },
      second: btype => (data) => {
        data.backend = btype;
        const { resultObj, errors } = getResult(data);
        this.setState({ result2: resultObj, errors2: errors });
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
  }

  editorWillMount(monaco) {
    monacoTaylorExtension(monaco, maltay.nativeEnv);
  }

  onTextChange(code) {
      try {
        const encoded = maltay.expr2h(code);
        this.setState({ code });
        taylorUtils.storeCode(code);
        this.execute({encdata: encoded, code});
      } catch(e) {}
  }

  render() {
    let {
      width,
      height,
    } = this.state;
    const {code, result, result2, errors, errors2, backend} = this.state;

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
          horizontal={true}
          pagingEnabled={true}
          scrollEnabled={true}
          scrollEventThrottle={100}
          nestedScrollEnabled={true}
          contentContainerStyle={{width: "100%"}}
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
                  fontWeight: 'bold', position: 'relative', left: '50%' 
                }}
              />
            : <div></div>
          }
          <View style={{
            flexDirection: resultFlexDirection,
            justifyContent: "space-between",
            alignItems: "center",
          }}>
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
                  shouldCollapse={field => field.name === 'd' }
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
                    ? <Text style={{color: 'firebrick', fontSize: editorOpts.fontSize }}>{errors}</Text>
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
          />
        </ScrollView>
      </ScrollView>
    );
  }
}

export default TaylorEditor;
