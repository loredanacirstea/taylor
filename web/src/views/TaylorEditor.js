import React, { Component } from 'react';
import { Dimensions, ScrollView } from 'react-native';
import { View, Button, Icon, Text } from 'native-base';
import MonacoEditor from 'react-monaco-editor';
import { editorOpts } from '../utils/config.js';
import { getProvider } from '../utils/web3.js';
import MalTayContract from '../components/MalTayContract.js';
import * as taylorUtils from '../utils/taylor.js';
import maltay from 'taylor/maltay/maltay.js';
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
      autocompile: true,
      code,
      encoded,
      result: [{data: encoded}],
      errors: '',
      provider: null,
      signer: null,
      rootAddress: null,
      taycall: null,
      taysend: null,
    }

    this.onContentSizeChange = this.onContentSizeChange.bind(this);
    this.getWindowDimensions = this.getWindowDimensions.bind(this);
    this.onTextChange = this.onTextChange.bind(this);
    this.execute = this.execute.bind(this);
    this.onRootChange = this.onRootChange.bind(this);

    Dimensions.addEventListener('change', () => {
      this.onContentSizeChange();
    });

    this.setWeb3();
  }

  async setWeb3() {
    const { provider, signer } = await getProvider();
    this.setState({ provider, signer });
    this.onRootChange();
  }

  onRootChange(taycall, taysend) {
    this.setState({
        taycall,
        taysend,
    });
    this.execute();
  }

  async execute({encdata, code, force=false}={}) {
      encdata = encdata || this.state.encoded;
      code = code || this.state.code;
      const isTransaction = code && code.includes("def!");
      if (!isTransaction) {
        let encoded;
        try {
            encoded = await this.state.taycall(encdata);
        } catch (e) {}
        let result;
        try {
            result = maltay.decode(encoded);
        } catch(e) {}
        this.setState({ result: [{ result, encoded, data: encdata }] });
      } else if (force) {
          let response, receipt = {};
          try {
            response = await this.state.taysend(encdata);
            this.setState({ result: [{ receipt: response }] });
            receipt = await response.wait();
          } catch (e) {}
        
        if (receipt.status === 0) {
            throw new Error('Transaction failed');
        }
        this.setState({ result: [{ receipt }] });

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

    let editorStyles, consoleStyles, panelStyles;
    if (width > MIN_WIDTH) {
      const page = width / 3;
      editorStyles = { width: page * 2, height: height * 2 / 3 };
      consoleStyles = { width: page * 2, height: height - editorStyles.height };
      panelStyles = { width: page, height };
    } else {
      editorStyles = { width, height: height * 2 / 3 };
      consoleStyles = { width, height: height - editorStyles.height };
      panelStyles = { width, height };
    }

    const {code, result, errors, taycall, taysend} = this.state;

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
        <View
        style={{ ...consoleStyles, position: 'fixed', bottom: '0px', left: '0px' }}
        >
          <ScrollView
            horizontal={false}
            scrollEnabled={true}
            scrollEventThrottle={100}
            nestedScrollEnabled={true}
            contentContainerStyle={{ ...consoleStyles, maxHeight: consoleStyles.height, minHeight: consoleStyles.heigth }}
          >
            <ScrollView
              horizontal={true}
              scrollEnabled={true}
              scrollEventThrottle={100}
              contentContainerStyle={{ ...consoleStyles, maxHeight: consoleStyles.height, minHeight: consoleStyles.heigth }}
            >
              {errors
                  ? <Text style={{color: 'firebrick', fontSize: editorOpts.fontSize }}>{errors}</Text>
                  : <ReactJson
                  src={result}
                  name="result"
                  theme="twilight"
                  collapsed={6}
                  shouldCollapse={field => field.name === 'd' }
                  style={{ ...consoleStyles, fontSize: editorOpts.fontSize }}
                  />
              }
            </ScrollView>
          </ScrollView>
        </View>
        <Button
            small
            light
            style={{ position: 'fixed', top: '0px', left: '0px', backgroundColor: 'white',  opacity: this.state.autocompile ? 0.5 : 0.2 }}
            onClick={() => this.execute({force: true})}
        >
            <Icon type="FontAwesome" name='play' />
        </Button>
        <ScrollView
          horizontal={false}
          scrollEnabled={true}
          scrollEventThrottle={100}
          nestedScrollEnabled={true}
          contentContainerStyle={panelStyles}
        >
          <MalTayContract
              taycall={taycall}
              taysend={taysend}
              styles={{...panelStyles}}
              onRootChange={this.onRootChange}
          />
        </ScrollView>
      </ScrollView>
    );
  }
}

export default TaylorEditor;
